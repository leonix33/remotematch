const jobSourcesConfig = require('../../config/jobSources');
const { stripHtml } = require('./jobNormalizer');

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), jobSourcesConfig.fetchTimeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'RemoteMatch/1.0 (+https://remotematch.app)',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function rawJob(partial) {
  return { ...partial };
}

async function fetchRemoteOk() {
  const data = await fetchJson('https://remoteok.com/api');
  const jobs = [];
  for (const item of data) {
    if (!item || typeof item !== 'object' || !item.position) continue;
    const tags = (item.tags || []).join(' ');
    jobs.push(
      rawJob({
        id: `remoteok-${item.id}`,
        title: item.position,
        company: item.company || 'Unknown',
        location: item.location || 'Remote',
        applyUrl: item.url,
        source: 'RemoteOK',
        description: stripHtml(`${tags} ${item.description || ''}`),
        skills: item.tags || [],
        postedAt: item.date ? new Date(item.date).toISOString() : null,
        remoteType: 'remote',
        salaryMin: item.salary_min || null,
        salaryMax: item.salary_max || null,
        atsType: 'job-board',
      })
    );
  }
  return jobs;
}

async function fetchRemotive() {
  const data = await fetchJson('https://remotive.com/api/remote-jobs');
  return (data.jobs || []).map((item) =>
    rawJob({
      id: `remotive-${item.id}`,
      title: item.title,
      company: item.company_name || 'Unknown',
      location: item.candidate_required_location || 'Remote',
      applyUrl: item.url,
      source: 'Remotive',
      description: stripHtml(item.description || ''),
      postedAt: item.publication_date || null,
      remoteType: 'remote',
      salaryMin: item.salary_min || null,
      salaryMax: item.salary_max || null,
      atsType: 'job-board',
    })
  );
}

async function fetchGreenhouseBoards(boards = jobSourcesConfig.greenhouseBoards) {
  const jobs = [];
  for (const board of boards) {
    try {
      const data = await fetchJson(
        `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`
      );
      for (const item of data.jobs || []) {
        jobs.push(
          rawJob({
            id: `greenhouse-${board}-${item.id}`,
            title: item.title,
            company: board.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            location: item.location?.name || 'Remote',
            applyUrl: item.absolute_url,
            source: `Greenhouse:${board}`,
            description: stripHtml(item.content || ''),
            postedAt: item.updated_at || item.created_at || null,
            atsType: 'greenhouse',
          })
        );
      }
    } catch {
      /* skip unavailable boards */
    }
  }
  return jobs;
}

async function fetchLeverCompanies(companies = jobSourcesConfig.leverCompanies) {
  const jobs = [];
  for (const company of companies) {
    try {
      const data = await fetchJson(`https://api.lever.co/v0/postings/${company}?mode=json`);
      for (const item of data) {
        jobs.push(
          rawJob({
            id: `lever-${company}-${item.id}`,
            title: item.text,
            company: item.categories?.team || company,
            location: item.categories?.location || 'Remote',
            applyUrl: item.hostedUrl || item.applyUrl,
            source: `Lever:${company}`,
            description: stripHtml(
              (item.lists || []).map((l) => `${l.text} ${(l.content || []).join(' ')}`).join(' ')
            ),
            postedAt: item.createdAt || null,
            atsType: 'lever',
          })
        );
      }
    } catch {
      /* skip */
    }
  }
  return jobs;
}

