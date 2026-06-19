const jobService = require('./jobService');

const SKILL_KEYWORDS = [
  'kubernetes', 'k8s', 'terraform', 'aws', 'gcp', 'azure', 'docker', 'python', 'go', 'golang',
  'linux', 'ci/cd', 'jenkins', 'github actions', 'ansible', 'prometheus', 'grafana', 'datadog',
  'kafka', 'postgresql', 'redis', 'nodejs', 'typescript', 'react', 'sre', 'devops', 'platform',
];

function extractSkills(text) {
  const lower = (text || '').toLowerCase();
  return SKILL_KEYWORDS.filter((k) => lower.includes(k));
}

async function pulse() {
  const jobs = jobService.readJobsFromSqlite(2000);
  const skillCounts = {};
  const companyCounts = {};
  const remoteCount = jobs.filter((j) => /remote/i.test(j.location || '')).length;

  for (const job of jobs) {
    const text = `${job.title} ${job.company} ${job.source}`;
    for (const skill of extractSkills(text)) {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    }
    if (job.company) {
      companyCounts[job.company] = (companyCounts[job.company] || 0) + 1;
    }
  }

  const trendingSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([skill, count]) => ({ skill, count, trend: count > 20 ? 'hot' : count > 8 ? 'rising' : 'steady' }));

  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([company, openings]) => ({ company, openings }));

  const avgMatch =
    jobs.reduce((s, j) => s + (j.matchPct || 0), 0) / (jobs.length || 1);

  return {
    totalJobs: jobs.length,
    remotePercent: Math.round((remoteCount / (jobs.length || 1)) * 100),
    avgMatchPct: Math.round(avgMatch),
    applyToday: jobs.filter((j) => j.emailSection === 'apply_today').length,
    trendingSkills,
    topCompanies,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = { pulse };
