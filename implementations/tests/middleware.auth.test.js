const test = require('node:test');
const assert = require('node:assert/strict');
const { requireAuth, requireRole } = require('../src/backend/middleware/auth');
const { createReq, createRes } = require('./test-utils');

test('requireAuth returns 401 when no session', () => {
  const req = createReq();
  const res = createRes();
  let called = false;

  requireAuth(req, res, () => {
    called = true;
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'กรุณาเข้าสู่ระบบก่อน' });
});

test('requireAuth calls next when session exists', () => {
  const req = createReq({ session: { user: { UserId: 1 } } });
  const res = createRes();
  let called = false;

  requireAuth(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(res.body, null);
});

test('requireRole returns 403 for wrong role', () => {
  const req = createReq({ session: { user: { UserRole: 'USER' } } });
  const res = createRes();
  let called = false;

  requireRole('ADMIN')(req, res, () => {
    called = true;
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { message: 'ไม่มีสิทธิ์เข้าถึง' });
});

test('requireRole passes for allowed role', () => {
  const req = createReq({ session: { user: { UserRole: 'admin' } } });
  const res = createRes();
  let called = false;

  requireRole('ADMIN', 'STAFF')(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
});
