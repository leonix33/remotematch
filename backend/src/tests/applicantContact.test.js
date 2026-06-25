const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveContactEmail,
  isAppOrSystemEmail,
} = require('../services/applicantContactService');

describe('applicantContactService', () => {
  it('prefers personal digestEmail over admin email', () => {
    const email = resolveContactEmail(
      { digestEmail: 'leonix23@gmail.com' },
      'admin@example.com'
    );
    assert.equal(email, 'leonix23@gmail.com');
  });

  it('flags app/system emails', () => {
    assert.equal(isAppOrSystemEmail('admin@example.com'), true);
    assert.equal(isAppOrSystemEmail('user@personal-mail.test'), false);
  });
});
