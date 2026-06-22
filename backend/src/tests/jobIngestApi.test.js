const { test } = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../app');
const { listConfiguredSources } = require('../services/jobs/jobIngestService');

test('GET /api/jobs/ingest/status requires auth', async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/jobs/ingest/status`);
  assert.equal(res.status, 401);
  await new Promise((resolve) => server.close(resolve));
});

test('listConfiguredSources includes enabled sources', () => {
  const sources = listConfiguredSources();
  assert.ok(sources.length >= 5);
  assert.ok(sources.some((s) => s.name === 'remoteok'));
  assert.ok(sources.some((s) => s.name === 'greenhouse'));
});
