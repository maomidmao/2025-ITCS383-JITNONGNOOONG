const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadRoute,
  getHandlers,
  createReq,
  runHandlers,
  createDbMockQueue,
} = require('./test-utils');

test('GET /adoptions returns normalized list for staff', async () => {
  const { db } = createDbMockQueue([
    [[{ 1: 1 }]],
    [[{
      AdoptionReqNo: 3,
      UserId: 4,
      DogId: 2,
      DogName: 'Coco',
      breed: 'Mixed',
      image_url: '/img/c.jpg',
      FirstName: 'A',
      LastName: 'B',
      UserEmail: 'u@test.com',
      phone: '090',
      citizen_id: '123',
      user_address: 'Bangkok',
      ReqStatus: 'PENDING',
      verification_status: 'PENDING',
      rejection_reason: null,
      created_at: '2026-01-01',
    }]],
  ]);

  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');

  const req = createReq({ session: { user: { UserRole: 'STAFF' } }, query: { status: 'pending' } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.adoptions[0].status, 'pending');
  assert.equal(res.body.adoptions[0].dogName, 'Coco');
});

test('GET /adoptions/my returns current user requests', async () => {
  const { db } = createDbMockQueue([
    [[{ 1: 1 }]],
    [[{
      AdoptionReqNo: 10,
      UserId: 8,
      DogId: 3,
      DogName: 'Nana',
      breed: 'Thai',
      image_url: '/img/n.jpg',
      user_address: 'BKK',
      ReqStatus: 'APPROVED',
      verification_status: 'PASSED',
      created_at: '2026-01-01',
    }]],
  ]);

  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/my');
  const req = createReq({ session: { user: { UserId: 8 } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.adoptions[0].status, 'approved');
  assert.equal(res.body.adoptions[0].dogId, 3);
});

test('POST /adoptions returns 201 on valid request', async () => {
  const { db } = createDbMockQueue([
    [[{ 1: 1 }]],
    [[{ DogStatus: 'AVAILABLE' }]],
    [[]],
    [{ insertId: 15 }],
    [{}],
    [{}],
    [{}],
  ]);

  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');

  const req = createReq({
    session: { user: { UserId: 8 } },
    body: {
      dogId: 7,
      address: 'Chiang Mai',
      livingType: 'house',
      message: 'พร้อมดูแล',
    },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { message: 'ยื่นคำขอสำเร็จ', adoptionId: 15 });
});

test('PUT /adoptions/:id/review rejects invalid action', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'put', '/:id/review');

  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    params: { id: '1' },
    body: { action: 'hold' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'action ต้องเป็น approve หรือ reject' });
});

test('PUT /adoptions/:id/review approve fails if verification not passed', async () => {
  const { db } = createDbMockQueue([
    [[{ AdoptionReqNo: 1, DogId: 2, verification_status: 'PENDING' }]],
  ]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'put', '/:id/review');

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    params: { id: '1' },
    body: { action: 'approve' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /ต้องผ่านการตรวจสอบคุณสมบัติก่อน/);
});

/* ── Additional adoption coverage tests ── */

test('POST /adoptions returns 400 when dogId missing', async () => {
  const { db } = createDbMockQueue([[[{ 1: 1 }]]]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');
  const req = createReq({ session: { user: { UserId: 8 } }, body: {} });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /กรุณาระบุ dogId/);
});

test('POST /adoptions returns 404 when dog not found', async () => {
  const { db } = createDbMockQueue([
    [[{ 1: 1 }]],
    [[]],
  ]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');
  const req = createReq({ session: { user: { UserId: 8 } }, body: { dogId: 999 } });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 404);
  assert.match(res.body.message, /ไม่พบสุนัข/);
});

test('POST /adoptions returns 400 when dog not available', async () => {
  const { db } = createDbMockQueue([
    [[{ 1: 1 }]],
    [[{ DogStatus: 'ADOPTED' }]],
  ]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');
  const req = createReq({ session: { user: { UserId: 8 } }, body: { dogId: 1 } });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /ไม่เปิดรับคำขอ/);
});

test('POST /adoptions returns 409 for duplicate pending request', async () => {
  const { db } = createDbMockQueue([
    [[{ 1: 1 }]],
    [[{ DogStatus: 'AVAILABLE' }]],
    [[{ AdoptionReqNo: 99 }]],
  ]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');
  const req = createReq({ session: { user: { UserId: 8 } }, body: { dogId: 1 } });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /มีคำขอรอพิจารณา/);
});

test('POST /adoptions returns 400 for invalid living type', async () => {
  const { db } = createDbMockQueue([
    [[{ 1: 1 }]],
    [[{ DogStatus: 'AVAILABLE' }]],
    [[]],
    [{ insertId: 20 }],
  ]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');
  const req = createReq({
    session: { user: { UserId: 8 } },
    body: { dogId: 1, livingType: 'castle' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /ประเภทที่พักไม่ถูกต้อง/);
});

test('PUT /adoptions/:id/review approve succeeds with PASSED verification', async () => {
  const { db } = createDbMockQueue([
    [[{ AdoptionReqNo: 1, DogId: 2, verification_status: 'PASSED', UserId: 5 }]],
    [{}],  // UPDATE adoption_requests SET ReqStatus='APPROVED'
    [{}],  // UPDATE dogs SET DogStatus='ADOPTED'
    [{}],  // UPDATE adoption_requests (close other pending)
    [[]],  // SELECT delivery_schedules
    [{}],  // INSERT delivery_schedules
    [{}],  // INSERT notification
  ]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'put', '/:id/review');
  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    params: { id: '1' },
    body: { action: 'approve' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /อนุมัติ/);
});

test('PUT /adoptions/:id/review reject succeeds', async () => {
  const { db } = createDbMockQueue([
    [[{ AdoptionReqNo: 1, DogId: 2, verification_status: 'PENDING', UserId: 5 }]],
    [{}],  // UPDATE adoption_requests SET ReqStatus='REJECTED'
    [[{ total: 0 }]],  // SELECT COUNT (no other pending requests)
    [{}],  // UPDATE dogs SET DogStatus
    [{}],  // INSERT notification
  ]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'put', '/:id/review');
  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    params: { id: '1' },
    body: { action: 'reject', rejection_reason: 'ไม่ผ่าน' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /ปฏิเสธ/);
});

test('PUT /adoptions/:id/review returns 404 when adoption not found', async () => {
  const { db } = createDbMockQueue([[[]]]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'put', '/:id/review');
  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    params: { id: '999' },
    body: { action: 'approve' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 404);
});

test('GET /adoptions returns 500 on db error', async () => {
  const { db } = createDbMockQueue([
    [[{ 1: 1 }]],
    new Error('DB down'),
  ]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');
  const req = createReq({ session: { user: { UserRole: 'STAFF' } }, query: {} });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 500);
});

test('GET /adoptions/my returns 500 on db error', async () => {
  const { db } = createDbMockQueue([
    [[{ 1: 1 }]],
    new Error('DB down'),
  ]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/my');
  const req = createReq({ session: { user: { UserId: 1 } } });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 500);
});

test('POST /adoptions returns 500 on db error', async () => {
  const { db } = createDbMockQueue([
    [[{ 1: 1 }]],
    new Error('DB down'),
  ]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');
  const req = createReq({ session: { user: { UserId: 8 } }, body: { dogId: 1 } });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 500);
});

test('PUT /adoptions/:id/review returns 500 on db error', async () => {
  const { db } = createDbMockQueue([new Error('DB down')]);
  const router = loadRoute('routes/adoptions.js', { dbMock: db });
  const handlers = getHandlers(router, 'put', '/:id/review');
  const req = createReq({
    session: { user: { UserRole: 'ADMIN' } },
    params: { id: '1' },
    body: { action: 'approve' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 500);
});
