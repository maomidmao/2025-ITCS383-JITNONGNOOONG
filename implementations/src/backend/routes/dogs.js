const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const dogService = require('../services/dogService');

/* Multer — store uploaded files in /frontend/img */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../frontend/img')),
  filename:    (req, file, cb) => cb(null, Date.now() + '_' + file.originalname),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Accept both 'image' (legacy) and 'dog_image' (new frontend) field names
const uploadImage = upload.fields([
  { name: 'image',     maxCount: 1 },
  { name: 'dog_image', maxCount: 1 },
]);

/** Resolve uploaded file from either field name */
function resolveImageUrl(req) {
  const files = req.files || {};
  const file  = (files.image || files.dog_image || [])[0];
  if (file)              return `/img/${file.filename}`;
  if (req.body.image_url) return req.body.image_url.trim();
  return null;
}

/** Accept both 'name' (frontend) and 'dogName' (legacy) */
function resolveDogName(body) {
  return (body.name || body.dogName || '').trim();
}

/* Map DB status (UPPERCASE) ↔ API status (lowercase) */
const toApi = s => (s || '').toLowerCase();
const toDB  = s => (s || '').toUpperCase();

/* ─────────────────────────────────────────────────────────────
   GET /api/dogs/search
   Search and filter dogs with pagination
   Query params: keyword, breed, color, training_status, availability, limit, offset
   ───────────────────────────────────────────────────────────── */
router.get('/search', async (req, res) => {
  try {
    const {
      keyword,
      breed,
      color,
      training_status,
      availability,
      limit = 10,
      offset = 0,
    } = req.query;

    // Validate pagination parameters
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Limit must be a number between 1 and 100',
      });
    }

    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Offset must be a non-negative number',
      });
    }

    // Validate enum values if provided
    const validValues = dogService.getValidValues();

    if (training_status && !validValues.training_status.includes(training_status)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid training_status. Valid values: ${validValues.training_status.join(', ')}`,
      });
    }

    if (availability && !validValues.availability.includes(availability)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid availability. Valid values: ${validValues.availability.join(', ')}`,
      });
    }

    // Build search filters object
    const filters = {
      keyword: keyword || undefined,
      breed: breed || undefined,
      color: color || undefined,
      training_status: training_status || undefined,
      availability: availability || undefined,
    };

    // Call service to perform search
    const result = await dogService.searchDogs(filters, limitNum, offsetNum);

    // Return standardized response
    return res.status(200).json({
      success: true,
      data: {
        dogs: result.dogs.map(normalise),
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.hasMore,
        },
      },
      message: 'Search completed successfully',
    });
  } catch (err) {
    console.error('Search route error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Database query failed',
    });
  }
});

