const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadRoute,
  getHandlers,
  createReq,
  runHandlers,
  createDbMockQueue,
} = require('./test-utils');

test('GET /reports/summary returns aggregated metrics', async () => {
  const { db } = createDbMockQueue([
    [[{ total: 10, available: 4, pending: 3, adopted: 3 }]],
    [[{ total: 8, pending: 2, approved: 4, rejected: 2 }]],
    [[{ total: 100 }]],
    [[{ donor_count: 5, total: 5000 }]],
  ]);
  const router = loadRoute('routes/reports.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/summary');

  const req = createReq({ session: { user: { UserRole: 'ADMIN' } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.dogs.total, 10);
  assert.equal(res.body.sponsors.donorCount, 5);
});

test('GET /reports/ai-summary returns generated text and metrics', async () => {
  const { db } = createDbMockQueue([
    [[{ total: 10, available: 4, pending: 3, adopted: 3 }]],
    [[{ total: 8, pending: 2, approved: 4, rejected: 2 }]],
    [[{ total: 100 }]],
    [[{ donor_count: 5, total: 5000 }]],
  ]);
  const router = loadRoute('routes/reports.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/ai-summary');

  const req = createReq({ session: { user: { UserRole: 'ADMIN' } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.text, /สรุปรายงานอัตโนมัติ/);
  assert.equal(res.body.metrics.users.total, 100);
});

test('GET /reports/potential-adopters returns adopter list', async () => {
  const { db } = createDbMockQueue([
    [[{ UserId: 1, FirstName: 'A', total_requests: 2, favourite_count: 1 }]],
  ]);
  const router = loadRoute('routes/reports.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/potential-adopters');

  const req = createReq({ session: { user: { UserRole: 'ADMIN' } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.adopters.length, 1);
});
