const env = require('./env');

function parseList(value, fallback = []) {
  if (!value) return fallback;
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = {
  greenhouseBoards: parseList(process.env.JOB_GREENHOUSE_BOARDS, [
    'datadog',
    'cloudflare',
    'gitlab',
    'mongodb',
    'elastic',
    'databricks',
  ]),
  leverCompanies: parseList(process.env.JOB_LEVER_BOARDS, ['netflix', 'stripe', 'palantir']),
  ashbyOrgs: parseList(process.env.JOB_ASHBY_BOARDS, ['openai', 'notion', 'ramp']),
  usajobsKeyword: process.env.USAJOBS_KEYWORD || 'devops OR cloud OR kubernetes',
  usajobsApiKey: process.env.USAJOBS_API_KEY || '',
  usajobsEmail: process.env.USAJOBS_USER_EMAIL || env.adminEmail || '',
  fetchTimeoutMs: Number(process.env.JOB_FETCH_TIMEOUT_MS) || 15000,
  enabledSources: parseList(process.env.JOB_SOURCES_ENABLED, [
    'remoteok',
    'remotive',
    'greenhouse',
    'lever',
    'ashby',
    'wellfound',
    'workatastartup',
    'usajobs',
  ]),
};
