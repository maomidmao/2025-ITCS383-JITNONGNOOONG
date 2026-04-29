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

test('GET /checkups returns checkup list with followups for staff', async () => {
  const { db } = createDbMockQueue([
    [[{ ok: 1 }]],
    [[]],
    [[{ adoption_id: 1, adopter_id: 9, dog_name: 'Milo', first_name: 'F', last_name: 'L', phone_num: '090', adoption_date: '2026-01-01', delivery_status: 'COMPLETED' }]],
    [[{ id: 1, month: 1, note: 'ok', photo_url: '/f/1.jpg', date: '2026-02-01', UserRole: 'STAFF' }]],
    [[{ id: 2, month: 2, note: 'great', photo_url: '/f/2.jpg', date: '2026-03-01', UserRole: 'USER' }]],
  ]);

  const router = loadRoute('routes/checkups.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');
  const req = createReq({ session: { user: { UserId: 9, UserRole: 'STAFF' } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.checkups[0].delivery_status, 'completed');
  assert.equal(res.body.checkups[0].followups.length, 1);
});

test('GET /checkups filters by user ID for non-staff', async () => {
  const { db } = createDbMockQueue([
    [[{ ok: 1 }]],
    [[]],
    [[{ adoption_id: 1, adopter_id: 9, dog_name: 'Milo', first_name: 'F', last_name: 'L', phone_num: '090', adoption_date: '2026-01-01', delivery_status: 'COMPLETED' }]],
    [[{ id: 1, month: 1, note: 'ok', photo_url: '/f/1.jpg', date: '2026-02-01', UserRole: 'STAFF' }]],
    [[]],
  ]);

  const router = loadRoute('routes/checkups.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');
  const req = createReq({ session: { user: { UserId: 9, UserRole: 'USER' } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.checkups[0].adoption_id, 1);
});

test('GET /checkups returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/checkups.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');
  const req = createReq({ session: { user: { UserId: 9, UserRole: 'USER' } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
});

test('PUT /checkups/:id rejects when delivery is not completed', async () => {
  const { db } = createDbMockQueue([
    [[{ ok: 1 }]],
    [[]],
    [[{ DeliveryStatus: 'SCHEDULED' }]],
  ]);

  const router = loadRoute('routes/checkups.js', { dbMock: db });
  const handlers = pickHandlers(router, 'put', '/:id', [0, 2]);

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    params: { id: '1' },
    body: { note: 'ok', followupMonth: 1, check_date: '2026-03-01' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /กรุณาจัดส่งสุนัขก่อน/);
});

test('PUT /checkups/:id validates required fields', async () => {
  const { db } = createDbMockQueue([
    [[{ DeliveryStatus: 'COMPLETED' }]],
  ]);

  const router = loadRoute('routes/checkups.js', { dbMock: db });
  const handlers = pickHandlers(router, 'put', '/:id', [0, 2]);

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    params: { id: '1' },
    body: {},
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /กรุณากรอก/);
});

test('PUT /checkups/:id creates followup on completed delivery', async () => {
  const { db, calls } = createDbMockQueue([
    [[{ ok: 1 }]],
    [[]],
    [[{ DeliveryStatus: 'COMPLETED', AdoptionReqNo: 1 }]],
    [{}],
  ]);

  const router = loadRoute('routes/checkups.js', { dbMock: db });
  const handlers = pickHandlers(router, 'put', '/:id', [0, 2]);

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    params: { id: '1' },
    body: { note: 'checkup ok', followupMonth: 1, check_date: '2026-03-01' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /บันทึก/);
});

test('PUT /checkups/:id returns 500 on database error', async () => {
  const { db } = createDbMockQueue([
    [[{ ok: 1 }]],
    [[]],
    new Error('DB error'),
  ]);

  const router = loadRoute('routes/checkups.js', { dbMock: db });
  const handlers = pickHandlers(router, 'put', '/:id', [0, 2]);

  const req = createReq({
    session: { user: { UserRole: 'STAFF' } },
    params: { id: '1' },
    body: { note: 'ok', followupMonth: 1, check_date: '2026-03-01' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
});

test('POST /checkups/:id/upload requires image file', async () => {
  const { db } = createDbMockQueue([
    [[{ ok: 1 }]],
    [[]],
  ]);
  const router = loadRoute('routes/checkups.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/:id/upload', [0, 2]);

  const req = createReq({ session: { user: { UserId: 1, UserRole: 'USER' } }, params: { id: '1' } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'ไม่พบไฟล์รูปภาพ' });
});

test('POST /checkups/:id/upload requires adoption request', async () => {
  const { db } = createDbMockQueue([
    [[{ ok: 1 }]],
    [[]],
    [[]],
  ]);
  const router = loadRoute('routes/checkups.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/:id/upload', [0, 2]);

  const req = createReq({
    session: { user: { UserId: 1, UserRole: 'USER' } },
    params: { id: '999' },
    file: { filename: 'test.jpg' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 404);
  assert.match(res.body.message, /ไม่พบ/);
});

test('POST /checkups/:id/upload creates followup with image', async () => {
  const { db, calls } = createDbMockQueue([
    [[{ ok: 1 }]],  // ensureFollowupUserRoleColumn
    [[{ UserId: 1 }]],  // SELECT UserId
    [[{ DeliveryStatus: 'COMPLETED' }]],  // SELECT DeliveryStatus
    [[{ nextMonth: 1 }]],  // SELECT MAX
    [{}],  // INSERT
  ]);
  const router = loadRoute('routes/checkups.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/:id/upload', [0, 2]);

  const req = createReq({
    session: { user: { UserId: 1, UserRole: 'USER' } },
    params: { id: '1' },
    file: { filename: 'photo.jpg' },
    body: { followupMonth: 1, note: 'looking good' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /บันทึก|สำเร็จ/);
});

test('POST /checkups/:id/upload returns 500 on database error', async () => {
  const { db } = createDbMockQueue([
    [[{ ok: 1 }]],
    [[]],
    new Error('DB error'),
  ]);
  const router = loadRoute('routes/checkups.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/:id/upload', [0, 2]);

  const req = createReq({
    session: { user: { UserId: 1, UserRole: 'USER' } },
    params: { id: '1' },
    file: { filename: 'photo.jpg' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
});
