const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadRoute,
  getHandlers,
  createReq,
  runHandlers,
  createDbMockQueue,
} = require('./test-utils');

test('GET /favourites returns lowercase status', async () => {
  const { db } = createDbMockQueue([
    [[{ id: 1, name: 'Lucky', age: 2, breed: 'Thai', color: 'Black', image_url: '/img/1.jpg', status: 'ADOPTED' }]],
  ]);
  const router = loadRoute('routes/favourites.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');

  const req = createReq({ session: { user: { UserId: 10 } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.favourites[0].status, 'adopted');
  assert.equal(res.body.favourites[0].name, 'Lucky');
});

test('GET /favourites returns multiple favorites', async () => {
  const { db } = createDbMockQueue([
    [[
      { id: 1, name: 'Lucky', age: 2, breed: 'Thai', color: 'Black', image_url: '/img/1.jpg', status: 'AVAILABLE' },
      { id: 2, name: 'Max', age: 3, breed: 'Labrador', color: 'Golden', image_url: '/img/2.jpg', status: 'ADOPTED' },
      { id: 3, name: 'Buddy', age: 1, breed: 'Beagle', color: 'Brown', image_url: '/img/3.jpg', status: 'PENDING' },
    ]],
  ]);
  const router = loadRoute('routes/favourites.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');

  const req = createReq({ session: { user: { UserId: 10 } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.favourites.length, 3);
  assert.equal(res.body.favourites[0].status, 'available');
  assert.equal(res.body.favourites[1].status, 'adopted');
  assert.equal(res.body.favourites[2].status, 'pending');
});

test('GET /favourites returns empty list', async () => {
  const { db } = createDbMockQueue([[[]]]);
  const router = loadRoute('routes/favourites.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');

  const req = createReq({ session: { user: { UserId: 10 } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.favourites.length, 0);
});

test('GET /favourites returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('Database error')]);
  const router = loadRoute('routes/favourites.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');

  const req = createReq({ session: { user: { UserId: 10 } } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'เกิดข้อผิดพลาด' });
});

test('POST /favourites/:dogId returns success message', async () => {
  const { db, calls } = createDbMockQueue([[{}]]);
  const router = loadRoute('routes/favourites.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:dogId');

  const req = createReq({ session: { user: { UserId: 10 } }, params: { dogId: '5' } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'เพิ่มในรายการโปรดแล้ว' });
  assert.equal(calls[0].params[0], 10);
  assert.equal(calls[0].params[1], '5');
});

test('POST /favourites/:dogId handles duplicate insert', async () => {
  const { db } = createDbMockQueue([[{}]]);
  const router = loadRoute('routes/favourites.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:dogId');

  const req = createReq({ session: { user: { UserId: 10 } }, params: { dogId: '5' } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'เพิ่มในรายการโปรดแล้ว' });
});

test('POST /favourites/:dogId returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('Database error')]);
  const router = loadRoute('routes/favourites.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:dogId');

  const req = createReq({ session: { user: { UserId: 10 } }, params: { dogId: '5' } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'เกิดข้อผิดพลาด' });
});

test('DELETE /favourites/:dogId returns success message', async () => {
  const { db, calls } = createDbMockQueue([[{}]]);
  const router = loadRoute('routes/favourites.js', { dbMock: db });
  const handlers = getHandlers(router, 'delete', '/:dogId');

  const req = createReq({ session: { user: { UserId: 10 } }, params: { dogId: '5' } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'นำออกจากรายการโปรดแล้ว' });
  assert.equal(calls[0].params[0], 10);
  assert.equal(calls[0].params[1], '5');
});

test('DELETE /favourites/:dogId deletes by userId and dogId', async () => {
  const { db, calls } = createDbMockQueue([[{}]]);
  const router = loadRoute('routes/favourites.js', { dbMock: db });
  const handlers = getHandlers(router, 'delete', '/:dogId');

  const req = createReq({ session: { user: { UserId: 99 } }, params: { dogId: '77' } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(calls[0].params[0], 99);
  assert.equal(calls[0].params[1], '77');
});

test('DELETE /favourites/:dogId returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('Database error')]);
  const router = loadRoute('routes/favourites.js', { dbMock: db });
  const handlers = getHandlers(router, 'delete', '/:dogId');

  const req = createReq({ session: { user: { UserId: 10 } }, params: { dogId: '5' } });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'เกิดข้อผิดพลาด' });
});
