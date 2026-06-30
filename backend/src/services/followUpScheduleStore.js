const fs = require('fs');
const path = require('path');
const env = require('../config/env');

const FOLLOW_UP_DAYS = 5;

function storePath() {
  const dir = path.join(env.agentHome, 'items');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'follow-up-schedule.json');
}

function readAll() {
  const p = storePath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  fs.writeFileSync(storePath(), JSON.stringify(data, null, 2));
}

function keyFor(userId, jobId) {
  return `${userId}:${jobId}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function schedule(userId, jobId, meta = {}) {
  const appliedAt = meta.appliedAt ? new Date(meta.appliedAt) : new Date();
  const scheduledFor = addDays(appliedAt, FOLLOW_UP_DAYS);
  const all = readAll();
  const row = {
    userId: String(userId),
    jobId: String(jobId),
    title: meta.title || '',
    company: meta.company || '',
    appliedAt: appliedAt.toISOString(),
    scheduledFor: scheduledFor.toISOString(),
    reminderSent: false,
    createdAt: new Date().toISOString(),
  };
  all[keyFor(userId, jobId)] = row;
  writeAll(all);
  return row;
}

function get(userId, jobId) {
  return readAll()[keyFor(userId, jobId)] || null;
}

function listForUser(userId) {
  const prefix = `${userId}:`;
  return Object.entries(readAll())
    .filter(([k]) => k.startsWith(prefix))
    .map(([, v]) => v);
}

function markReminderSent(userId, jobId) {
  const all = readAll();
  const k = keyFor(userId, jobId);
  if (!all[k]) return null;
  all[k].reminderSent = true;
  all[k].reminderSentAt = new Date().toISOString();
  writeAll(all);
  return all[k];
}

module.exports = {
  schedule,
  get,
  listForUser,
  markReminderSent,
  FOLLOW_UP_DAYS,
};
