const test = require('node:test');
const assert = require('node:assert/strict');
const {
  loadRoute,
  getHandlers,
  createReq,
  runHandlers,
  createDbMockQueue,
} = require('./test-utils');

test('GET /api/notifications returns 200 with notifications list', async () => {
  const { db } = createDbMockQueue([
    [[
      { id: 1, user_id: 5, message: 'Dog adopted', type: 'adoption', is_read: false, created_at: '2025-01-15' },
      { id: 2, user_id: 5, message: 'New appointment', type: 'appointment', is_read: true, created_at: '2025-01-14' },
    ]],
  ]);

  const router = loadRoute('routes/notifications.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');
  const req = createReq({
    session: { user: { UserId: 5 } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.length, 2);
  assert.equal(res.body.data[0].message, 'Dog adopted');
  assert.equal(res.body.message, 'Notifications fetched successfully');
});

test('GET /api/notifications returns empty list when no notifications', async () => {
  const { db } = createDbMockQueue([[[]]]);

  const router = loadRoute('routes/notifications.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');
  const req = createReq({
    session: { user: { UserId: 5 } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.length, 0);
});

test('GET /api/notifications returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('Database connection failed')]);

  const router = loadRoute('routes/notifications.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');
  const req = createReq({
    session: { user: { UserId: 5 } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Server error');
});

test('POST /api/notifications returns 201 when notification created', async () => {
  const { db, calls } = createDbMockQueue([
    [{ insertId: 10 }],
  ]);

  const router = loadRoute('routes/notifications.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');
  const req = createReq({
    body: {
      user_id: 5,
      message: 'Your dog has been adopted!',
      type: 'adoption',
    },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.id, 10);
  assert.equal(res.body.message, 'Notification created successfully');
  assert.equal(calls[0].params[0], 5);
  assert.equal(calls[0].params[1], 'Your dog has been adopted!');
  assert.equal(calls[0].params[2], 'adoption');
});

test('POST /api/notifications returns 400 for missing user_id', async () => {
  const { db } = createDbMockQueue([]);

  const router = loadRoute('routes/notifications.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');
  const req = createReq({
    body: {
      message: 'Your dog has been adopted!',
      type: 'adoption',
    },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Missing required fields');
});

test('POST /api/notifications returns 400 for missing message', async () => {
  const { db } = createDbMockQueue([]);

  const router = loadRoute('routes/notifications.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');
  const req = createReq({
    body: {
      user_id: 5,
      type: 'adoption',
    },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Missing required fields');
});

test('POST /api/notifications returns 400 for missing type', async () => {
  const { db } = createDbMockQueue([]);

  const router = loadRoute('routes/notifications.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');
  const req = createReq({
    body: {
      user_id: 5,
      message: 'Your dog has been adopted!',
    },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Missing required fields');
});

test('POST /api/notifications returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('Database insert failed')]);

  const router = loadRoute('routes/notifications.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');
  const req = createReq({
    body: {
      user_id: 5,
      message: 'Your dog has been adopted!',
      type: 'adoption',
    },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Server error');
});

test('PATCH /api/notifications/:id/read marks notification as read', async () => {
  const { db, calls } = createDbMockQueue([
    [{ affectedRows: 1 }],
  ]);

  const router = loadRoute('routes/notifications.js', { dbMock: db });
  const handlers = getHandlers(router, 'patch', '/:id/read');
  const req = createReq({
    params: { id: '7' },
    session: { user: { UserId: 5 } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.message, 'Notification marked as read');
  assert.equal(calls[0].params[0], '7');
  assert.equal(calls[0].params[1], 5);
});

test('PATCH /api/notifications/:id/read returns 404 when notification not found', async () => {
  const { db } = createDbMockQueue([
    [{ affectedRows: 0 }],
  ]);

  const router = loadRoute('routes/notifications.js', { dbMock: db });
  const handlers = getHandlers(router, 'patch', '/:id/read');
  const req = createReq({
    params: { id: '999' },
    session: { user: { UserId: 5 } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /Notification not found or unauthorized/);
});

test('PATCH /api/notifications/:id/read returns 500 on database error', async () => {
  const { db } = createDbMockQueue([new Error('Database update failed')]);

  const router = loadRoute('routes/notifications.js', { dbMock: db });
  const handlers = getHandlers(router, 'patch', '/:id/read');
  const req = createReq({
    params: { id: '7' },
    session: { user: { UserId: 5 } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Server error');
});

test('POST /api/notifications handles empty string fields', async () => {
  const { db } = createDbMockQueue([]);

  const router = loadRoute('routes/notifications.js', { dbMock: db });
  const handlers = getHandlers(router, 'post', '/');
  const req = createReq({
    body: {
      user_id: '',
      message: 'Test',
      type: 'notification',
    },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test('GET /api/notifications orders results by created_at DESC', async () => {
  const { db, calls } = createDbMockQueue([
    [[
      { id: 1, user_id: 5, message: 'Newer', type: 'test', is_read: false, created_at: '2025-01-16' },
      { id: 2, user_id: 5, message: 'Older', type: 'test', is_read: false, created_at: '2025-01-10' },
    ]],
  ]);

  const router = loadRoute('routes/notifications.js', { dbMock: db });
  const handlers = getHandlers(router, 'get', '/');
  const req = createReq({
    session: { user: { UserId: 5 } },
  });
  const res = await runHandlers(handlers, req);

  assert.equal(res.statusCode, 200);
  assert.match(calls[0].sql, /ORDER BY created_at DESC/);
});
