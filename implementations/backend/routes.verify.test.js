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

test('POST /verify/criminal returns criminal result shape', async () => {
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

test('POST /verify/blacklist returns blacklist result shape', async () => {
  const { db } = createDbMockQueue([[[{ reason: 'fraud' }]]]);
  const router = loadRoute('routes/verify.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/blacklist');

  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    body: { citizen_id: '1234567890123' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { blacklisted: true, reason: 'fraud' });
});

test('POST /verify/all returns passed=true and check details', async () => {
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
