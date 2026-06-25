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

function attachKitToApplyItem(userId, job) {
  const kit = applicationKitStore.get(userId, job.jobId);
  if (!kit?.tailored) return job;
  return {
    ...job,
    cover_letter: kit.coverLetterParagraph || '',
    resume_addendum: kit.resumeAddendum || '',
    application_kit: {
      missingKeywords: kit.missingKeywords || [],
      additiveBullets: kit.additiveBullets || [],
      formatted: kit.formatted || '',
    },
  };
}

module.exports = {
  getKit,
  generateForJob,
  generateOnApprove,
  attachKitToApplyItem,
  findJob,
};
