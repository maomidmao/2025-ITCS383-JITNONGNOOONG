const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const backendRoot = path.resolve(__dirname, '../src/backend');

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

function loadService(servicePath, dbMock) {
  const dbPath = path.join(backendRoot, 'config/db.js');
  clearModule(dbPath);
  setMock(dbPath, dbMock || { execute: async () => [[[]]] });

  const fullPath = path.join(backendRoot, servicePath);
  clearModule(fullPath);
  return require(fullPath);
}

test('searchDogs returns dogs with limit and offset', async () => {
  const mockDb = {
    execute: async (sql, params) => {
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 25 }]];
      }
      return [[
        { DogId: 1, DogName: 'Buddy', breed: 'Labrador', DogStatus: 'AVAILABLE', staff_name: 'John' },
        { DogId: 2, DogName: 'Max', breed: 'Golden Retriever', DogStatus: 'AVAILABLE', staff_name: 'John' },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.searchDogs({}, 10, 0);

  assert.equal(result.dogs.length, 2);
  assert.equal(result.total, 25);
  assert.equal(result.limit, 10);
  assert.equal(result.offset, 0);
  assert.equal(result.hasMore, true);
});

test('searchDogs with keyword filter', async () => {
  let capturedParams = [];
  const mockDb = {
    execute: async (sql, params) => {
      capturedParams = params;
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 1 }]];
      }
      return [[
        { DogId: 1, DogName: 'Buddy', breed: 'Labrador', DogStatus: 'AVAILABLE', staff_name: 'John' },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.searchDogs({ keyword: 'Buddy' }, 10, 0);

  assert.equal(result.dogs.length, 1);
  assert.equal(result.dogs[0].DogName, 'Buddy');
  assert.match(capturedParams[0], /Buddy/);
  assert.match(capturedParams[1], /Buddy/);
});

test('searchDogs with breed filter', async () => {
  let capturedParams = [];
  const mockDb = {
    execute: async (sql, params) => {
      capturedParams = params;
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 1 }]];
      }
      return [[
        { DogId: 1, DogName: 'Buddy', breed: 'Labrador', DogStatus: 'AVAILABLE', staff_name: 'John' },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.searchDogs({ breed: 'Labrador' }, 10, 0);

  assert.equal(result.dogs.length, 1);
  assert.equal(result.dogs[0].breed, 'Labrador');
  assert.match(capturedParams[0], /Labrador/);
});

test('searchDogs with color filter', async () => {
  let capturedParams = [];
  const mockDb = {
    execute: async (sql, params) => {
      capturedParams = params;
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 1 }]];
      }
      return [[
        { DogId: 1, DogName: 'Buddy', breed: 'Labrador', color: 'brown', DogStatus: 'AVAILABLE', staff_name: 'John' },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.searchDogs({ color: 'brown' }, 10, 0);

  assert.equal(result.dogs.length, 1);
  assert.match(capturedParams[0], /brown/);
});

test('searchDogs with training_status filter', async () => {
  let capturedParams = [];
  const mockDb = {
    execute: async (sql, params) => {
      capturedParams = params;
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 1 }]];
      }
      return [[
        { DogId: 1, DogName: 'Buddy', training_status: 'TRAINED', DogStatus: 'AVAILABLE', staff_name: 'John' },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.searchDogs({ training_status: 'TRAINED' }, 10, 0);

  assert.equal(result.dogs.length, 1);
  assert.match(capturedParams[0], /TRAINED/);
});

test('searchDogs with availability filter - Available', async () => {
  let capturedParams = [];
  const mockDb = {
    execute: async (sql, params) => {
      capturedParams = params;
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 1 }]];
      }
      return [[
        { DogId: 1, DogName: 'Buddy', breed: 'Labrador', DogStatus: 'AVAILABLE', staff_name: 'John' },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.searchDogs({ availability: 'Available' }, 10, 0);

  assert.equal(result.dogs.length, 1);
  assert.match(capturedParams[0], /AVAILABLE/);
});

test('searchDogs with availability filter - Pending', async () => {
  let capturedParams = [];
  const mockDb = {
    execute: async (sql, params) => {
      capturedParams = params;
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 1 }]];
      }
      return [[
        { DogId: 1, DogName: 'Buddy', breed: 'Labrador', DogStatus: 'PENDING', staff_name: 'John' },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.searchDogs({ availability: 'Pending' }, 10, 0);

  assert.equal(result.dogs.length, 1);
  assert.match(capturedParams[0], /PENDING/);
});

test('searchDogs with availability filter - Adopted', async () => {
  let capturedParams = [];
  const mockDb = {
    execute: async (sql, params) => {
      capturedParams = params;
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 1 }]];
      }
      return [[
        { DogId: 1, DogName: 'Buddy', breed: 'Labrador', DogStatus: 'ADOPTED', staff_name: 'John' },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.searchDogs({ availability: 'Adopted' }, 10, 0);

  assert.equal(result.dogs.length, 1);
  assert.match(capturedParams[0], /ADOPTED/);
});

