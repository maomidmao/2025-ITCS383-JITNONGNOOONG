const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../frontend/banners')),
  filename:    (req, file, cb) => cb(null, Date.now() + '_' + file.originalname),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if ((file.mimetype || '').startsWith('image/')) return cb(null, true);
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพเท่านั้น'));
  },
});

function mapSponsorRow(r) {
  return {
    id: r.SponsorId,
    userId: r.UserId,
    donation_amount: Number(r.donation_amount || 0),
    total_donated: Number(r.total_donated || r.donation_amount || 0),
    banner_url: r.banner_url || null,
    created_at: r.created_at,
    first_name: r.FirstName,
    last_name: r.LastName,
    email: r.UserEmail,
  };
}

/* GET /api/sponsors */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.SponsorId, s.UserId, s.donation_amount, s.banner_url, s.created_at,
              COALESCE(SUM(s2.donation_amount), s.donation_amount) AS total_donated,
              u.FirstName, u.LastName, u.UserEmail
       FROM sponsors s
       JOIN users u ON s.UserId = u.UserId
       LEFT JOIN sponsors s2 ON s2.UserId = s.UserId
       GROUP BY s.SponsorId
       ORDER BY s.created_at DESC`
    );
    res.json({ sponsors: rows.map(mapSponsorRow) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* GET /api/sponsors/me */
router.get('/me', requireRole('SPONSOR', 'ADMIN'), async (req, res) => {
  try {
    const uid = req.session.user.UserId;
    const [rows] = await db.execute(
      `SELECT s.SponsorId, s.UserId, s.donation_amount, s.banner_url, s.created_at,
              COALESCE(SUM(s2.donation_amount), s.donation_amount) AS total_donated,
              u.FirstName, u.LastName, u.UserEmail
       FROM sponsors s
       JOIN users u ON s.UserId = u.UserId
       LEFT JOIN sponsors s2 ON s2.UserId = s.UserId
       WHERE s.UserId = ?
       GROUP BY s.SponsorId
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [uid]
    );
    res.json({ sponsor: rows[0] ? mapSponsorRow(rows[0]) : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* POST /api/sponsors/register  (SPONSOR role) */
router.post('/register', requireRole('SPONSOR'), (req, res, next) => {
  upload.single('banner')(req, res, function(err) {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'ไฟล์มีขนาดเกิน 5MB' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'อัปโหลดได้เฉพาะไฟล์แบนเนอร์' });
      }
    }
    return res.status(400).json({ message: err.message || 'อัปโหลดไฟล์ไม่สำเร็จ' });
  });
}, async (req, res) => {
  try {
    const { donation_amount } = req.body;
    const amount = Number(donation_amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'จำนวนเงินบริจาคไม่ถูกต้อง' });
    }

    const banner_url = req.file ? `/banners/${req.file.filename}` : null;
    const uid = req.session.user.UserId;

    const [existing] = await db.execute('SELECT SponsorId, banner_url FROM sponsors WHERE UserId = ?', [uid]);
    if (existing.length) {
      await db.execute(
        'UPDATE sponsors SET donation_amount = ?, banner_url = ? WHERE UserId = ?',
        [
          amount,
          banner_url || existing[0].banner_url || '/banners/default.jpg',
          uid,
        ]
      );
    } else {
      await db.execute(
        'INSERT INTO sponsors (UserId, donation_amount, banner_url) VALUES (?, ?, ?)',
        [uid, amount, banner_url || '/banners/default.jpg']
      );
    }
    res.json({ message: 'บันทึกข้อมูลผู้สนับสนุนสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
