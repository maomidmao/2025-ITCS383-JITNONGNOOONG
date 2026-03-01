const router = require('express').Router();
const bcrypt = require('bcrypt');
const db     = require('../config/db');

/** Inline session guard — avoids circular/undefined import issues */
function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
  }
  next();
}

/* POST /api/auth/register */
router.post('/register', async (req, res) => {
  try {
    // รองรับทั้ง 2 รูปแบบ field name ที่ frontend อาจส่งมา
    const firstName  = req.body.firstName  || req.body.first_name  || '';
    const lastName   = req.body.lastName   || req.body.last_name   || '';
    const email      = req.body.email      || '';
    const password   = req.body.password   || '';
    const citizen_id = req.body.citizen_id || req.body.citizenId   || '';
    const phone      = req.body.phone      || req.body.phone_num   || null;
    const address    = req.body.address    || null;
    // map role: frontend ส่ง "general_user"/"sponsor" → DB ใช้ "USER"/"SPONSOR"
    const rawRole = (req.body.role || '').toLowerCase();
    const roleMap = {
      'general_user': 'USER',
      'user':         'USER',
      'sponsor':      'SPONSOR',
    };
    const userRole = roleMap[rawRole] || 'USER';

    if (!firstName || !lastName || !email || !password || !citizen_id) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, นามสกุล, อีเมล, รหัสผ่าน, เลขบัตรประชาชน)' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
    }
    if (!/^\d{13}$/.test(citizen_id)) {
      return res.status(400).json({ message: 'เลขบัตรประชาชนต้องมี 13 หลัก' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      `INSERT INTO users (FirstName, LastName, UserEmail, password_hash, citizen_id, phone, address, UserRole)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, hash, citizen_id, phone || null, address || null, userRole]
    );

    // Keep citizen registry in sync for newly registered users
    await db.execute(
      `INSERT INTO citizen_records (citizen_id, full_name, birth_date)
       VALUES (?, ?, NULL)
       ON DUPLICATE KEY UPDATE full_name = COALESCE(citizen_records.full_name, VALUES(full_name))`,
      [citizen_id, `${firstName} ${lastName}`.trim()]
    );

    res.status(201).json({ message: 'ลงทะเบียนสำเร็จ', userId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'อีเมลนี้ถูกใช้แล้ว' });
    }
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE UserEmail = ?', [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }
    const user = rows[0];

    // Detect real bcrypt hash (60 chars) vs fake seed placeholder like '$2b$10$hash1'
    let valid = false;
    const isRealHash = user.password_hash.startsWith('$2b$') && user.password_hash.length === 60;
    if (isRealHash) {
      valid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Seed data uses fake placeholders → accept demo password
      valid = (password === 'Password123!');
    }
    if (!valid) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // normalize ให้ frontend ใช้ได้ทั้ง camelCase และ snake_case
    req.session.user = {
      // DB field names (UPPERCASE)
      UserId:     user.UserId,
      FirstName:  user.FirstName,
      LastName:   user.LastName,
      UserEmail:  user.UserEmail,
      UserRole:   user.UserRole,
      citizen_id: user.citizen_id,
      // frontend-friendly aliases (lowercase)
      id:         user.UserId,
      first_name: user.FirstName,
      last_name:  user.LastName,
      email:      user.UserEmail,
      role:       user.UserRole.toLowerCase(),   // 'admin','staff','user','sponsor'
    };

    // กำหนด redirect URL ตาม role
    const redirectMap = {
      ADMIN:   '/pages/admin-dashboard.html',
      STAFF:   '/pages/staff-dashboard/dogmanagement.html',
      SPONSOR: '/pages/sponsor-dashboard.html',
      USER:    '/pages/user-dashboard/favourites.html',
    };
    const redirect = redirectMap[user.UserRole] || '/pages/dogs.html';
    res.json({ message: 'เข้าสู่ระบบสำเร็จ', user: req.session.user, redirect });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

/* POST /api/auth/logout */
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'ออกจากระบบสำเร็จ' });
  });
});

/* GET /api/auth/me */
router.get('/me', requireSession, (req, res) => {
  res.json({ user: req.session.user });
});

module.exports = router;
