const path = require('path');

const backendRoot = path.resolve(__dirname, '..');

function setMock(moduleAbsPath, exportsValue) {
  require.cache[moduleAbsPath] = {
    id: moduleAbsPath,
    filename: moduleAbsPath,
    loaded: true,
    exports: exportsValue,
  };
}

function clearModule(moduleAbsPath) {
  delete require.cache[moduleAbsPath];
}

function loadRoute(routeFile, { dbMock, bcryptMock } = {}) {
  const dbPath = path.join(backendRoot, 'config/db.js');
  clearModule(dbPath);
  setMock(dbPath, dbMock || { execute: async () => [[[]]] });

  if (bcryptMock) {
    const bcryptPath = require.resolve('bcrypt', { paths: [backendRoot] });
    clearModule(bcryptPath);
    setMock(bcryptPath, bcryptMock);
  }

  const routePath = path.join(backendRoot, routeFile);
  clearModule(routePath);
  return require(routePath);
}

function getHandlers(router, method, routePath) {
  const layer = router.stack.find(
    (l) => l.route && l.route.path === routePath && l.route.methods[method.toLowerCase()]
  );
  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${routePath}`);
  }
  return layer.route.stack.map((s) => s.handle);
}

function pickHandlers(router, method, routePath, indices) {
  const handlers = getHandlers(router, method, routePath);
  return indices.map((i) => handlers[i]);
}

function createReq({ body = {}, query = {}, params = {}, session = null, file = undefined, files = undefined } = {}) {
  return { body, query, params, session, file, files };
}

function createRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    clearedCookies: [],
    sentFile: null,
    finished: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.finished = true;
      return this;
    },
    send(payload) {
      this.body = payload;
      this.finished = true;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
    },
    clearCookie(name) {
      this.clearedCookies.push(name);
      return this;
    },
    sendFile(filePath) {
      this.sentFile = filePath;
      this.finished = true;
      return this;
    },
  };
}

async function runHandlers(handlers, req, res = createRes()) {
  async function runAt(index) {
    if (index >= handlers.length || res.finished) return;
    const handler = handlers[index];

    if (handler.length >= 3) {
      let nextCalled = false;
      let nextErr;
      const next = (err) => {
        nextCalled = true;
        nextErr = err;
      };
      const out = handler(req, res, next);
      if (out && typeof out.then === 'function') await out;
      if (nextErr) throw nextErr;
      if (nextCalled) {
        await runAt(index + 1);
      }
      return;
    }

    const out = handler(req, res);
    if (out && typeof out.then === 'function') await out;
    await runAt(index + 1);
  }

  await runAt(0);
  return res;
}

function createDbMockQueue(queue = []) {
  const calls = [];
  const db = {
    execute: async (sql, params = []) => {
      calls.push({ sql, params });
      if (!queue.length) {
        throw new Error(`No mock DB result for SQL: ${sql}`);
      }
      const next = queue.shift();
      if (next instanceof Error) throw next;
      if (typeof next === 'function') return next({ sql, params, calls });
      return next;
    },
  };
  return { db, calls };
}

module.exports = {
  loadRoute,
  getHandlers,
  pickHandlers,
  createReq,
  createRes,
  runHandlers,
  createDbMockQueue,
};
