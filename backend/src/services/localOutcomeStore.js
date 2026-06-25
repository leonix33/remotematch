const fs = require('fs');
const path = require('path');
const env = require('../config/env');

function storePath() {
  const dir = path.join(env.agentHome, 'items');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'user-outcomes.json');
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

function list(userId) {
  return readAll()[userId.toString()] || [];
}

function upsert(userId, data) {
  const key = userId.toString();
  const all = readAll();
  const rows = all[key] || [];
  const idx = rows.findIndex((r) => r.jobId === data.jobId);
  const row = {
    ...data,
    jobId: data.jobId,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) rows[idx] = { ...rows[idx], ...row };
  else rows.unshift({ ...row, createdAt: new Date().toISOString() });
  all[key] = rows;
  writeAll(all);
  return row;
}

module.exports = { list, upsert };
