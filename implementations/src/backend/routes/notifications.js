const router = require('express').Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

/* GET /api/notifications */
router.get('/', requireAuth, async (req, res) => {
  try {
    const uid = req.session.user.UserId;
    const [rows] = await db.execute(
      'SELECT id, user_id, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [uid]
    );
    
    res.json({
      success: true,
      data: rows,
      message: 'Notifications fetched successfully'
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

/* POST /api/notifications (internal use) */
router.post('/', async (req, res) => {
  try {
    const { user_id, message, type } = req.body;
    
    if (!user_id || !message || !type) {
      return res.status(400).json({ success: false, data: null, message: 'Missing required fields' });
    }

    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [user_id, message, type]
    );
    
    res.status(201).json({
      success: true,
      data: { id: result.insertId },
      message: 'Notification created successfully'
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

/* PATCH /api/notifications/:id/read */
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const uid = req.session.user.UserId;
    const { id } = req.params;
    
    const [result] = await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, uid]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Notification not found or unauthorized' });
    }
    
    res.json({
      success: true,
      data: null,
      message: 'Notification marked as read'
    });
  } catch (err) {
    console.error('Error updating notification:', err);
    res.status(500).json({ success: false, data: null, message: 'Server error' });
  }
});

module.exports = router;
