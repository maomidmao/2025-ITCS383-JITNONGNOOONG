const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadRoute,
  getHandlers,
  createReq,
  runHandlers,
  createDbMockQueue,
} = require('./test-utils');

test('POST /register returns 400 for missing fields', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hashed', compare: async () => true },
  });

  const handlers = getHandlers(router, 'post', '/register');
  const req = createReq({ body: { email: 'a@a.com' } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /กรุณากรอกข้อมูลให้ครบถ้วน/);
});

test('POST /register returns 201 with userId', async () => {
  const { db, calls } = createDbMockQueue([
    [{ insertId: 77 }],
    [{}],
  ]);

  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hashed_pw', compare: async () => true },
  });

  const handlers = getHandlers(router, 'post', '/register');
  const req = createReq({
    body: {
      firstName: 'A',
      lastName: 'B',
      email: 'ab@test.com',
      password: 'Password123!',
      citizen_id: '1234567890123',
      role: 'sponsor',
    },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { message: 'ลงทะเบียนสำเร็จ', userId: 77 });
  assert.equal(calls[0].params[7], 'SPONSOR');
});

test('POST /login returns 200 with redirect for USER', async () => {
  const { db } = createDbMockQueue([
    [[{
      UserId: 9,
      FirstName: 'Foo',
      LastName: 'Bar',
      UserEmail: 'foo@bar.com',
      UserRole: 'USER',
      citizen_id: '1234567890123',
      password_hash: '$2b$10$hash1',
    }]],
  ]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hash', compare: async () => true },
  });

  const handlers = getHandlers(router, 'post', '/login');
  const req = createReq({
    body: { email: 'foo@bar.com', password: 'Password123!' },
    session: {},
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'เข้าสู่ระบบสำเร็จ');
  assert.equal(res.body.redirect, '/pages/user-dashboard/favourites.html');
  assert.equal(req.session.user.role, 'user');
});

test('POST /logout clears session cookie', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/auth.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/logout');

  const req = createReq({
    session: {
      destroy(cb) {
        cb();
      },
    },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'ออกจากระบบสำเร็จ' });
  assert.deepEqual(res.clearedCookies, ['connect.sid']);
});

test('GET /me returns 401 without session and 200 with session', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/auth.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/me');

  const unauthRes = await runHandlers(handlers, createReq());
  assert.equal(unauthRes.statusCode, 401);
  assert.deepEqual(unauthRes.body, { message: 'กรุณาเข้าสู่ระบบก่อน' });

  const user = { UserId: 1, UserRole: 'USER' };
  const authRes = await runHandlers(handlers, createReq({ session: { user } }));
  assert.equal(authRes.statusCode, 200);
  assert.deepEqual(authRes.body, { user });
});
