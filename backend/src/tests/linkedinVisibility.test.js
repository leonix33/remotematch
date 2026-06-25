const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const linkedinVisibilityStore = require('../services/linkedinVisibilityStore');

describe('linkedinVisibilityStore', () => {
  it('saves, updates, and removes posts per user', () => {
    const userId = 'test-user-visibility';
    const posts = [
      {
        id: 'p1',
        title: 'EKS lab',
        linkedinPost: 'Hello LinkedIn',
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
    ];
    linkedinVisibilityStore.saveMany(userId, posts);
    let list = linkedinVisibilityStore.list(userId);
    assert.ok(list.some((p) => p.id === 'p1'));

    const updated = linkedinVisibilityStore.update(userId, 'p1', { status: 'posted' });
    assert.equal(updated.status, 'posted');

    linkedinVisibilityStore.remove(userId, 'p1');
    list = linkedinVisibilityStore.list(userId);
    assert.ok(!list.some((p) => p.id === 'p1'));
  });
});
