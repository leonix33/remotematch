const fs = require('fs');
const path = require('path');
const env = require('../config/env');

function storePath() {
  const dir = path.join(env.agentHome, 'items');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'user-notifications.json');
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

function list(userId, unreadOnly = false) {
  const rows = readAll()[userId.toString()] || [];
  const sorted = [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return unreadOnly ? sorted.filter((r) => !r.read) : sorted;
}

function unreadCount(userId) {
  return list(userId, true).length;
}

function create(userId, payload) {
  const key = userId.toString();
  const all = readAll();
  if (!all[key]) all[key] = [];
  const row = {
    _id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: key,
    read: false,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  all[key].unshift(row);
  all[key] = all[key].slice(0, 100);
  writeAll(all);
  return row;
}

function markRead(userId, id) {
  const key = userId.toString();
  const all = readAll();
  const rows = all[key] || [];
  const row = rows.find((r) => r._id === id);
  if (row) row.read = true;
  writeAll(all);
}

function markAllRead(userId) {
  const key = userId.toString();
  const all = readAll();
  for (const row of all[key] || []) row.read = true;
  writeAll(all);
}

module.exports = { list, unreadCount, create, markRead, markAllRead };
