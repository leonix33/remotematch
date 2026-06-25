const fs = require('fs');
const path = require('path');
const env = require('../config/env');

function storePath() {
  const dir = path.join(env.agentHome, 'items');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'push-subscriptions.json');
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

function subscribe(userId, subscription) {
  const key = userId.toString();
  const all = readAll();
  if (!all[key]) all[key] = [];
  const row = {
    _id: subscription.endpoint.slice(-24),
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    createdAt: new Date().toISOString(),
  };
  const idx = all[key].findIndex((s) => s.endpoint === subscription.endpoint);
  if (idx >= 0) all[key][idx] = row;
  else all[key].push(row);
  writeAll(all);
  return row;
}

function unsubscribe(userId, endpoint) {
  const key = userId.toString();
  const all = readAll();
  if (!all[key]) return;
  all[key] = all[key].filter((s) => s.endpoint !== endpoint);
  writeAll(all);
}

function listForUser(userId) {
  return readAll()[userId.toString()] || [];
}

module.exports = { subscribe, unsubscribe, listForUser };
