const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// parseResponse is internal — test via ask demo path would need mocks.
// Smoke test module loads.
describe('conciergeService', () => {
  it('exports ask and buildSnapshot', () => {
    const svc = require('../services/conciergeService');
    assert.equal(typeof svc.ask, 'function');
    assert.equal(typeof svc.buildSnapshot, 'function');
    assert.ok(Array.isArray(svc.APP_ROUTES));
  });
});
