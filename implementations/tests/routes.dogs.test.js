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

test('GET /dogs returns normalized dogs', async () => {
  const { db } = createDbMockQueue([
    [[{
      DogId: 1,
      DogName: 'Lucky',
      Age: 3,
      breed: 'Thai',
      gender: 'MALE',
      color: 'Brown',
      medical_profile: null,
      treatment_process: null,
      training_status: null,
      image_url: '/img/lucky.jpg',
      DogStatus: 'AVAILABLE',
      staff_name: 'Staff',
      created_at: '2026-01-01',
    }]],
  ]);

  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');
  const res = await runHandlers(handlers, createReq({ query: { status: 'available' } }));

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.dogs[0].status, 'available');
  assert.equal(res.body.dogs[0].name, 'Lucky');
});

test('GET /dogs/:id returns 404 when not found', async () => {
  const { db } = createDbMockQueue([[[]]]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/:id');

  const res = await runHandlers(handlers, createReq({ params: { id: '999' } }));
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: 'ไม่พบสุนัข' });
});

test('POST /dogs returns 201 on valid payload', async () => {
  const { db } = createDbMockQueue([[{ insertId: 55 }]]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/', [0, 2]);

  const req = createReq({
    body: { name: 'Milo', gender: 'male', age: '2' },
    session: { user: { UserId: 7, UserRole: 'STAFF' } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { message: 'เพิ่มสุนัขสำเร็จ', dogId: 55 });
});

test('PUT /dogs/:id returns 400 when no updatable fields', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'put', '/:id', [0, 2]);

  const req = createReq({ params: { id: '1' }, session: { user: { UserRole: 'ADMIN' } }, body: {} });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'ไม่มีข้อมูลที่ต้องการแก้ไข' });
});

test('DELETE /dogs/:id returns success message for ADMIN', async () => {
  const { db } = createDbMockQueue([[{}]]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'delete', '/:id');

  const req = createReq({ params: { id: '2' }, session: { user: { UserRole: 'ADMIN' } } });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'ลบสุนัขสำเร็จ' });
});

test('POST /dogs/:id/treatments returns 400 when note missing', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:id/treatments');

  const req = createReq({ params: { id: '2' }, session: { user: { UserRole: 'STAFF' } }, body: {} });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'กรุณาระบุบันทึกการรักษา' });
});

test('POST /dogs/:id/trainings returns 404 when dog not found', async () => {
  const { db } = createDbMockQueue([[[]]]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:id/trainings');

  const req = createReq({ params: { id: '2' }, session: { user: { UserRole: 'STAFF' } }, body: { note: 'sit' } });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: 'ไม่พบสุนัข' });
});
