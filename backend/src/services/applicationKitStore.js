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
  const prev = all[key][jobId] || {};
  all[key][jobId] = {
    ...prev,
    ...kit,
    jobId,
    useForApply: kit.useForApply !== undefined ? Boolean(kit.useForApply) : prev.useForApply !== false,
    updatedAt: new Date().toISOString(),
  };
  writeAll(all);
  return all[key][jobId];
}

function listForUser(userId) {
  const rows = readAll()[userId.toString()] || {};
  return Object.values(rows)
    .filter((k) => k?.tailored)
    .sort((a, b) => new Date(b.generatedAt || b.updatedAt || 0) - new Date(a.generatedAt || a.updatedAt || 0));
}

function patchMeta(userId, jobId, meta) {
  const existing = get(userId, jobId);
  if (!existing) return null;
  return set(userId, jobId, { ...existing, ...meta });
}

module.exports = { get, set, listForUser, patchMeta };
