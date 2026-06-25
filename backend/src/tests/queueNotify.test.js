const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { approvalsLink } = require('../services/queueNotifyService');

describe('queueNotifyService', () => {
  it('builds deep link to apply queue with job id', () => {
    assert.equal(approvalsLink('ext-abc123'), '/approvals?jobId=ext-abc123');
  });
});
