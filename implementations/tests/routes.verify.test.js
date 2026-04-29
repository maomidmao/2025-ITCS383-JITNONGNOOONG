const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadRoute,
  getHandlers,
  createReq,
  runHandlers,
  createDbMockQueue,
} = require('./test-utils');

test('POST /verify/citizen validates citizen_id', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/citizen');

  const req = createReq({ session: { user: { UserRole: 'ADMIN' } }, body: {} });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'กรุณาระบุเลขบัตรประชาชน' });
});

test('POST /verify/citizen returns citizen record when found', async () => {
  const { db } = createDbMockQueue([
    [[{ citizen_id: '1234567890123', full_name: 'John Doe', address: '123 Main' }]],
  ]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/citizen');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    body: { citizen_id: '1234567890123' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.found, true);
  assert.equal(res.body.record.citizen_id, '1234567890123');
});

test('POST /verify/citizen returns null record when not found', async () => {
  const { db } = createDbMockQueue([[]]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/citizen');

  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    body: { citizen_id: '9999999999999' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.found, false);
  assert.equal(res.body.record, null);
});

test('POST /verify/citizen returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/citizen');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    body: { citizen_id: '1234567890123' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'เกิดข้อผิดพลาด' });
});

test('POST /verify/criminal validates citizen_id', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/criminal');

  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    body: {},
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'กรุณาระบุเลขบัตรประชาชน' });
});

test('POST /verify/criminal returns has_criminal_record true', async () => {
  const { db } = createDbMockQueue([[[{ has_criminal_record: 1 }]]]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/criminal');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    body: { citizen_id: '1234567890123' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { found: true, has_criminal_record: true });
});

test('POST /verify/criminal returns has_criminal_record false', async () => {
  const { db } = createDbMockQueue([[[{ has_criminal_record: 0 }]]]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/criminal');

  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    body: { citizen_id: '1234567890123' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { found: true, has_criminal_record: false });
});

test('POST /verify/criminal returns found false when not in records', async () => {
  const { db } = createDbMockQueue([[]]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/criminal');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    body: { citizen_id: '9999999999999' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { found: false, has_criminal_record: false });
});

test('POST /verify/criminal returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/criminal');

  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    body: { citizen_id: '1234567890123' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'เกิดข้อผิดพลาด' });
});

test('POST /verify/blacklist validates citizen_id', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/blacklist');

  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    body: {},
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'กรุณាระบุเลขบัตรประชาชน' });
});

test('POST /verify/blacklist returns blacklisted true with reason', async () => {
  const { db } = createDbMockQueue([[[{ reason: 'fraud' }]]]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/blacklist');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    body: { citizen_id: '1234567890123' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { blacklisted: true, reason: 'fraud' });
});

test('POST /verify/blacklist returns blacklisted false when not found', async () => {
  const { db } = createDbMockQueue([[]]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/blacklist');

  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    body: { citizen_id: '9999999999999' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { blacklisted: false, reason: null });
});

test('POST /verify/blacklist returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/blacklist');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    body: { citizen_id: '1234567890123' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'เกิดข้อผิดพลาด' });
});

test('POST /verify/all validates citizen_id', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/all');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    body: {},
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'กรุณาระบุเลขบัตรประชาชน' });
});

test('POST /verify/all returns passed=true when all checks pass', async () => {
  const { db } = createDbMockQueue([
    [[{ citizen_id: '1', full_name: 'Tester' }]],
    [[]],
    [[]],
    [{}],
    [{}],
  ]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/all');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    body: { citizen_id: '1', adoption_id: 5 },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.passed, true);
  assert.equal(res.body.checks.citizen.passed, true);
  assert.equal(res.body.checks.criminal.passed, true);
  assert.equal(res.body.checks.blacklist.passed, true);
});

test('POST /verify/all returns passed=false when citizen record missing', async () => {
  const { db } = createDbMockQueue([
    [[]],  // No citizen record
    [[]],
    [[]],
  ]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/all');

  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    body: { citizen_id: '9999' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.passed, false);
  assert.equal(res.body.checks.citizen.passed, false);
});

test('POST /verify/all returns passed=false when criminal record exists', async () => {
  const { db } = createDbMockQueue([
    [[{ citizen_id: '1' }]],
    [[{ has_criminal_record: 1 }]],
    [[]],
  ]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/all');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    body: { citizen_id: '1' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.passed, false);
  assert.equal(res.body.checks.criminal.passed, false);
});

test('POST /verify/all returns passed=false when blacklisted', async () => {
  const { db } = createDbMockQueue([
    [[{ citizen_id: '1' }]],
    [[]],
    [[{ reason: 'fraud' }]],
  ]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/all');

  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    body: { citizen_id: '1' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.passed, false);
  assert.equal(res.body.checks.blacklist.passed, false);
});

test('POST /verify/all returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/all');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    body: { citizen_id: '1' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'เกิดข้อผิดพลาด' });
});
