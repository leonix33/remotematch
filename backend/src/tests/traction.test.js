const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveDigestEmail, followUpUrgency } = require('../services/tractionService');

describe('traction follow-up urgency', () => {
  it('marks 3–7 days as high urgency follow-up window', () => {
    assert.equal(followUpUrgency(5).urgency, 'high');
    assert.equal(followUpUrgency(5).status, 'due');
  });

  it('marks 8–14 days as medium urgency', () => {
    assert.equal(followUpUrgency(10).urgency, 'medium');
  });

  it('marks under 3 days as waiting', () => {
    assert.equal(followUpUrgency(2).status, 'waiting');
  });
});

describe('resolveDigestEmail', () => {
  it('prefers digestEmail over notificationEmail', () => {
    assert.equal(
      resolveDigestEmail({ digestEmail: 'a@b.com', notificationEmail: 'c@d.com' }),
      'a@b.com'
    );
  });
});
