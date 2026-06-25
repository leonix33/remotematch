const notificationService = require('./notificationService');
const pushService = require('./pushService');

function approvalsLink(jobId) {
  return `/approvals?jobId=${encodeURIComponent(jobId)}`;
}

async function notifyQueuedJob(userId, job) {
  const { jobId, title, company, source, matchPct, interviewLikelihoodPct, isNew } = job;
  if (isNew === false) return { notified: false, reason: 'already_queued' };

  const isLinkedIn = source === 'linkedin' || source === 'chrome-extension';
  const matchLine =
    matchPct > 0
      ? `${matchPct}% match${interviewLikelihoodPct ? ` · ${interviewLikelihoodPct}% likelihood` : ''}`
      : 'Tap to review in Apply Queue';

  const link = approvalsLink(jobId);
  const pushTitle = isLinkedIn ? 'New LinkedIn job' : 'Job queued';
  const pushBody = `${title || 'Role'} @ ${company || 'Company'} — ${matchLine}`;

  await notificationService.create(userId, {
    type: 'queue_job',
    title: pushTitle,
    body: pushBody,
    link,
    meta: { jobId, source: source || 'extension' },
  });

  const pushResult = await pushService.sendToUser(userId, {
    title: pushTitle,
    body: pushBody,
    url: link,
  });

  return { notified: true, push: pushResult };
}

module.exports = { notifyQueuedJob, approvalsLink };
