const db = require('../config/db');

/**
 * Dog Search Service
 * Handles database queries for searching and filtering dogs
 */

/**
 * Helper: Convert availability string to DogStatus enum
 * @param {string} availability - 'Available' | 'Pending' | 'Adopted'
 * @returns {string} - 'AVAILABLE' | 'PENDING' | 'ADOPTED'
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
 * Build dynamic search query with filters
 * Uses parameterized queries to prevent SQL injection and handle special characters
 *
 * @param {Object} filters - Filter object
 * @param {string} filters.keyword - Search by name or breed (optional)
 * @param {string} filters.breed - Exact breed match (optional)
 * @param {string} filters.color - Exact color match (optional)
 * @param {string} filters.training_status - Filter by training status (optional)
 * @param {string} filters.availability - Filter by availability status (optional)
 * @returns {Object} { sql, params } - Parameterized SQL and values
 */
function buildSearchQuery(filters = {}) {
  let sql = `
    SELECT d.*, u.FirstName AS staff_name
    FROM dogs d
    LEFT JOIN users u ON d.created_by = u.UserId
    WHERE 1=1
  `;
  const params = [];

  // Filter by keyword (search in name and breed)
  // Special characters are automatically handled by parameterized queries
  if (filters.keyword && filters.keyword.trim()) {
    sql += ' AND (d.DogName LIKE ? OR d.breed LIKE ?)';
    const wildcardKeyword = `%${filters.keyword}%`;
    params.push(wildcardKeyword, wildcardKeyword);
  }

  // Filter by exact breed
  if (filters.breed && filters.breed.trim()) {
    sql += ' AND d.breed = ?';
    params.push(filters.breed.trim());
  }

  // Filter by exact color
  if (filters.color && filters.color.trim()) {
    sql += ' AND d.color = ?';
    params.push(filters.color.trim());
  }

  // Filter by training status
  if (filters.training_status && filters.training_status.trim()) {
    sql += ' AND d.training_status = ?';
    params.push(filters.training_status.trim());
  }

  // Filter by availability (convert to DogStatus enum)
  if (filters.availability && filters.availability.trim()) {
    const status = mapAvailabilityToStatus(filters.availability.trim());
    sql += ' AND d.DogStatus = ?';
    params.push(status);
  }

  return { sql, params };
}

/**
 * Search dogs with filters and pagination
 * Returns filtered dogs and total count for pagination
 *
 * @param {Object} filters - Filter object
 * @param {number} limit - Records per page (1-100)
 * @param {number} offset - Records offset for pagination
 * @returns {Promise<Object>} { dogs, total }
 * @throws {Error} - Database errors
 */
async function searchDogs(filters = {}, limit = 10, offset = 0) {
  try {
    // Build base query with filters
    const { sql: baseSql, params: baseParams } = buildSearchQuery(filters);

    // Query 1: Get total count (without pagination)
    const countSql = baseSql
      .replace('SELECT d.*, u.FirstName AS staff_name', 'SELECT COUNT(*) as total');
    const [countResult] = await db.execute(countSql, baseParams);
    const total = countResult[0]?.total || 0;

    // Query 2: Get paginated results
    const searchSql = baseSql + ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    const searchParams = [...baseParams, limit, offset];
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
 * Get a single dog by ID
 * @param {number} dogId
 * @returns {Promise<Object|null>} Dog object or null if not found
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
    console.error('Get dog by ID error:', err);
    throw new Error('Database query failed');
  }
}

/**
 * Get all available dogs (no filters)
 * @param {number} limit - Records per page
 * @param {number} offset - Records offset
 * @returns {Promise<Object>} { dogs, total }
 */
async function getAllDogs(limit = 10, offset = 0) {
  return searchDogs({}, limit, offset);
}

/**
 * Get valid enum values for dropdowns/validation
 * @returns {Object} Valid filter values
 */
function getValidValues() {
  return {
    training_status: ['Untrained', 'Partially Trained', 'Fully Trained'],
    availability: ['Available', 'Pending', 'Adopted'],
  };
}

module.exports = {
  searchDogs,
  getDogById,
  getAllDogs,
  buildSearchQuery,
  mapAvailabilityToStatus,
  getValidValues,
};
