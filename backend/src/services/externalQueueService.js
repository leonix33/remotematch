const fs = require('fs');
const path = require('path');
const env = require('../config/env');

function queuePath() {
  const dir = path.join(env.agentHome, 'items');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'external_queue.json');
}

function readAll() {
  const p = queuePath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  fs.writeFileSync(queuePath(), JSON.stringify(data, null, 2));
}

function listForUser(userId) {
  const key = userId.toString();
  return readAll()[key] || [];
}

function upsert(userId, item) {
  const key = userId.toString();
  const all = readAll();
  const list = all[key] || [];
  const idx = list.findIndex((x) => x.jobId === item.jobId);
  const row = { ...item, updatedAt: new Date().toISOString() };
  if (idx >= 0) list[idx] = { ...list[idx], ...row };
  else list.unshift(row);
  all[key] = list;
  writeAll(all);
  return row;
}

function find(userId, jobId) {
  return listForUser(userId).find((x) => x.jobId === jobId);
}

module.exports = { listForUser, upsert, find };
