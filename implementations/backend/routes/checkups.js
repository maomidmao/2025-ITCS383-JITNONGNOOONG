/**
 * routes/checkups.js
 * Monthly follow-up tracking.
 *
 * Business rule: followups are only available after DeliveryStatus = COMPLETED.
 * The API returns delivery_status so the frontend can enforce this.
 */
const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const db      = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../frontend/followups')),
  filename:    (req, file, cb) => cb(null, Date.now() + '_' + file.originalname),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

let followupUserRoleColumnReady = false;
async function ensureFollowupUserRoleColumn() {
  if (followupUserRoleColumnReady) return;

  const [userRoleCol] = await db.execute(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'monthly_followups'
       AND COLUMN_NAME = 'UserRole'
     LIMIT 1`
  );

  if (!userRoleCol.length) {
    await db.execute(`
      ALTER TABLE monthly_followups
      ADD COLUMN UserRole ENUM('STAFF','USER') NOT NULL DEFAULT 'STAFF'
    `);
  }

  // Keep only one source-of-truth column for role in this table.
  const [sourceRoleCol] = await db.execute(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'monthly_followups'
       AND COLUMN_NAME = 'source_role'
     LIMIT 1`
  );
  if (sourceRoleCol.length) {
    await db.execute(`ALTER TABLE monthly_followups DROP COLUMN source_role`);
  }

  followupUserRoleColumnReady = true;
}