test('searchDogs with multiple filters', async () => {
  let sqlExecuted = '';
  const mockDb = {
    execute: async (sql, params) => {
      sqlExecuted = sql;
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 1 }]];
      }
      return [[
        { DogId: 1, DogName: 'Buddy', breed: 'Labrador', color: 'brown', training_status: 'TRAINED', DogStatus: 'AVAILABLE', staff_name: 'John' },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.searchDogs(
    {
      keyword: 'Buddy',
      breed: 'Labrador',
      color: 'brown',
      training_status: 'TRAINED',
      availability: 'Available',
    },
    10,
    0
  );

  assert.equal(result.dogs.length, 1);
  assert.match(sqlExecuted, /DogName LIKE/);
  assert.match(sqlExecuted, /breed =/);
  assert.match(sqlExecuted, /color =/);
  assert.match(sqlExecuted, /training_status =/);
  assert.match(sqlExecuted, /DogStatus =/);
});

test('searchDogs with empty keyword (should ignore)', async () => {
  let capturedParams = [];
  const mockDb = {
    execute: async (sql, params) => {
      capturedParams = params;
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 0 }]];
      }
      return [[]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.searchDogs({ keyword: '   ' }, 10, 0);

  // Should not contain keyword filter (check only string params)
  assert(!capturedParams.find(p => typeof p === 'string' && p.includes('%')));
});

test('searchDogs returns hasMore=false when offset + limit >= total', async () => {
  const mockDb = {
    execute: async (sql, params) => {
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 10 }]];
      }
      return [[
        { DogId: 1, DogName: 'Buddy', breed: 'Labrador', DogStatus: 'AVAILABLE', staff_name: 'John' },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.searchDogs({}, 10, 5);

  assert.equal(result.hasMore, false);
});

test('searchDogs throws error on database failure', async () => {
  const mockDb = {
    execute: async (sql, params) => {
      throw new Error('Database connection failed');
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  
  try {
    await service.searchDogs({}, 10, 0);
    assert.fail('Should have thrown error');
  } catch (err) {
    assert.match(err.message, /Database query failed/);
  }
});

test('getDogById returns dog with staff name', async () => {
  const mockDb = {
    execute: async (sql, params) => {
      return [[
        { DogId: 1, DogName: 'Buddy', breed: 'Labrador', DogStatus: 'AVAILABLE', staff_name: 'John', created_by: 2 },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.getDogById(1);

  assert.equal(result.DogId, 1);
  assert.equal(result.DogName, 'Buddy');
  assert.equal(result.staff_name, 'John');
});

test('getDogById returns null for non-existent dog', async () => {
  const mockDb = {
    execute: async (sql, params) => {
      return [[]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.getDogById(999);

  assert.equal(result, null);
});

test('getDogById throws error on database failure', async () => {
  const mockDb = {
    execute: async (sql, params) => {
      throw new Error('Database connection failed');
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  
  try {
    await service.getDogById(1);
    assert.fail('Should have thrown error');
  } catch (err) {
    assert.match(err.message, /Database query failed/);
  }
});

test('getAllDogs calls searchDogs with empty filters', async () => {
  const mockDb = {
    execute: async (sql, params) => {
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 2 }]];
      }
      return [[
        { DogId: 1, DogName: 'Buddy', breed: 'Labrador', DogStatus: 'AVAILABLE', staff_name: 'John' },
        { DogId: 2, DogName: 'Max', breed: 'Golden Retriever', DogStatus: 'AVAILABLE', staff_name: 'Jane' },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.getAllDogs(10, 0);

  assert.equal(result.dogs.length, 2);
  assert.equal(result.total, 2);
  assert.equal(result.limit, 10);
});

test('getAllDogs uses custom limit and offset', async () => {
  let capturedParams = [];
  const mockDb = {
    execute: async (sql, params) => {
      capturedParams = params;
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 50 }]];
      }
      return [[
        { DogId: 1, DogName: 'Buddy', breed: 'Labrador', DogStatus: 'AVAILABLE', staff_name: 'John' },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.getAllDogs(20, 10);

  assert.equal(result.limit, 20);
  assert.equal(result.offset, 10);
  // Last two params should be limit and offset
  assert.equal(capturedParams[capturedParams.length - 2], 20);
  assert.equal(capturedParams[capturedParams.length - 1], 10);
});

test('searchDogs handles null total from COUNT', async () => {
  const mockDb = {
    execute: async (sql, params) => {
      if (sql.includes('COUNT(*)')) {
        return [[]];
      }
      return [[]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.searchDogs({}, 10, 0);

  assert.equal(result.total, 0);
});

test('searchDogs respects pagination correctly', async () => {
  const mockDb = {
    execute: async (sql, params) => {
      if (sql.includes('COUNT(*)')) {
        return [[{ total: 50 }]];
      }
      return [[
        { DogId: 11, DogName: 'Buddy11', breed: 'Labrador', DogStatus: 'AVAILABLE', staff_name: 'John' },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.searchDogs({}, 10, 40);

  assert.equal(result.hasMore, false);
  assert.equal(result.offset, 40);
  assert.equal(result.limit, 10);
});

test('getDogById includes all dog properties', async () => {
  const mockDb = {
    execute: async (sql, params) => {
      return [[
        {
          DogId: 1,
          DogName: 'Buddy',
          breed: 'Labrador',
          color: 'brown',
          age: 3,
          DogStatus: 'AVAILABLE',
          training_status: 'TRAINED',
          created_by: 2,
          staff_name: 'John',
        },
      ]];
    },
  };

  const service = loadService('services/dogService.js', mockDb);
  const result = await service.getDogById(1);

  assert.equal(result.DogId, 1);
  assert.equal(result.DogName, 'Buddy');
  assert.equal(result.color, 'brown');
  assert.equal(result.age, 3);
  assert.equal(result.training_status, 'TRAINED');
});
