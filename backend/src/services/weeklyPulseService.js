const User = require('../models/User');
const emailService = require('./emailService');
const marketPulseService = require('./marketPulseService');
const env = require('../config/env');

let lastSentWeek = '';

async function sendWeeklyPulse() {
  if (!env.mongoUri || !emailService.isEmailConfigured()) return;

  const now = new Date();
  const weekKey = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`;
  if (lastSentWeek === weekKey) return;
  if (now.getDay() !== 0) return; // Sunday only

  const pulse = await marketPulseService.pulse();
  const skills = pulse.trendingSkills?.slice(0, 8).map((s) => `${s.skill} (${s.count})`).join(', ') || 'N/A';
  const companies = pulse.topCompanies?.slice(0, 5).map((c) => c.company).join(', ') || 'N/A';

  const users = await User.find({ active: true }).select('email name');
  for (const user of users) {
    if (!user.email) continue;
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: `remotelymatch weekly pulse — ${pulse.totalJobs} jobs tracked`,
        html: emailService.wrapHtml(
          'Weekly market pulse',
          `<strong>${pulse.totalJobs}</strong> jobs in feed · <strong>${pulse.remotePercent}%</strong> remote · Avg match <strong>${pulse.avgMatchPct}%</strong><br><br>
          <strong>Hot skills:</strong> ${skills}<br>
          <strong>Top hiring:</strong> ${companies}`,
          '/intelligence'
        ),
      });
    } catch {
      /* skip */
    }
  }
  lastSentWeek = weekKey;
}

function startWeeklyPulseCron() {
  if (!env.mongoUri) return;
  sendWeeklyPulse();
  setInterval(sendWeeklyPulse, 6 * 60 * 60 * 1000);
}

module.exports = { sendWeeklyPulse, startWeeklyPulseCron };