/* ── GET /api/checkups — returns approved adoptions with delivery_status and followup history */
router.get('/', requireAuth, async (req, res) => {
  try {
    await ensureFollowupUserRoleColumn();
    const user    = req.session.user;
    const isStaff = ['STAFF', 'ADMIN'].includes((user.UserRole || '').toUpperCase());

    let sql = `
      SELECT ar.AdoptionReqNo AS adoption_id,
             ar.UserId        AS adopter_id,
             d.DogName        AS dog_name,
             u.FirstName      AS first_name,
             u.LastName       AS last_name,
             u.phone          AS phone_num,
             ar.created_at    AS adoption_date,
             COALESCE(ds.DeliveryStatus, 'SCHEDULED') AS delivery_status
      FROM   adoption_requests ar
      JOIN   dogs  d  ON ar.DogId  = d.DogId
      JOIN   users u  ON ar.UserId = u.UserId
      LEFT   JOIN delivery_schedules ds ON ds.AdoptionReqNo = ar.AdoptionReqNo
      WHERE  ar.ReqStatus = 'APPROVED'`;

    const params = [];
    if (!isStaff) {
      sql += ' AND ar.UserId = ?';
      params.push(user.UserId);
    }
    sql += ' ORDER BY ar.created_at DESC';

    const [adoptions] = await db.execute(sql, params);

    // Attach separated records to each adoption:
    // - staff_followups: official monthly notes created by staff
    // - user_uploads: adopter submitted updates waiting for staff review
    const result = await Promise.all(adoptions.map(async a => {
      const [staffFollowups] = await db.execute(
        `SELECT FollowupNo  AS id,
                FollowupMonth AS month,
                note,
                photo_url,
                check_date  AS date,
                UserRole
         FROM   monthly_followups
         WHERE  AdoptionReqNo = ?
         AND    UserRole = 'STAFF'
         ORDER  BY FollowupMonth ASC`,
        [a.adoption_id]
      );

      const [userUploads] = await db.execute(
        `SELECT FollowupNo  AS id,
                FollowupMonth AS month,
                note,
                photo_url,
                check_date  AS date,
                UserRole
         FROM   monthly_followups
         WHERE  AdoptionReqNo = ?
         AND    UserRole = 'USER'
         ORDER  BY FollowupNo DESC`,
        [a.adoption_id]
      );

      const visibleFollowups = isStaff ? staffFollowups : userUploads;
      return {
        ...a,
        delivery_status: (a.delivery_status || 'scheduled').toLowerCase(),
        followups: visibleFollowups,
        staff_followups: staffFollowups,
        user_uploads: userUploads,
      };
    }));

    res.json({ checkups: result });
  } catch (err) {
    console.error('GET /checkups:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* ── PUT /api/checkups/:id — Staff adds a followup record (only if delivery COMPLETED) */
router.put('/:id', requireRole('STAFF', 'ADMIN'), upload.single('photo'), async (req, res) => {
  try {
    await ensureFollowupUserRoleColumn();
    // Enforce delivery must be COMPLETED
    const [deliveryRows] = await db.execute(
      `SELECT ds.DeliveryStatus
       FROM   delivery_schedules ds
       WHERE  ds.AdoptionReqNo = ?`,
      [req.params.id]
    );
    if (!deliveryRows.length || deliveryRows[0].DeliveryStatus !== 'COMPLETED') {
      return res.status(400).json({ message: 'ไม่สามารถบันทึกติดตามได้ — กรุณาจัดส่งสุนัขก่อน (เปลี่ยนสถานะนัดหมายเป็น "เสร็จสิ้น")' });
    }

    const { note, followupMonth, check_date } = req.body;
    if (!note || !followupMonth || !check_date) {
      return res.status(400).json({ message: 'กรุณากรอก note, followupMonth และ check_date' });
    }
    const photo_url = req.file ? `/followups/${req.file.filename}` : null;

    await db.execute(
      `INSERT INTO monthly_followups (AdoptionReqNo, FollowupMonth, note, photo_url, check_date, UserRole)
       VALUES (?, ?, ?, ?, ?, 'STAFF')`,
      [req.params.id, followupMonth, note, photo_url || '/followups/default.jpg', check_date]
    );
    res.json({ message: 'บันทึกการติดตามสำเร็จ' });
  } catch (err) {
    console.error('PUT /checkups/:id:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* ── POST /api/checkups/:id/upload — Adopter uploads photo + note (only if COMPLETED) */
router.post('/:id/upload', requireAuth, upload.single('adopter_image'), async (req, res) => {
  try {
    await ensureFollowupUserRoleColumn();
    if (!req.file) return res.status(400).json({ message: 'ไม่พบไฟล์รูปภาพ' });

    const user    = req.session.user;
    const isStaff = ['STAFF', 'ADMIN'].includes((user.UserRole || '').toUpperCase());

    // Verify ownership
    const [adoptRows] = await db.execute(
      'SELECT UserId FROM adoption_requests WHERE AdoptionReqNo = ?', [req.params.id]
    );
    if (!adoptRows.length) return res.status(404).json({ message: 'ไม่พบคำขอ' });
    if (!isStaff && adoptRows[0].UserId !== user.UserId) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์' });
    }

    // Enforce delivery must be COMPLETED
    const [deliveryRows] = await db.execute(
      'SELECT DeliveryStatus FROM delivery_schedules WHERE AdoptionReqNo = ?', [req.params.id]
    );
    if (!deliveryRows.length || deliveryRows[0].DeliveryStatus !== 'COMPLETED') {
      return res.status(400).json({ message: 'ยังไม่ได้รับน้องกลับบ้าน — ไม่สามารถส่งรูปภาพติดตามได้' });
    }

    const note       = req.body.note || req.body.adopter_info || 'อัปโหลดโดยผู้รับเลี้ยง';
    const photo_url  = `/followups/${req.file.filename}`;
    const check_date = new Date().toISOString().split('T')[0];

    const [countRows] = await db.execute(
      'SELECT COALESCE(MAX(FollowupMonth), 0) + 1 AS nextMonth FROM monthly_followups WHERE AdoptionReqNo = ?',
      [req.params.id]
    );
    const followupMonth = countRows[0].nextMonth;

    await db.execute(
      `INSERT INTO monthly_followups (AdoptionReqNo, FollowupMonth, note, photo_url, check_date, UserRole)
       VALUES (?, ?, ?, ?, ?, 'USER')`,
      [req.params.id, followupMonth, note, photo_url, check_date]
    );
    res.json({ message: 'อัปโหลดสำเร็จ', photo_url });
  } catch (err) {
    console.error('POST /checkups/:id/upload:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
