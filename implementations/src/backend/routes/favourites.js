const router = require('express').Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

/* GET /api/favourites */
router.get('/', requireAuth, async (req, res) => {
  try {
    const uid = req.session.user.UserId;
    const [rows] = await db.execute(
      `SELECT d.DogId AS id, d.DogName AS name, d.Age AS age, d.breed, d.color, d.image_url, d.DogStatus AS status
       FROM favorites f JOIN dogs d ON f.DogId = d.DogId WHERE f.UserId = ?`, [uid]
    );
    res.json({ favourites: rows.map(r => ({ ...r, status: r.status.toLowerCase() })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* POST /api/favourites/:dogId */
router.post('/:dogId', requireAuth, async (req, res) => {
  try {
    const uid = req.session.user.UserId;
    await db.execute(
      'INSERT IGNORE INTO favorites (UserId, DogId) VALUES (?, ?)',
      [uid, req.params.dogId]
    );
    res.json({ message: 'เพิ่มในรายการโปรดแล้ว' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* DELETE /api/favourites/:dogId */
router.delete('/:dogId', requireAuth, async (req, res) => {
  try {
    const uid = req.session.user.UserId;
    await db.execute(
      'DELETE FROM favorites WHERE UserId = ? AND DogId = ?',
      [uid, req.params.dogId]
    );
    res.json({ message: 'นำออกจากรายการโปรดแล้ว' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
