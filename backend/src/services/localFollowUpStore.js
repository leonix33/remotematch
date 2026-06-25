const fs = require('fs');
const path = require('path');
const env = require('../config/env');

function storePath() {
  const dir = path.join(env.agentHome, 'items');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'follow-up-completed.json');
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

function isCompleted(userId, jobId) {
  const rows = readAll()[userId.toString()] || [];
  return rows.some((r) => r.jobId === jobId);
}

function markCompleted(userId, jobId, notes = '') {
  const key = userId.toString();
  const all = readAll();
  if (!all[key]) all[key] = [];
  if (!all[key].some((r) => r.jobId === jobId)) {
    all[key].push({ jobId, notes, completedAt: new Date().toISOString() });
  }
  writeAll(all);
  return all[key];
}

module.exports = { isCompleted, markCompleted };
