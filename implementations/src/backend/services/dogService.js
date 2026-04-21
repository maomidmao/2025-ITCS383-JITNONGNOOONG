const db = require('../config/db');

/**

* Convert availability (frontend) → DB enum
  */
  function mapAvailabilityToStatus(availability) {
  const mapping = {
  'Available': 'AVAILABLE',
  'Pending': 'PENDING',
  'Adopted': 'ADOPTED',
  };
  return mapping[availability] || availability;
  }

/**

* Build WHERE clause only (แยกให้ชัด)
  */
  function buildWhereClause(filters = {}) {
  let where = ' WHERE 1=1 ';
  const params = [];

if (filters.keyword && filters.keyword.trim()) {
where += ' AND (d.DogName LIKE ? OR d.breed LIKE ?)';
const kw = `%${filters.keyword}%`;
params.push(kw, kw);
}

if (filters.breed && filters.breed.trim()) {
where += ' AND d.breed = ?';
params.push(filters.breed.trim());
}

if (filters.color && filters.color.trim()) {
where += ' AND d.color = ?';
params.push(filters.color.trim());
}

if (filters.training_status && filters.training_status.trim()) {
where += ' AND d.training_status = ?';
params.push(filters.training_status.trim());
}

if (filters.availability && filters.availability.trim()) {
const status = mapAvailabilityToStatus(filters.availability.trim());
where += ' AND d.DogStatus = ?';
params.push(status);
}

return { where, params };
}

/**

* SEARCH FUNCTION 
  */
  async function searchDogs(filters = {}, limit = 10, offset = 0) {
  try {
  const { where, params } = buildWhereClause(filters);

  // ✅ COUNT QUERY (เขียนใหม่ ไม่ใช้ replace)
  const countSql = `    SELECT COUNT(*) as total
     FROM dogs d
     LEFT JOIN users u ON d.created_by = u.UserId
     ${where}
   `;

  const [countResult] = await db.execute(countSql, params);
  const total = countResult[0]?.total || 0;

  // ✅ SEARCH QUERY
  const searchSql = `    SELECT d.*, u.FirstName AS staff_name
     FROM dogs d
     LEFT JOIN users u ON d.created_by = u.UserId
     ${where}
     ORDER BY d.created_at DESC
     LIMIT ? OFFSET ?
   `;

  const searchParams = [...params, limit, offset];
  const [dogs] = await db.execute(searchSql, searchParams);

  return {
  dogs,
  total,
  limit,
  offset,
  hasMore: offset + limit < total,
  };

} catch (err) {
console.error('Dog search service error:', err);
throw new Error('Database query failed');
}
}

/**

* Get dog by ID
  */
  async function getDogById(dogId) {
  try {
  const [rows] = await db.execute(
  `SELECT d.*, u.FirstName AS staff_name
      FROM dogs d
      LEFT JOIN users u ON d.created_by = u.UserId
      WHERE d.DogId = ?`,
  [dogId]
  );
  return rows[0] || null;
  } catch (err) {
  console.error(err);
  throw new Error('Database query failed');
  }
  }

/**

* Get all dogs
  */
  async function getAllDogs(limit = 10, offset = 0) {
  return searchDogs({}, limit, offset);
  }

module.exports = {
searchDogs,
getDogById,
getAllDogs,
};
