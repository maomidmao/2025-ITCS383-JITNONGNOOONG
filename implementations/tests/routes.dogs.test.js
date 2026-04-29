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

test('GET /dogs with breed, search, and gender filters', async () => {
  const { db } = createDbMockQueue([
    [[{
      DogId: 2, DogName: 'Buddy', Age: 1, breed: 'Poodle', gender: 'FEMALE',
      color: 'White', medical_profile: 'ok', treatment_process: 'done',
      training_status: 'trained', image_url: '/img/b.jpg', DogStatus: 'PENDING',
      staff_name: 'Admin', created_at: '2026-02-01',
    }]],
  ]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');
  const res = await runHandlers(handlers, createReq({
    query: { breed: 'Poodle', search: 'Buddy', gender: 'female' },
  }));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.dogs[0].gender, 'female');
  assert.equal(res.body.dogs[0].breed, 'Poodle');
});

test('GET /dogs returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');
  const res = await runHandlers(handlers, createReq());

  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
});

test('GET /dogs/:id returns dog when found', async () => {
  const { db } = createDbMockQueue([
    [[{
      DogId: 5, DogName: 'Rex', Age: 4, breed: 'Lab', gender: 'MALE',
      color: 'Golden', medical_profile: null, treatment_process: null,
      training_status: null, image_url: null, DogStatus: 'AVAILABLE',
      staff_name: null, created_at: '2026-01-01',
    }]],
  ]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/:id');
  const res = await runHandlers(handlers, createReq({ params: { id: '5' } }));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.dog.name, 'Rex');
  assert.equal(res.body.dog.id, 5);
});

test('GET /dogs/:id returns 404 when not found', async () => {
  const { db } = createDbMockQueue([[[]]]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/:id');

  const res = await runHandlers(handlers, createReq({ params: { id: '999' } }));
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: 'ไม่พบสุนัข' });
});

test('GET /dogs/:id returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/:id');

  const res = await runHandlers(handlers, createReq({ params: { id: '1' } }));
  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
});

test('GET /dogs/search validates limit parameter', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/search');

  const res = await runHandlers(handlers, createReq({ query: { limit: '101' } }));
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /limit/i);
});

test('GET /dogs/search validates limit is NaN', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/search');

  const res = await runHandlers(handlers, createReq({ query: { limit: 'invalid' } }));
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /limit/i);
});

test('GET /dogs/search validates offset is non-negative', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/search');

  const res = await runHandlers(handlers, createReq({ query: { offset: '-1' } }));
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /offset/i);
});

test('GET /dogs/search returns paginated results', async () => {
  const { db } = createDbMockQueue([
    [[{ total: 1 }]],  // Count result
    [[{ DogId: 1, DogName: 'Test', Age: 2, breed: 'Thai', gender: 'MALE', color: 'Brown', medical_profile: null, treatment_process: null, training_status: null, image_url: '/img/t.jpg', DogStatus: 'AVAILABLE', staff_name: 'Staff', created_at: '2026-01-01' }]],  // Dogs result
  ]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/search');

  const res = await runHandlers(handlers, createReq({ query: { limit: '10', offset: '0' } }));
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.data);
});

test('GET /dogs/search returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/search');

  const res = await runHandlers(handlers, createReq({ query: { limit: '10', offset: '0' } }));
  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
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

