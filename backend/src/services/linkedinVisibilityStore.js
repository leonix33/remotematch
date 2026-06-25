const fs = require('fs');
const path = require('path');
const env = require('../config/env');

function storePath() {
  const dir = path.join(env.agentHome, 'items');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'linkedin-visibility-posts.json');
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
  const rows = readAll()[userId.toString()] || [];
  return [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function get(userId, id) {
  return list(userId).find((row) => row.id === id) || null;
}

function saveMany(userId, posts) {
  const key = userId.toString();
  const all = readAll();
  const existing = all[key] || [];
  all[key] = [...posts, ...existing];
  writeAll(all);
  return posts;
}

function update(userId, id, patch) {
  const key = userId.toString();
  const all = readAll();
  const rows = all[key] || [];
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  rows[idx] = { ...rows[idx], ...patch, updatedAt: new Date().toISOString() };
  all[key] = rows;
  writeAll(all);
  return rows[idx];
}

function remove(userId, id) {
  const key = userId.toString();
  const all = readAll();
  all[key] = (all[key] || []).filter((r) => r.id !== id);
  writeAll(all);
}

module.exports = { list, get, saveMany, update, remove };
