const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadRoute,
  getHandlers,
  pickHandlers,
  createReq,
  runHandlers,
  createDbMockQueue,
} = require('./test-utils');

test('GET /sponsors returns mapped sponsor rows', async () => {
  const { db } = createDbMockQueue([
    [[{
      SponsorId: 1,
      UserId: 2,
      donation_amount: '1500',
      total_donated: '2500',
      banner_url: '/banners/a.jpg',
      created_at: '2026-01-01',
      FirstName: 'X',
      LastName: 'Y',
      UserEmail: 'x@y.com',
    }]],
  ]);
  const router = loadRoute('routes/sponsors.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');

  const res = await runHandlers(handlers, createReq());
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.sponsors[0].donation_amount, 1500);
  assert.equal(res.body.sponsors[0].total_donated, 2500);
});

test('GET /sponsors/me returns null when sponsor not found', async () => {
  const { db } = createDbMockQueue([[[]]]);
  const router = loadRoute('routes/sponsors.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/me');

  const req = createReq({ session: { user: { UserId: 10, UserRole: 'SPONSOR' } } });
  const res = await runHandlers(handlers, req);

  assert.deepEqual(res.body, { sponsor: null });
});

test('POST /sponsors/register validates donation amount', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/sponsors.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/register', [0, 2]);

  const req = createReq({
    session: { user: { UserId: 1, UserRole: 'SPONSOR' } },
    body: { donation_amount: '0' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'จำนวนเงินบริจาคไม่ถูกต้อง' });
});
