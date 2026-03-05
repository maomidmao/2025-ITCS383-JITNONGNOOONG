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

/* ── Additional auth coverage tests ── */

test('POST /register returns 400 for short password', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hashed', compare: async () => true },
  });
  const handlers = getHandlers(router, 'post', '/register');
  const req = createReq({
    body: { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'short', citizen_id: '1234567890123' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /8 ตัวอักษร/);
});

test('POST /register returns 400 for invalid citizen_id', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hashed', compare: async () => true },
  });
  const handlers = getHandlers(router, 'post', '/register');
  const req = createReq({
    body: { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'Password123!', citizen_id: '123' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /13 หลัก/);
});

test('POST /register returns 409 for duplicate email', async () => {
  const dupErr = new Error('dup');
  dupErr.code = 'ER_DUP_ENTRY';
  const { db } = createDbMockQueue([dupErr]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hashed', compare: async () => true },
  });
  const handlers = getHandlers(router, 'post', '/register');
  const req = createReq({
    body: { firstName: 'A', lastName: 'B', email: 'dup@test.com', password: 'Password123!', citizen_id: '1234567890123' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /ถูกใช้แล้ว/);
});

test('POST /register returns 500 on unexpected db error', async () => {
  const { db } = createDbMockQueue([new Error('unexpected')]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hashed', compare: async () => true },
  });
  const handlers = getHandlers(router, 'post', '/register');
  const req = createReq({
    body: { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'Password123!', citizen_id: '1234567890123' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 500);
});

test('POST /login returns 400 for missing credentials', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hash', compare: async () => false },
  });
  const handlers = getHandlers(router, 'post', '/login');
  const req = createReq({ body: {}, session: {} });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /กรุณากรอกอีเมล/);
});

test('POST /login returns 401 for unknown email', async () => {
  const { db } = createDbMockQueue([[[]]]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hash', compare: async () => false },
  });
  const handlers = getHandlers(router, 'post', '/login');
  const req = createReq({ body: { email: 'x@x.com', password: 'test' }, session: {} });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 401);
});

test('POST /login returns 401 for wrong password with real hash', async () => {
  const { db } = createDbMockQueue([
    [[{
      UserId: 1, FirstName: 'A', LastName: 'B', UserEmail: 'a@b.com',
      UserRole: 'USER', citizen_id: '1234567890123',
      password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH',
    }]],
  ]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hash', compare: async () => false },
  });
  const handlers = getHandlers(router, 'post', '/login');
  const req = createReq({ body: { email: 'a@b.com', password: 'wrong' }, session: {} });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 401);
});

test('POST /login returns 500 on db error', async () => {
  const { db } = createDbMockQueue([new Error('DB down')]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hash', compare: async () => false },
  });
  const handlers = getHandlers(router, 'post', '/login');
  const req = createReq({ body: { email: 'a@b.com', password: 'test' }, session: {} });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 500);
});

test('POST /login with ADMIN role redirects to admin dashboard', async () => {
  const { db } = createDbMockQueue([
    [[{
      UserId: 1, FirstName: 'Admin', LastName: 'User', UserEmail: 'admin@test.com',
      UserRole: 'ADMIN', citizen_id: '1234567890123',
      password_hash: '$2b$10$hash1',
    }]],
  ]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hash', compare: async () => true },
  });
  const handlers = getHandlers(router, 'post', '/login');
  const req = createReq({ body: { email: 'admin@test.com', password: 'Password123!' }, session: {} });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.redirect, '/pages/admin-dashboard.html');
});

test('POST /login with STAFF role redirects to staff dashboard', async () => {
  const { db } = createDbMockQueue([
    [[{
      UserId: 2, FirstName: 'Staff', LastName: 'User', UserEmail: 'staff@test.com',
      UserRole: 'STAFF', citizen_id: '1234567890123',
      password_hash: '$2b$10$hash1',
    }]],
  ]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hash', compare: async () => true },
  });
  const handlers = getHandlers(router, 'post', '/login');
  const req = createReq({ body: { email: 'staff@test.com', password: 'Password123!' }, session: {} });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.redirect, '/pages/staff-dashboard/dogmanagement.html');
});

test('POST /login with SPONSOR role redirects to sponsor dashboard', async () => {
  const { db } = createDbMockQueue([
    [[{
      UserId: 3, FirstName: 'Sponsor', LastName: 'User', UserEmail: 'sponsor@test.com',
      UserRole: 'SPONSOR', citizen_id: '1234567890123',
      password_hash: '$2b$10$hash1',
    }]],
  ]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hash', compare: async () => true },
  });
  const handlers = getHandlers(router, 'post', '/login');
  const req = createReq({ body: { email: 'sponsor@test.com', password: 'Password123!' }, session: {} });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.redirect, '/pages/sponsor-dashboard.html');
});

test('POST /register with general_user role maps to USER', async () => {
  const { db, calls } = createDbMockQueue([
    [{ insertId: 88 }],
    [{}],
  ]);
  const router = loadRoute('routes/auth.js', {
    dbMock: db,
    bcryptMock: { hash: async () => 'hashed', compare: async () => true },
  });
  const handlers = getHandlers(router, 'post', '/register');
  const req = createReq({
    body: { firstName: 'X', lastName: 'Y', email: 'xy@test.com', password: 'Password123!', citizen_id: '1234567890123', role: 'general_user' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 201);
  assert.equal(calls[0].params[7], 'USER');
});
