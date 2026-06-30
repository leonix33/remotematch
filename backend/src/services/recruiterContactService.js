function normalizeText(value = '') {
  return String(value || '').trim();
}

function extractEmails(text = '') {
  const matches = String(text).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  return [...new Set(matches.map((e) => e.toLowerCase()))].filter(
    (e) => !e.endsWith('@example.com') && !e.includes('noreply') && !e.includes('no-reply')
  );
}

function domainFromUrl(url = '') {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    const atsHosts = ['greenhouse.io', 'lever.co', 'ashbyhq.com', 'myworkdayjobs.com', 'icims.com'];
    if (atsHosts.some((h) => host.endsWith(h))) return '';
    const parts = host.split('.');
    if (parts.length >= 2) return parts.slice(-2).join('.');
    return host;
  } catch {
    return '';
  }
}

function companySlug(company = '') {
  return String(company || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 32);
}

function extractPeopleHints(text = '') {
  const hints = [];
  const emailNamePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:at|@)\s+[a-z0-9._%+-]+@/gi;
  let match;
  while ((match = emailNamePattern.exec(text)) !== null) {
    const name = normalizeText(match[1]);
    if (name.length >= 3) {
      hints.push({ name, role: 'recruiter or hiring contact', source: 'job_description', confidence: 'medium' });
    }
  }

  const rolePatterns = [
    /(?:recruiter|hiring manager|talent partner)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[-–—]\s*(?:recruiter|talent|hiring manager)/gi,
  ];
  for (const pattern of rolePatterns) {
    while ((match = pattern.exec(text)) !== null) {
      const name = normalizeText(match[1]);
      if (name.length >= 3 && name.length <= 40) {
        hints.push({ name, role: 'recruiter or hiring contact', source: 'job_description', confidence: 'medium' });
      }
    }
  }

  const seen = new Set();
  return hints.filter((h) => {
    const key = h.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function linkedInPeopleSearchUrl(job = {}) {
  const company = normalizeText(job.company);
  const title = normalizeText(job.title);
  const q = encodeURIComponent(`${company} recruiter ${title}`.trim());
  return `https://www.linkedin.com/search/results/people/?keywords=${q}`;
}

function linkedInCompanyPeopleUrl(job = {}) {
  const company = normalizeText(job.company);
  if (!company) return linkedInPeopleSearchUrl(job);
  const q = encodeURIComponent(company);
  return `https://www.linkedin.com/search/results/people/?keywords=${q}%20recruiting`;
}

function guessCompanyInboxes(job = {}, domain = '') {
  const d = domain || domainFromUrl(job.url || job.applyUrl || job.jobUrl || '');
  const slug = companySlug(job.company);
  if (!d && !slug) return [];

  const host = d || `${slug}.com`;
  const patterns = [
    { email: `careers@${host}`, role: 'careers inbox', confidence: 'low' },
    { email: `talent@${host}`, role: 'talent team', confidence: 'low' },
    { email: `recruiting@${host}`, role: 'recruiting', confidence: 'low' },
  ];
  return patterns;
}

function discoverContacts({ job = {}, jobDescription = '' } = {}) {
  const text = normalizeText(jobDescription);
  const emails = extractEmails(text).map((email) => ({
    email,
    name: '',
    role: 'listed on job posting',
    source: 'job_description',
    confidence: 'high',
  }));

  const people = extractPeopleHints(text).map((p) => ({
    ...p,
    email: '',
  }));

  const domain = domainFromUrl(job.url || job.applyUrl || job.jobUrl || '');
  const guessed = guessCompanyInboxes(job, domain);

  const linkedInSearchUrl = linkedInPeopleSearchUrl(job);
  const linkedInCompanyUrl = linkedInCompanyPeopleUrl(job);

  return {
    emails,
    people,
    guessedEmails: guessed,
    linkedInSearchUrl,
    linkedInCompanyUrl,
    companyDomain: domain || null,
  };
}

module.exports = {
  discoverContacts,
  extractEmails,
  extractPeopleHints,
  linkedInPeopleSearchUrl,
  linkedInCompanyPeopleUrl,
  domainFromUrl,
};
