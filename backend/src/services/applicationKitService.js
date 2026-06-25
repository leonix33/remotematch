const profileService = require('./profileService');
const jobService = require('./jobService');
const localApprovalService = require('./localApprovalService');
const applicationKitStore = require('./applicationKitStore');
const jobDescriptionService = require('./jobDescriptionService');
const resumeTailorService = require('./resumeTailorService');

async function findJob(userId, jobId) {
  const fromFeed = jobService.readJobsFromSqlite(5000).find((j) => j.jobId === jobId);
  if (fromFeed) return fromFeed;

  const approval = localApprovalService.get(userId, jobId);
  if (approval) {
    return {
      jobId: approval.jobId,
      title: approval.title,
      company: approval.company,
      url: approval.url,
      matchPct: approval.matchPct || 0,
      source: approval.source,
      atsType: approval.atsType,
    };
  }
  return null;
}

function getKit(userId, jobId) {
  return applicationKitStore.get(userId, jobId);
}

async function generateForJob(userId, jobId, options = {}) {
  const { tailorResume = true, force = false } = options;

  if (!tailorResume) {
    return {
      jobId,
      tailored: false,
      mode: 'none',
      message: 'Resume tailoring is off for this application.',
    };
  }

  const existing = applicationKitStore.get(userId, jobId);
  if (existing?.tailored && !force) {
    return existing;
  }

  const profile = await profileService.getOrCreate(userId);
  if (!(profile?.resumeText || '').trim() || profile.resumeText.trim().length < 50) {
    const err = new Error('Add your resume in Profile before generating a tailored application kit.');
    err.status = 400;
    throw err;
  }

  const job = await findJob(userId, jobId);
  if (!job) {
    const err = new Error('Job not found');
    err.status = 404;
    throw err;
  }

  const jobDescription = await jobDescriptionService.resolveJobDescription(job);
  const kit = await resumeTailorService.generateAdditiveKit({ profile, job, jobDescription });

  const saved = applicationKitStore.set(userId, jobId, {
    ...kit,
    jobId,
    jobTitle: job.title,
    company: job.company,
    jobUrl: job.url,
    formatted: resumeTailorService.formatKitAsText(kit),
    generatedAt: new Date().toISOString(),
  });

  return saved;
}

async function generateOnApprove(userId, jobId, tailorResume) {
  if (!tailorResume) return null;
  try {
    return await generateForJob(userId, jobId, { tailorResume: true });
  } catch (err) {
    console.warn(`Application kit generation failed for ${jobId}:`, err.message);
    return null;
  }
}

function attachKitToApplyItem(userId, job, options = {}) {
  const { useTailoredResume = false } = options;
  const base = {
    ...job,
    use_tailored_resume: useTailoredResume,
  };
  if (!useTailoredResume) return base;

  const kit = applicationKitStore.get(userId, job.id || job.jobId);
  if (!kit?.tailored) return base;

  return {
    ...base,
    cover_letter: kit.coverLetterParagraph || '',
    resume_addendum: kit.fullSupplementText || kit.resumeAddendum || '',
    application_kit: {
      pageCount: kit.pageCount,
      missingKeywords: kit.missingKeywords || [],
      additiveBullets: kit.additiveBullets || [],
      formatted: kit.formatted || '',
    },
  };
}

async function prepareApplyItems(userId, jobs, options = {}) {
  const { useTailoredResume = false } = options;
  if (!useTailoredResume) {
    return {
      items: jobs.map((job) => attachKitToApplyItem(userId, job, { useTailoredResume: false })),
      tailoredCount: 0,
      missingKitCount: 0,
    };
  }

  let tailoredCount = 0;
  let missingKitCount = 0;

  const items = [];
  for (const job of jobs) {
    const jobId = job.jobId || job.id;
    let kit = applicationKitStore.get(userId, jobId);
    if (!kit?.tailored) {
      try {
        kit = await generateForJob(userId, jobId, { tailorResume: true });
      } catch {
        missingKitCount += 1;
      }
    }
    if (kit?.tailored) tailoredCount += 1;
    else missingKitCount += 1;

    const applyBase = {
      id: jobId,
      title: job.title,
      company: job.company,
      location: job.location || 'Remote',
      url: job.url,
      source: job.source,
      score: job.score || 50,
      tier: job.tier || 'SECONDARY',
      match_pct: job.personalMatchPct || job.matchPct || 0,
      ats_type: job.atsType || job.ats_type,
      email_section: job.emailSection || job.email_section || 'strong_review',
    };
    items.push(attachKitToApplyItem(userId, applyBase, { useTailoredResume: true }));
  }

  return { items, tailoredCount, missingKitCount };
}

module.exports = {
  getKit,
  generateForJob,
  generateOnApprove,
  attachKitToApplyItem,
  prepareApplyItems,
  findJob,
};
