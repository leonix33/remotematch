const fs = require('fs');
const path = require('path');
const env = require('../config/env');

function storePath() {
  const dir = path.join(env.agentHome, 'items');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'application-kits.json');
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

function get(userId, jobId) {
  return readAll()[userId.toString()]?.[jobId] || null;
}

function set(userId, jobId, kit) {
  const key = userId.toString();
  const all = readAll();
  if (!all[key]) all[key] = {};
  all[key][jobId] = { ...kit, jobId, updatedAt: new Date().toISOString() };
  writeAll(all);
  return all[key][jobId];
}

module.exports = { get, set };
