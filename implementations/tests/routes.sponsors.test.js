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
  assert.equal(res.body.sponsors[0].banner_url, '/banners/a.jpg');
  assert.equal(res.body.sponsors[0].first_name, 'X');
  assert.equal(res.body.sponsors[0].last_name, 'Y');
});

test('GET /sponsors returns empty list', async () => {
  const { db } = createDbMockQueue([[[]]]);
  const router = loadRoute('routes/sponsors.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');

  const res = await runHandlers(handlers, createReq());
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.sponsors.length, 0);
});

test('GET /sponsors returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/sponsors.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');

  const res = await runHandlers(handlers, createReq());
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'เกิดข้อผิดพลาด' });
});

test('GET /sponsors/me returns sponsor data when found', async () => {
  const { db } = createDbMockQueue([
    [[{
      SponsorId: 1,
      UserId: 10,
      donation_amount: '5000',
      total_donated: '15000',
      banner_url: '/banners/logo.jpg',
      created_at: '2025-12-01',
      FirstName: 'John',
      LastName: 'Doe',
      UserEmail: 'john@example.com',
    }]],
  ]);
  const router = loadRoute('routes/sponsors.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/me');

  const req = createReq({ session: { user: { UserId: 10, UserRole: 'SPONSOR' } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.sponsor.donation_amount, 5000);
  assert.equal(res.body.sponsor.total_donated, 15000);
});

test('GET /sponsors/me returns null when sponsor not found', async () => {
  const { db } = createDbMockQueue([[[]]]);
  const router = loadRoute('routes/sponsors.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/me');

  const req = createReq({ session: { user: { UserId: 10, UserRole: 'SPONSOR' } } });
  const res = await runHandlers(handlers, req);

  assert.deepEqual(res.body, { sponsor: null });
});

test('GET /sponsors/me returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/sponsors.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/me');

  const req = createReq({ session: { user: { UserId: 10, UserRole: 'SPONSOR' } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'เกิดข้อผิดพลาด' });
});

test('POST /sponsors/register validates donation amount is zero', async () => {
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

test('POST /sponsors/register validates donation amount is negative', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/sponsors.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/register', [0, 2]);

  const req = createReq({
    session: { user: { UserId: 1, UserRole: 'SPONSOR' } },
    body: { donation_amount: '-100' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'จำนวนเงินบริจาคไม่ถูกต้อง' });
});

test('POST /sponsors/register validates donation amount is NaN', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/sponsors.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/register', [0, 2]);

  const req = createReq({
    session: { user: { UserId: 1, UserRole: 'SPONSOR' } },
    body: { donation_amount: 'invalid' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'จำนวนเงินบริจาคไม่ถูกต้อง' });
});

test('POST /sponsors/register creates new sponsor', async () => {
  const { db, calls } = createDbMockQueue([
    [[]],  // SELECT existing
    [{}],  // INSERT
  ]);
  const router = loadRoute('routes/sponsors.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/register', [0, 2]);

  const req = createReq({
    session: { user: { UserId: 5, UserRole: 'SPONSOR' } },
    body: { donation_amount: '10000' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'บันทึกข้อมูลผู้สนับสนุนสำเร็จ' });
  assert.equal(calls[1].params[0], 5);
  assert.equal(calls[1].params[1], 10000);
});

test('POST /sponsors/register updates existing sponsor', async () => {
  const { db, calls } = createDbMockQueue([
    [[{ SponsorId: 1, banner_url: '/banners/old.jpg' }]],  // SELECT existing
    [{}],  // UPDATE
  ]);
  const router = loadRoute('routes/sponsors.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/register', [0, 2]);

  const req = createReq({
    session: { user: { UserId: 5, UserRole: 'SPONSOR' } },
    body: { donation_amount: '20000' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'บันทึกข้อมูลผู้สนับสนุนสำเร็จ' });
  assert.equal(calls[1].params[1], 20000);
});

test('POST /sponsors/register handles database error', async () => {
  const { db } = createDbMockQueue([
    new Error('DB connection failed'),
  ]);
  const router = loadRoute('routes/sponsors.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/register', [0, 2]);

  const req = createReq({
    session: { user: { UserId: 5, UserRole: 'SPONSOR' } },
    body: { donation_amount: '5000' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'เกิดข้อผิดพลาด' });
});
