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
});

test('POST /favourites/:dogId returns success message', async () => {
  const { db } = createDbMockQueue([[{}]]);
  const router = loadRoute('routes/favourites.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/:dogId');

  const req = createReq({ session: { user: { UserId: 10 } }, params: { dogId: '5' } });
  const res = await runHandlers(handlers, req);

  assert.deepEqual(res.body, { message: 'เพิ่มในรายการโปรดแล้ว' });
});

test('DELETE /favourites/:dogId returns success message', async () => {
  const { db } = createDbMockQueue([[{}]]);
  const router = loadRoute('routes/favourites.js', { dbMock: db });
  const handlers = getHandlers(router, 'delete', '/:dogId');

  const req = createReq({ session: { user: { UserId: 10 } }, params: { dogId: '5' } });
  const res = await runHandlers(handlers, req);

  assert.deepEqual(res.body, { message: 'นำออกจากรายการโปรดแล้ว' });
});
