const env = require('../config/env');
const User = require('../models/User');

function isAppOrSystemEmail(email) {
  if (!email) return true;
  const e = email.trim().toLowerCase();
  if (!e.includes('@')) return true;
  if (e === env.adminEmail?.toLowerCase()) return true;
  if (e.endsWith('@example.com')) return true;
  if (e.includes('@resend.dev')) return true;
  if (e.includes('onboarding@')) return true;
  const fromMatch = env.emailFrom?.match(/<([^>]+)>/);
  if (fromMatch && fromMatch[1].toLowerCase() === e) return true;
  return false;
}

function resolveContactEmail(profile, authEmail) {
  const candidates = [
    profile?.digestEmail?.trim(),
    profile?.notificationEmail?.trim(),
    authEmail?.trim(),
  ].filter(Boolean);

  for (const email of candidates) {
    if (!isAppOrSystemEmail(email)) return email;
  }
  return candidates.find((e) => !isAppOrSystemEmail(e)) || candidates[0] || '';
}

async function resolveAuthEmail(userId, authEmail) {
  if (authEmail?.trim()) return authEmail.trim();
  if (!env.mongoUri || !userId) return '';
  try {
    const user = await User.findById(userId).select('email');
    return user?.email?.trim() || '';
  } catch {
    return '';
  }
}

function resolveApplicantName(profile, userName = '') {
  return (
    profile?.applicantName?.trim() ||
    profile?.displayName?.trim() ||
    String(userName || '').trim() ||
    ''
  );
}

async function resolveApplicantContact(userId, profile, authEmail) {
  const userEmail = await resolveAuthEmail(userId, authEmail);
  let accountName = '';
  if (env.mongoUri && userId) {
    try {
      const user = await User.findById(userId).select('name');
      accountName = user?.name?.trim() || '';
    } catch {
      accountName = '';
    }
  }
  const email = resolveContactEmail(profile, userEmail);
  const phone = profile?.contactPhone?.trim() || '';

  return {
    name: resolveApplicantName(profile, accountName),
    email,
    phone,
    linkedin: profile?.linkedin?.trim() || '',
    github: profile?.github?.trim() || '',
    portfolio: profile?.portfolio?.trim() || '',
  };
}

function contactHeader(contact) {
  if (!contact?.name && !contact?.email) return '';
  const lines = [contact.name || ''].filter(Boolean);
  const contactLine = [contact.email, contact.phone].filter(Boolean).join(' · ');
  if (contactLine) lines.push(contactLine);
  if (contact.linkedin) lines.push(contact.linkedin);
  return lines.join('\n');
}

function contactSignature(contact) {
  const name = contact?.name || 'Candidate';
  const lines = ['', name];
  if (contact?.email) lines.push(contact.email);
  if (contact?.phone) lines.push(contact.phone);
  return lines.join('\n');
}

module.exports = {
  isAppOrSystemEmail,
  resolveContactEmail,
  resolveAuthEmail,
  resolveApplicantName,
  resolveApplicantContact,
  contactHeader,
  contactSignature,
};
