const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadRoute,
  getHandlers,
  createReq,
  runHandlers,
  createDbMockQueue,
} = require('./test-utils');

test('GET /appointments returns user appointments with staff confirmed true', async () => {
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

test('GET /appointments returns user appointments with staff confirmed false', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    [[{
      id: 2,
      adoptionId: 3,
      deliveryDate: '2026-04-01',
      status: 'SCHEDULED',
      staffConfirmed: 0,
      dogName: 'Max',
      firstName: 'C',
      lastName: 'D',
      phone: '091',
      email: 'c@test.com',
    }]],
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');

  const req = createReq({ session: { user: { UserId: 10, UserRole: 'USER' } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.appointments[0].staffConfirmed, false);
});

test('GET /appointments normalizes status to lowercase', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    [[{
      id: 1,
      adoptionId: 2,
      deliveryDate: '2026-03-10',
      status: 'COMPLETED',
      staffConfirmed: 0,
      dogName: 'Buddy',
      firstName: 'E',
      lastName: 'F',
      phone: '092',
      email: 'e@test.com',
    }]],
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');

  const req = createReq({ session: { user: { UserId: 11, UserRole: 'USER' } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.appointments[0].status, 'completed');
});

test('GET /appointments returns 500 on database error', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    new Error('DB error'),
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');

  const req = createReq({ session: { user: { UserId: 9, UserRole: 'USER' } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
});

test('POST /appointments validates adoptionId missing', async () => {
  const { db } = createDbMockQueue([[[{ StaffConfirmed: 1 }]]]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');

  const req = createReq({ 
    session: { user: { UserId: 9, UserRole: 'USER' } },
    body: { deliveryDate: '2026-04-01' }
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'กรุณาระบุ adoptionId และ deliveryDate' });
});

test('POST /appointments validates deliveryDate missing', async () => {
  const { db } = createDbMockQueue([[[{ StaffConfirmed: 1 }]]]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');

  const req = createReq({ 
    session: { user: { UserId: 9, UserRole: 'USER' } },
    body: { adoptionId: 2 }
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'กรุณาระบุ adoptionId และ deliveryDate' });
});

test('POST /appointments returns 404 when adoption not found', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    [[]],
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');

  const req = createReq({
    session: { user: { UserId: 9, UserRole: 'USER' } },
    body: { adoptionId: 999, deliveryDate: '2026-04-01' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 404);
});

test('POST /appointments returns 400 when not approved', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    [[{ UserId: 9, ReqStatus: 'PENDING' }]],
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');

  const req = createReq({
    session: { user: { UserId: 9, UserRole: 'USER' } },
    body: { adoptionId: 2, deliveryDate: '2026-04-01' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /ยังไม่ได้รับการอนุมัติ/);
});

test('POST /appointments returns 403 for wrong user', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    [[{ UserId: 99, ReqStatus: 'APPROVED' }]],
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');

  const req = createReq({
    session: { user: { UserId: 9, UserRole: 'USER' } },
    body: { adoptionId: 2, deliveryDate: '2026-04-01' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 403);
});

test('POST /appointments staff can set date for any adoption', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    [[{ UserId: 5, ReqStatus: 'APPROVED' }]],
    [[{ DeliveryNo: 1 }]],
    [{}],
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');

  const req = createReq({
    session: { user: { UserId: 100, UserRole: 'STAFF' } },
    body: { adoptionId: 2, deliveryDate: '2026-04-01' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /บันทึกวันรับสุนัขสำเร็จ/);
});

test('POST /appointments updates existing delivery schedule', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    [[{ UserId: 9, ReqStatus: 'APPROVED' }]],
    [[{ DeliveryNo: 1 }]],
    [{}],
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');

  const req = createReq({
    session: { user: { UserId: 9, UserRole: 'USER' } },
    body: { adoptionId: 2, deliveryDate: '2026-04-01' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
});

test('POST /appointments creates delivery schedule if not exists', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    [[{ UserId: 9, ReqStatus: 'APPROVED' }]],
    [[]],
    [{}],
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');

  const req = createReq({
    session: { user: { UserId: 9, UserRole: 'USER' } },
    body: { adoptionId: 2, deliveryDate: '2026-04-01' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
});

test('POST /appointments returns 500 on database error', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    new Error('DB error'),
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');

  const req = createReq({
    session: { user: { UserId: 9, UserRole: 'USER' } },
    body: { adoptionId: 2, deliveryDate: '2026-04-01' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
});

test('PUT /appointments/:id validates status values', async () => {
  const { db } = createDbMockQueue([[[{ StaffConfirmed: 1 }]]]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'put', '/:id');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    params: { id: '1' },
    body: { status: 'INVALID' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'สถานะต้องเป็น SCHEDULED หรือ COMPLETED' });
});

test('PUT /appointments/:id CONFIRM_DATE action succeeds', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    [{}],
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'put', '/:id');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    params: { id: '1' },
    body: { action: 'CONFIRM_DATE' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /ยืนยันวันนัดรับสำเร็จ/);
});

test('PUT /appointments/:id status SCHEDULED', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    [{}],
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'put', '/:id');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    params: { id: '1' },
    body: { status: 'SCHEDULED' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /อัปเดตสถานะ/);
});

test('PUT /appointments/:id status COMPLETED', async () => {
  const { db } = createDbMockQueue([
    [[{ deliveryDate: '2026-04-01', StaffConfirmed: 1 }]],
    [{}],
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'put', '/:id');

  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    params: { id: '1' },
    body: { status: 'COMPLETED' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /อัปเดตสถานะ/);
});

test('PUT /appointments/:id returns 500 on database error', async () => {
  const { db } = createDbMockQueue([
    [[{ StaffConfirmed: 1 }]],
    new Error('DB error'),
  ]);
  const router = loadRoute('routes/appointments.js', { dbMock: db });
  const handlers = getHandlers(router, 'put', '/:id');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    params: { id: '1' },
    body: { status: 'COMPLETED' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
});
