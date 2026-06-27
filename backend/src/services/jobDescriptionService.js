const jobSourcesConfig = require('../config/jobSources');
const { USER_AGENT } = require('../constants/brand');

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), jobSourcesConfig.fetchTimeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function stripHtml(html = '') {
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseGreenhouse(url) {
  const match = url.match(/greenhouse\.io\/([^/]+)\/jobs\/(\d+)/i);
  if (!match) return null;
  return { board: match[1], jobId: match[2] };
}

function parseLever(url) {
  const match = url.match(/jobs\.lever\.co\/([^/]+)\/([a-f0-9-]+)/i);
  if (!match) return null;
  return { company: match[1], postingId: match[2] };
}

function parseAshby(url) {
  const match = url.match(/jobs\.ashbyhq\.com\/([^/]+)\/([a-f0-9-]+)/i);
  if (!match) return null;
  return { org: match[1], postingId: match[2] };
}

async function fetchGreenhouseDescription(url) {
  const parsed = parseGreenhouse(url);
  if (!parsed) return '';
  try {
    const data = await fetchJson(
      `https://boards-api.greenhouse.io/v1/boards/${parsed.board}/jobs/${parsed.jobId}`
    );
    return stripHtml(data.content || '');
  } catch {
    return '';
  }
}

async function fetchLeverDescription(url) {
  const parsed = parseLever(url);
  if (!parsed) return '';
  try {
    const data = await fetchJson(`https://api.lever.co/v0/postings/${parsed.company}/${parsed.postingId}`);
    return stripHtml(
      [data.descriptionPlain, data.description, data.lists?.map((l) => l.content).join(' ')].filter(Boolean).join(' ')
    );
  } catch {
    return '';
  }
}

async function fetchAshbyDescription(url) {
  const parsed = parseAshby(url);
  if (!parsed) return '';
  try {
    const data = await fetchJson('https://jobs.ashbyhq.com/api/non-user-graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'JobPosting',
        variables: { jobPostingId: parsed.postingId, organizationHostedJobsPageName: parsed.org },
        query:
          'query JobPosting($jobPostingId: String!, $organizationHostedJobsPageName: String!) { jobPosting(jobPostingId: $jobPostingId, organizationHostedJobsPageName: $organizationHostedJobsPageName) { title descriptionHtml } }',
      }),
    });
    return stripHtml(data?.data?.jobPosting?.descriptionHtml || '');
  } catch {
    return '';
  }
}

async function resolveJobDescription(job) {
  const url = job?.url || '';
  const existing = (job?.description || '').trim();
  if (existing.length >= 80) return existing.slice(0, 12000);

  if (!url) {
    return `${job?.title || ''} at ${job?.company || ''}`.trim();
  }

  const lower = url.toLowerCase();
  let description = '';
  if (lower.includes('greenhouse.io')) description = await fetchGreenhouseDescription(url);
  else if (lower.includes('lever.co')) description = await fetchLeverDescription(url);
  else if (lower.includes('ashbyhq.com')) description = await fetchAshbyDescription(url);

  if (description.length >= 80) return description.slice(0, 12000);

  const fallback = [
    job?.title,
    job?.company,
    job?.source,
    job?.location,
    `URL: ${url}`,
  ]
    .filter(Boolean)
    .join('\n');
  return fallback.slice(0, 4000);
}

module.exports = { resolveJobDescription };
