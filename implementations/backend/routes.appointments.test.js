const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadRoute,
  getHandlers,
  createReq,
  runHandlers,
  createDbMockQueue,
} = require('./test-utils');

test('GET /appointments returns user appointments', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    [[{
      id: 1,
      adoptionId: 2,
      deliveryDate: '2026-03-10',
      status: 'SCHEDULED',
      staffConfirmed: 1,
      dogName: 'Lucky',
      firstName: 'A',
      lastName: 'B',
      phone: '090',
      email: 'a@test.com',
    }]],
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');

  const req = createReq({ session: { user: { UserId: 9, UserRole: 'USER' } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.appointments[0].status, 'scheduled');
  assert.equal(res.body.appointments[0].staffConfirmed, true);
});

test('POST /appointments validates required fields', async () => {
  const { db } = createDbMockQueue([[[{ StaffConfirmed: 1 }]]]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');

  const req = createReq({ session: { user: { UserId: 9, UserRole: 'USER' } }, body: {} });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'กรุณาระบุ adoptionId และ deliveryDate' });
});

test('PUT /appointments/:id validates status values', async () => {
  const { db } = createDbMockQueue([[[{ StaffConfirmed: 1 }]]]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'put', '/:id');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    params: { id: '1' },
    body: { status: 'PENDING' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'สถานะต้องเป็น SCHEDULED หรือ COMPLETED' });
});
