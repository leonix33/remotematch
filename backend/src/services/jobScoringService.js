/**
 * Per-user job scoring — mirrors Python profile scoring at a high level.
 */
const { extractSkillsFromText } = require('./resumeParseService');

function normalize(text = '') {
  return String(text).toLowerCase();
}

function scoreJobForProfile(job, profile) {
  const title = normalize(job.title);
  const company = normalize(job.company);
  const location = normalize(job.location);
  const resumeBlob = normalize(profile?.resumeText || '');
  const blob = normalize(`${job.title} ${job.company} ${job.source} ${job.description || ''}`);

  const targetTitles = (profile?.targetTitles || []).map(normalize).filter(Boolean);
  const mustSkills = (profile?.mustHaveSkills || []).map(normalize).filter(Boolean);
  const niceSkills = (profile?.niceToHaveSkills || []).map(normalize).filter(Boolean);
  const targetCompanies = (profile?.targetCompanies || []).map(normalize).filter(Boolean);
  const resumeSkills = (
    profile?.extractedSkills?.length
      ? profile.extractedSkills
      : extractSkillsFromText(profile?.resumeText || '').all
  ).map(normalize);

  let score = 0;
  const strengths = [];
  const gaps = [];

  if (targetTitles.some((t) => title.includes(t) || t.split(' ').every((w) => title.includes(w)))) {
    score += 40;
    strengths.push('Title match');
  } else if (targetTitles.length) {
    gaps.push('Title stretch');
  } else if (resumeBlob && targetTitles.length === 0) {
    const resumeTitles = ['devops', 'sre', 'platform', 'cloud', 'infrastructure'];
    if (resumeTitles.some((t) => title.includes(t) && resumeBlob.includes(t))) {
      score += 20;
      strengths.push('Resume role fit');
    }
  }

  let mustHits = 0;
  for (const skill of mustSkills) {
    if (blob.includes(skill) || resumeBlob.includes(skill)) {
      mustHits += 1;
      score += Math.min(35 / Math.max(mustSkills.length, 1), 12);
    } else {
      gaps.push(skill);
    }
  }
  if (mustHits >= 3) strengths.push(`${mustHits} must-have skills`);

  for (const skill of niceSkills) {
    if (blob.includes(skill) || resumeBlob.includes(skill)) score += 2;
  }

  let resumeHits = 0;
  for (const skill of resumeSkills.slice(0, 20)) {
    if (blob.includes(skill)) {
      resumeHits += 1;
      score += 2;
    }
  }
  if (resumeHits >= 4) strengths.push(`${resumeHits} resume skills match`);

  if (/remote|anywhere|distributed/.test(location) || /remote/.test(blob)) {
    score += 15;
    strengths.push('Remote');
  }

  if (targetCompanies.some((c) => company.includes(c))) {
    score += 10;
    strengths.push('Target company');
  }

  if (job.freshnessScore >= 75) {
    score += 5;
    strengths.push('Fresh posting');
  }

  if (job.description) score += Math.min(10, Math.floor(job.description.length / 200));
  if ((job.qualityScore || 0) >= 60) score += 5;

  const personalMatchPct = Math.min(100, Math.round(score));
  const minMatch = profile?.minMatchScore || 60;
  let emailSection = 'manual_browse';
  if (personalMatchPct >= 80) emailSection = 'apply_today';
  else if (personalMatchPct >= minMatch) emailSection = 'strong_review';

  return {
    ...job,
    agentMatchPct: job.matchPct || 0,
    personalMatchPct,
    matchPct: personalMatchPct,
    emailSection,
    strengths: strengths.slice(0, 5),
    gaps: gaps.slice(0, 5),
  };
}

function scoreJobsForProfile(jobs, profile) {
  return jobs
    .map((j) => scoreJobForProfile(j, profile))
    .sort((a, b) => b.personalMatchPct - a.personalMatchPct);
}

module.exports = { scoreJobForProfile, scoreJobsForProfile };
