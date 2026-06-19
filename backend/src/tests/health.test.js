const { test } = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../app');

test('GET /api/health returns ok', async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/health`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.ok, true);
  await new Promise((resolve) => server.close(resolve));
});
