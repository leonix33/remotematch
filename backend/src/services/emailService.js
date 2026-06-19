const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const User = require('../models/User');

async function sendEmail({ to, subject, html }) {
  if (!env.resendApiKey || !to) return { sent: false, reason: 'email not configured' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.emailFrom,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email failed: ${err}`);
  }
  return { sent: true };
}

async function sendToUser(userId, subject, html) {
  if (!env.mongoUri) return { sent: false };
  const user = await User.findById(userId).select('email name');
  if (!user?.email) return { sent: false };
  return sendEmail({ to: user.email, subject, html });
}

function wrapHtml(title, body, link) {
  const appUrl = env.appUrl;
  const cta = link ? `<p><a href="${appUrl}${link}" style="color:#2dd4bf">Open in RemoteMatch →</a></p>` : '';
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:24px;border-radius:12px">
    <h2 style="color:#5eead4;margin:0 0 12px">${title}</h2>
    <p style="color:#94a3b8;line-height:1.5">${body}</p>
    ${cta}
    <p style="color:#475569;font-size:12px;margin-top:24px">RemoteMatch · ${appUrl}</p>
  </div>`;
}

async function notifyHighMatch(userId, { title, company, matchPct }) {
  return sendToUser(
    userId,
    `🔥 ${matchPct}% match: ${title}`,
    wrapHtml('High-match job alert', `<strong>${title}</strong> at ${company} — ${matchPct}% personal match. Review in your apply queue.`, '/approvals')
  );
}

async function notifyChatInvite(userId, { fromName, intro }) {
  return sendToUser(
    userId,
    `${fromName} wants to chat on RemoteMatch`,
    wrapHtml('New chat invite', `${fromName} sent you a message request.${intro ? `<br><br><em>"${intro}"</em>` : ''}`, '/chat')
  );
}

async function notifyInterviewReminder(userId, { title, when, location }) {
  return sendToUser(
    userId,
    `Reminder: ${title}`,
    wrapHtml('Upcoming event', `<strong>${title}</strong><br>${when}${location ? `<br>${location}` : ''}`, '/calendar')
  );
}

module.exports = { sendEmail, sendToUser, notifyHighMatch, notifyChatInvite, notifyInterviewReminder, wrapHtml };