/* GET /api/dogs */
router.get('/', async (req, res) => {
  try {
    const { status, breed, search, gender } = req.query;
    let sql = `SELECT d.*, u.FirstName AS staff_name
               FROM dogs d LEFT JOIN users u ON d.created_by = u.UserId WHERE 1=1`;
    const params = [];

    if (status) { sql += ' AND d.DogStatus = ?'; params.push(toDB(status)); }
    if (breed)  { sql += ' AND d.breed = ?';      params.push(breed); }
    if (gender) { sql += ' AND d.gender = ?';     params.push(gender.toUpperCase()); }
    if (search) { sql += ' AND (d.DogName LIKE ? OR d.breed LIKE ?)';
                  params.push(`%${search}%`, `%${search}%`); }

    sql += ' ORDER BY d.created_at DESC';
    const [dogs] = await db.execute(sql, params);
    res.json({ dogs: dogs.map(normalise) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* GET /api/dogs/:id */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT d.*, u.FirstName AS staff_name
       FROM dogs d LEFT JOIN users u ON d.created_by = u.UserId
       WHERE d.DogId = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'ไม่พบสุนัข' });
    res.json({ dog: normalise(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* POST /api/dogs  (STAFF / ADMIN only) */
router.post('/', requireRole('STAFF', 'ADMIN'), uploadImage, async (req, res) => {
  try {
    const dogName = resolveDogName(req.body);
    if (!dogName) return res.status(400).json({ message: 'กรุณาระบุชื่อสุนัข (name หรือ dogName)' });
    const { age, breed, gender, color, medical_profile, treatment_process, training_status } = req.body;

    const image_url = resolveImageUrl(req);

    const [result] = await db.execute(
      `INSERT INTO dogs
         (DogName, Age, breed, gender, color, medical_profile,
          treatment_process, training_status, image_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [dogName,
       age ? parseInt(age) : null,
       breed  || null,
       gender ? gender.toUpperCase() : 'UNKNOWN',
       color  || null,
       medical_profile   || null,
       treatment_process || null,
       training_status   || null,
       image_url,
       req.session.user.UserId]
    );
    res.status(201).json({ message: 'เพิ่มสุนัขสำเร็จ', dogId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* PUT /api/dogs/:id  (STAFF / ADMIN only) */
router.put('/:id', requireRole('STAFF', 'ADMIN'), uploadImage, async (req, res) => {
  try {
    const { dogName, age, breed, gender, color,
            medical_profile, treatment_process, training_status, status } = req.body;
    const fields = [], params = [];

    if (dogName !== undefined)            { fields.push('DogName = ?');           params.push(dogName); }
    if (age !== undefined)                { fields.push('Age = ?');               params.push(age ? parseInt(age) : null); }
    if (breed !== undefined)              { fields.push('breed = ?');             params.push(breed); }
    if (gender !== undefined)             { fields.push('gender = ?');            params.push(gender.toUpperCase()); }
    if (color !== undefined)              { fields.push('color = ?');             params.push(color); }
    if (medical_profile !== undefined)    { fields.push('medical_profile = ?');   params.push(medical_profile); }
    if (treatment_process !== undefined)  { fields.push('treatment_process = ?'); params.push(treatment_process); }
    if (training_status !== undefined)    { fields.push('training_status = ?');   params.push(training_status); }
    if (status)                           { fields.push('DogStatus = ?');         params.push(toDB(status)); }

    // Image: uploaded file takes priority, then image_url field
    const newImage = resolveImageUrl(req);
    if (newImage) { fields.push('image_url = ?'); params.push(newImage); }

    if (!fields.length) return res.status(400).json({ message: 'ไม่มีข้อมูลที่ต้องการแก้ไข' });
    params.push(req.params.id);
    await db.execute(`UPDATE dogs SET ${fields.join(', ')} WHERE DogId = ?`, params);
    res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* DELETE /api/dogs/:id  (ADMIN only) */
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    await db.execute('DELETE FROM dogs WHERE DogId = ?', [req.params.id]);
    res.json({ message: 'ลบสุนัขสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* POST /api/dogs/:id/treatments */
router.post('/:id/treatments', requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ message: 'กรุณาระบุบันทึกการรักษา' });
    const [rows] = await db.execute('SELECT treatment_process FROM dogs WHERE DogId = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'ไม่พบสุนัข' });
    const updated = rows[0].treatment_process
      ? rows[0].treatment_process + '\n' + note : note;
    await db.execute('UPDATE dogs SET treatment_process = ? WHERE DogId = ?', [updated, req.params.id]);
    res.json({ message: 'เพิ่มบันทึกการรักษาสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* POST /api/dogs/:id/trainings */
router.post('/:id/trainings', requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ message: 'กรุณาระบุบันทึกการฝึก' });
    const [rows] = await db.execute('SELECT training_status FROM dogs WHERE DogId = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'ไม่พบสุนัข' });
    const updated = rows[0].training_status
      ? rows[0].training_status + '\n' + note : note;
    await db.execute('UPDATE dogs SET training_status = ? WHERE DogId = ?', [updated, req.params.id]);
    res.json({ message: 'เพิ่มบันทึกการฝึกสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

function normalise(d) {
  return {
    id:                d.DogId,
    dog_id:            d.DogId,   
    name:              d.DogName,
    age:               d.Age,                           
    breed:             d.breed,
    gender:            (d.gender || 'unknown').toLowerCase(),
    color:             d.color,
    medical_profile:   d.medical_profile,
    treatment_process: d.treatment_process,
    training_status:   d.training_status,
    image_url:         d.image_url,                        
    status:            toApi(d.DogStatus),
    staff_name:        d.staff_name,
    created_at:        d.created_at,
  };
}

module.exports = router;