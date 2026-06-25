const SEEN_KEY = 'linkedinSeenJobKeys';
const WATCH_KEY = 'linkedinWatchEnabled';
const DEBOUNCE_MS = 2500;

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiBase', 'accessToken', 'linkedinWatchEnabled'], resolve);
  });
}

async function ingestLinkedInJobs(jobs) {
  const { apiBase, accessToken } = await getSettings();
  if (!apiBase || !accessToken || !jobs.length) {
    return { ok: false, reason: 'not_configured' };
  }

  const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/approvals/linkedin-ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ jobs, notify: true }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return { ok: true, data };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'INGEST_LINKEDIN_JOBS') {
    ingestLinkedInJobs(msg.jobs)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  return false;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.linkedinWatchEnabled) {
    chrome.tabs.query({ url: '*://*.linkedin.com/jobs/*' }, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) chrome.tabs.sendMessage(tab.id, { type: 'WATCH_SETTING_CHANGED' }).catch(() => {});
      }
    });
  }
});