async function fetchAshbyOrgs(orgs = jobSourcesConfig.ashbyOrgs) {
  const jobs = [];
  for (const org of orgs) {
    try {
      const data = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${org}`);
      for (const item of data.jobs || []) {
        jobs.push(
          rawJob({
            id: `ashby-${org}-${item.id}`,
            title: item.title,
            company: item.companyName || org,
            location: item.location || 'Remote',
            applyUrl: item.jobUrl,
            source: `Ashby:${org}`,
            description: stripHtml(item.descriptionPlain || item.descriptionHtml || ''),
            postedAt: item.publishedAt || null,
            atsType: 'ashby',
          })
        );
      }
    } catch {
      /* skip */
    }
  }
  return jobs;
}

async function fetchWellfound() {
  try {
    const data = await fetchJson(
      'https://wellfound.com/api/startup_jobs?job_listing_slug=&page=1&per_page=50'
    );
    const listings = data.startup_jobs || data.jobs || [];
    return listings.map((item) => {
      const startup = item.startup || {};
      return rawJob({
        id: `wellfound-${item.id || item.slug}`,
        title: item.title || item.role,
        company: startup.name || item.company_name || 'Startup',
        location: item.location || 'Remote',
        applyUrl: item.url || item.job_url || `https://wellfound.com/jobs/${item.id}`,
        source: 'Wellfound',
        description: stripHtml(item.description || ''),
        postedAt: item.published_at || item.created_at || null,
        remoteType: /remote/i.test(item.remote_policy || '') ? 'remote' : 'unknown',
        atsType: 'wellfound',
      });
    });
  } catch {
    return [];
  }
}

async function fetchWorkAtAStartup() {
  try {
    const data = await fetchJson('https://www.workatastartup.com/api/jobs');
    const listings = Array.isArray(data) ? data : data.jobs || [];
    return listings.slice(0, 100).map((item) =>
      rawJob({
        id: `yc-${item.id}`,
        title: item.title || item.role,
        company: item.company_name || item.startup?.name || 'YC Startup',
        location: item.location || 'Remote',
        applyUrl: item.url || `https://www.workatastartup.com/jobs/${item.id}`,
        source: 'YC Work at a Startup',
        description: stripHtml(item.description || ''),
        postedAt: item.created_at || null,
        atsType: 'workatastartup',
      })
    );
  } catch {
    return [];
  }
}

async function fetchUsajobs() {
  const { usajobsApiKey, usajobsEmail, usajobsKeyword } = jobSourcesConfig;
  if (!usajobsApiKey || !usajobsEmail) return [];

  const params = new URLSearchParams({
    Keyword: usajobsKeyword,
    LocationName: 'United States',
    Page: '1',
    ResultsPerPage: '50',
  });

  const data = await fetchJson(`https://data.usajobs.gov/api/search?${params}`, {
    headers: {
      'User-Agent': usajobsEmail,
      'Authorization-Key': usajobsApiKey,
      Host: 'data.usajobs.gov',
    },
  });

  return (data.SearchResult?.SearchResultItems || []).map((wrap) => {
    const item = wrap.MatchedObjectDescriptor || {};
    const ids = item.PositionID || item.MatchedObjectId;
    return rawJob({
      id: `usajobs-${ids}`,
      title: item.PositionTitle,
      company: item.OrganizationName || 'US Federal',
      location: (item.PositionLocationDisplay || 'United States').slice(0, 120),
      applyUrl: item.PositionURI,
      source: 'USAJobs',
      description: stripHtml(
        `${item.QualificationSummary || ''} ${item.UserArea?.Details?.MajorDuties || ''}`
      ),
      postedAt: item.PublicationStartDate || null,
      remoteType: /remote|telework/i.test(item.PositionOfferingType || '') ? 'remote' : 'onsite',
      atsType: 'usajobs',
    });
  });
}

const SOURCE_FETCHERS = {
  remoteok: fetchRemoteOk,
  remotive: fetchRemotive,
  greenhouse: fetchGreenhouseBoards,
  lever: fetchLeverCompanies,
  ashby: fetchAshbyOrgs,
  wellfound: fetchWellfound,
  workatastartup: fetchWorkAtAStartup,
  usajobs: fetchUsajobs,
};

module.exports = {
  fetchJson,
  SOURCE_FETCHERS,
  fetchRemoteOk,
  fetchRemotive,
  fetchGreenhouseBoards,
  fetchLeverCompanies,
  fetchAshbyOrgs,
  fetchWellfound,
  fetchWorkAtAStartup,
  fetchUsajobs,
};
