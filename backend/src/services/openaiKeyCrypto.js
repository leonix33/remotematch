const crypto = require('crypto');
const env = require('../config/env');

const ALGO = 'aes-256-gcm';

function deriveKey() {
  return crypto.scryptSync(env.jwtAccessSecret, 'remotematch-openai-v1', 32);
}

function encryptApiKey(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, deriveKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

function decryptApiKey(payload) {
  if (!payload) return '';
  const [ivHex, tagHex, dataHex] = String(payload).split(':');
  if (!ivHex || !tagHex || !dataHex) return '';
  const decipher = crypto.createDecipheriv(ALGO, deriveKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
}

function maskApiKey(key) {
  if (!key || key.length < 12) return null;
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

function isValidKeyFormat(key) {
  return typeof key === 'string' && /^sk-[A-Za-z0-9_-]{20,}$/.test(key.trim());
}

module.exports = { encryptApiKey, decryptApiKey, maskApiKey, isValidKeyFormat };
