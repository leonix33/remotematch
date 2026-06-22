const env = require('../config/env');
const User = require('../models/User');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loginUrl() {
  const base = env.appUrl.replace(/\/$/, '');
  return `${base}/login`;
}

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
    let reason = err;
    try {
      const parsed = JSON.parse(err);
      reason = parsed.message || parsed.error || err;
    } catch {
      // keep raw text
    }
    return { sent: false, reason };
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

function credentialsHtml({ email, password }) {
  return `<div style="margin:16px 0;padding:16px;border-radius:8px;background:#1e293b;border:1px solid #334155">
    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px">Sign in with:</p>
    <p style="margin:0 0 6px;color:#e2e8f0"><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p style="margin:0;color:#e2e8f0"><strong>Temporary password:</strong> <code style="color:#5eead4">${escapeHtml(password)}</code></p>
  </div>`;
}

async function notifyTeamInvite({ to, name, email, password, invitedByName }) {
  const login = loginUrl();
  const inviter = invitedByName ? escapeHtml(invitedByName) : 'Your team admin';
  const body = `
    Hi ${escapeHtml(name)},<br><br>
    ${inviter} invited you to <strong>${escapeHtml(env.appName)}</strong> — AI-powered remote job intelligence for your team.
    ${credentialsHtml({ email, password })}
    <p style="margin:0;color:#94a3b8;font-size:13px">Use this password for your first login. You can change it later from your profile.</p>
  `;
  return sendEmail({
    to,
    subject: `You're invited to ${env.appName}`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:24px;border-radius:12px">
      <h2 style="color:#5eead4;margin:0 0 12px">Welcome to ${escapeHtml(env.appName)}</h2>
      <p style="color:#94a3b8;line-height:1.5">${body}</p>
      <p style="margin:20px 0 0"><a href="${login}" style="display:inline-block;background:#14b8a6;color:#0f172a;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Log in to ${escapeHtml(env.appName)}</a></p>
      <p style="color:#475569;font-size:12px;margin-top:24px">${escapeHtml(env.appName)} · ${escapeHtml(login)}</p>
    </div>`,
  });
}

async function notifyPasswordReset({ to, name, email, password }) {
  const login = loginUrl();
  const body = `
    Hi ${escapeHtml(name)},<br><br>
    Your ${escapeHtml(env.appName)} password was reset by an admin.
    ${credentialsHtml({ email, password })}
  `;
  return sendEmail({
    to,
    subject: `Your ${env.appName} password was reset`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:24px;border-radius:12px">
      <h2 style="color:#5eead4;margin:0 0 12px">Password reset</h2>
      <p style="color:#94a3b8;line-height:1.5">${body}</p>
      <p style="margin:20px 0 0"><a href="${login}" style="display:inline-block;background:#14b8a6;color:#0f172a;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Log in</a></p>
      <p style="color:#475569;font-size:12px;margin-top:24px">${escapeHtml(env.appName)} · ${escapeHtml(login)}</p>
    </div>`,
  });
}

module.exports = {
  sendEmail,
  sendToUser,
  notifyHighMatch,
  notifyChatInvite,
  notifyInterviewReminder,
  notifyTeamInvite,
  notifyPasswordReset,
  wrapHtml,
};
