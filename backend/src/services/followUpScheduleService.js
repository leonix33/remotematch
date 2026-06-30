const followUpScheduleStore = require('./followUpScheduleStore');
const notificationService = require('./notificationService');

async function scheduleForApplication(userId, job, appliedAt) {
  if (!job?.jobId) return null;
  return followUpScheduleStore.schedule(userId, job.jobId, {
    appliedAt,
    title: job.title,
    company: job.company,
  });
}

async function processDueReminders(userId) {
  const now = Date.now();
  const rows = followUpScheduleStore.listForUser(userId);
  let created = 0;

  for (const row of rows) {
    if (row.reminderSent) continue;
    if (new Date(row.scheduledFor).getTime() > now) continue;

    await notificationService.create(userId, {
      type: 'follow_up',
      title: `Follow up: ${row.title || 'application'}`,
      body: `${row.company || 'Company'} — your day-5 follow-up is ready. Open Follow-ups for your pre-drafted email and contacts.`,
      link: '/follow-ups',
      meta: { jobId: row.jobId, company: row.company, scheduled: true },
    });

    followUpScheduleStore.markReminderSent(userId, row.jobId);
    created += 1;
  }

  return { created };
}

function scheduleMeta(userId, jobId) {
  const row = followUpScheduleStore.get(userId, jobId);
  if (!row) return null;
  const now = Date.now();
  const dueAt = new Date(row.scheduledFor).getTime();
  const daysUntil = Math.ceil((dueAt - now) / 86400000);
  return {
    ...row,
    daysUntil,
    isDue: dueAt <= now,
    isUpcoming: dueAt > now && daysUntil <= 2,
  };
}

module.exports = {
  scheduleForApplication,
  processDueReminders,
  scheduleMeta,
  FOLLOW_UP_DAYS: followUpScheduleStore.FOLLOW_UP_DAYS,
};
