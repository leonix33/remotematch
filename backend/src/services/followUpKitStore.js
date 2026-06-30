const fs = require('fs');
const path = require('path');
const env = require('../config/env');

function storePath() {
  const dir = path.join(env.agentHome, 'items');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'follow-up-kits.json');
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

function get(userId, jobId) {
  const all = readAll();
  return all[keyFor(userId, jobId)] || null;
}

function set(userId, jobId, kit) {
  const all = readAll();
  all[keyFor(userId, jobId)] = { ...kit, userId: String(userId), jobId: String(jobId) };
  writeAll(all);
  return all[keyFor(userId, jobId)];
}

function listForUser(userId) {
  const prefix = `${userId}:`;
  const all = readAll();
  return Object.entries(all)
    .filter(([k]) => k.startsWith(prefix))
    .map(([, v]) => v);
}

module.exports = { get, set, listForUser };