test('POST /dogs validates required fields', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/', [0, 2]);

  const req = createReq({
    body: { gender: 'male' },
    session: { user: { UserId: 7, UserRole: 'STAFF' } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /กรุณาระบุ/i);
});

test('POST /dogs returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/', [0, 2]);

  const req = createReq({
    body: { name: 'Milo', gender: 'male', age: '2' },
    session: { user: { UserId: 7, UserRole: 'STAFF' } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
});

test('PUT /dogs/:id updates dog successfully', async () => {
  const { db } = createDbMockQueue([[{ affectedRows: 1 }]]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'put', '/:id', [0, 2]);

  const req = createReq({
    params: { id: '1' },
    body: { dogName: 'Updated' },
    session: { user: { UserRole: 'ADMIN' } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /อัปเดต|สำเร็จ/);
});

test('PUT /dogs/:id returns 400 when no updatable fields', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'put', '/:id', [0, 2]);

  const req = createReq({
    params: { id: '1' },
    session: { user: { UserRole: 'ADMIN' } },
    body: {},
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'ไม่มีข้อมูลที่ต้องการแก้ไข' });
});

test('PUT /dogs/:id returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'put', '/:id', [0, 2]);

  const req = createReq({
    params: { id: '1' },
    body: { dogName: 'Updated' },
    session: { user: { UserRole: 'ADMIN' } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
});

test('DELETE /dogs/:id with adoption requests', async () => {
  const { db } = createDbMockQueue([
    [[{ AdoptionReqNo: 1 }, { AdoptionReqNo: 2 }]],  // SELECT adoption requests
    [{}],  // DELETE monthly_followups
    [{}],  // DELETE delivery_schedules
    [{}],  // DELETE adoption_requests
    [{}],  // DELETE dogs
  ]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'delete', '/:id');

  const req = createReq({
    params: { id: '1' },
    session: { user: { UserRole: 'ADMIN' } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /ลบ|สำเร็จ/);
});

test('DELETE /dogs/:id returns success message for ADMIN', async () => {
  const { db } = createDbMockQueue([
    [[]],  // SELECT AdoptionReqNo (no adoption requests)
    [{}],  // DELETE FROM dogs
  ]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'delete', '/:id');

  const req = createReq({
    params: { id: '2' },
    session: { user: { UserRole: 'ADMIN' } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'ลบสุนัขสำเร็จ' });
});

test('DELETE /dogs/:id returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'delete', '/:id');

  const req = createReq({
    params: { id: '1' },
    session: { user: { UserRole: 'ADMIN' } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
});

test('POST /dogs/:id/treatments returns 400 when note missing', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:id/treatments');

  const req = createReq({
    params: { id: '2' },
    session: { user: { UserRole: 'STAFF' } },
    body: {},
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'กรุณาระบุบันทึกการรักษา' });
});

test('POST /dogs/:id/treatments creates treatment successfully', async () => {
  const { db } = createDbMockQueue([[{ insertId: 10 }]]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/:id/treatments', [0, 1]);

  const req = createReq({
    params: { id: '2' },
    session: { user: { UserId: 5, UserRole: 'STAFF' } },
    body: { note: 'vaccination done' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 201);
  assert.match(res.body.message, /สำเร็จ|บันทึก/);
});

test('POST /dogs/:id/treatments returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/:id/treatments', [0, 1]);

  const req = createReq({
    params: { id: '2' },
    session: { user: { UserId: 5, UserRole: 'STAFF' } },
    body: { note: 'test' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
});

test('POST /dogs/:id/trainings returns 404 when dog not found', async () => {
  const { db } = createDbMockQueue([[[]]]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:id/trainings');

  const req = createReq({
    params: { id: '2' },
    session: { user: { UserRole: 'STAFF' } },
    body: { note: 'sit' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: 'ไม่พบสุนัข' });
});

test('POST /dogs/:id/trainings creates training successfully', async () => {
  const { db } = createDbMockQueue([
    [[{ DogId: 2 }]],  // SELECT result
    [{ affectedRows: 1 }],  // UPDATE result
  ]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/:id/trainings', [0, 1]);

  const req = createReq({
    params: { id: '2' },
    session: { user: { UserId: 5, UserRole: 'STAFF' } },
    body: { note: 'obedience training' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 201);
  assert.match(res.body.message, /สำเร็จ|บันทึก/);
});

test('POST /dogs/:id/trainings returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('DB error')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/:id/trainings', [0, 1]);

  const req = createReq({
    params: { id: '2' },
    session: { user: { UserId: 5, UserRole: 'STAFF' } },
    body: { note: 'test' },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /เกิดข้อผิดพลาด/);
});

test('POST /dogs returns 400 when name missing', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/', [0, 2]);
  const req = createReq({
    body: { gender: 'male' },
    session: { user: { UserId: 7, UserRole: 'STAFF' } },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /กรุณาระบุชื่อสุนัข/);
});

test('PUT /dogs/:id updates fields successfully', async () => {
  const { db } = createDbMockQueue([[{}]]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'put', '/:id', [0, 2]);
  const req = createReq({
    params: { id: '1' },
    session: { user: { UserRole: 'ADMIN' } },
    body: { dogName: 'NewName', age: '5', breed: 'Lab', gender: 'MALE', color: 'Brown', medical_profile: 'ok', treatment_process: 'done', training_status: 'good', status: 'available' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'อัปเดตข้อมูลสำเร็จ' });
});

test('GET /dogs returns 500 on db error', async () => {
  const { db } = createDbMockQueue([new Error('DB down')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');
  const res = await runHandlers(handlers, createReq());
  assert.equal(res.statusCode, 500);
});

test('GET /dogs/:id returns 500 on db error', async () => {
  const { db } = createDbMockQueue([new Error('DB down')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/:id');
  const res = await runHandlers(handlers, createReq({ params: { id: '1' } }));
  assert.equal(res.statusCode, 500);
});

test('POST /dogs returns 500 on db error', async () => {
  const { db } = createDbMockQueue([new Error('DB down')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'post', '/', [0, 2]);
  const req = createReq({
    body: { name: 'Crash', gender: 'male' },
    session: { user: { UserId: 7, UserRole: 'STAFF' } },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 500);
});

test('PUT /dogs/:id returns 500 on db error', async () => {
  const { db } = createDbMockQueue([new Error('DB down')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = pickHandlers(router, 'put', '/:id', [0, 2]);
  const req = createReq({
    params: { id: '1' },
    session: { user: { UserRole: 'ADMIN' } },
    body: { dogName: 'CrashDog' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 500);
});

test('DELETE /dogs/:id returns 500 on db error', async () => {
  const { db } = createDbMockQueue([new Error('DB down')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'delete', '/:id');
  const req = createReq({ params: { id: '1' }, session: { user: { UserRole: 'ADMIN' } } });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 500);
});

test('POST /dogs/:id/treatments appends to existing treatment', async () => {
  const { db } = createDbMockQueue([
    [[{ treatment_process: 'old note' }]],
    [{}],
  ]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:id/treatments');
  const req = createReq({
    params: { id: '1' },
    session: { user: { UserRole: 'STAFF' } },
    body: { note: 'new note' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'เพิ่มบันทึกการรักษาสำเร็จ' });
});

test('POST /dogs/:id/treatments returns 500 on db error', async () => {
  const { db } = createDbMockQueue([new Error('DB down')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:id/treatments');
  const req = createReq({ params: { id: '1' }, session: { user: { UserRole: 'STAFF' } }, body: { note: 'test' } });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 500);
});

test('POST /dogs/:id/trainings appends to existing training', async () => {
  const { db } = createDbMockQueue([
    [[{ training_status: 'sit' }]],
    [{}],
  ]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:id/trainings');
  const req = createReq({
    params: { id: '1' },
    session: { user: { UserRole: 'STAFF' } },
    body: { note: 'stay' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'เพิ่มบันทึกการฝึกสำเร็จ' });
});

test('POST /dogs/:id/trainings returns 400 when note missing', async () => {
  const { db } = createDbMockQueue([]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:id/trainings');
  const req = createReq({ params: { id: '1' }, session: { user: { UserRole: 'STAFF' } }, body: {} });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'กรุณาระบุบันทึกการฝึก' });
});

test('POST /dogs/:id/trainings returns 500 on db error', async () => {
  const { db } = createDbMockQueue([new Error('DB down')]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:id/trainings');
  const req = createReq({ params: { id: '1' }, session: { user: { UserRole: 'STAFF' } }, body: { note: 'test' } });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 500);
});

test('POST /dogs/:id/treatments first note on empty treatment_process', async () => {
  const { db } = createDbMockQueue([
    [[{ treatment_process: null }]],
    [{}],
  ]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:id/treatments');
  const req = createReq({
    params: { id: '1' },
    session: { user: { UserRole: 'STAFF' } },
    body: { note: 'first treatment' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 200);
});

test('POST /dogs/:id/trainings first note on empty training_status', async () => {
  const { db } = createDbMockQueue([
    [[{ training_status: null }]],
    [{}],
  ]);
  const router = loadRoute('routes/dogs.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:id/trainings');
  const req = createReq({
    params: { id: '1' },
    session: { user: { UserRole: 'STAFF' } },
    body: { note: 'first training' },
  });
  const res = await runHandlers(handlers, req);
  assert.equal(res.statusCode, 200);
});
