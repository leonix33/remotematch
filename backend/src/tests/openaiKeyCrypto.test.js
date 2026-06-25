const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { encryptApiKey, decryptApiKey, maskApiKey, isValidKeyFormat } = require('../services/openaiKeyCrypto');

describe('openaiKeyCrypto', () => {
  it('encrypts and decrypts API keys', () => {
    const key = 'sk-testkey1234567890abcdefghij';
    const enc = encryptApiKey(key);
    assert.notEqual(enc, key);
    assert.equal(decryptApiKey(enc), key);
  });

  it('masks keys for display', () => {
    const masked = maskApiKey('sk-proj-abcdefghijklmnopqrstuvwxyz');
    assert.match(masked, /^sk-proj…/);
  });

  it('validates sk- key format', () => {
    assert.equal(isValidKeyFormat('sk-abc123456789012345678901'), true);
    assert.equal(isValidKeyFormat('not-a-key'), false);
  });
});
