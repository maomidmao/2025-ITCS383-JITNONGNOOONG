/**
 * routes/appointments.js
 *
 * Flow:
 *   1. Staff approves adoption  → delivery_schedules row created (no date yet, DeliveryStatus=SCHEDULED)
 *   2. User picks their date    → POST /api/appointments  { adoptionId, deliveryDate }
 *                                 updates delivery_schedules.deliveryDate
 *   3. Staff marks COMPLETED   → PUT  /api/appointments/:id  { status:'COMPLETED' }
 *   4. Followups unlock after COMPLETED
 */
const router = require('express').Router();
const db     = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
let confirmColumnChecked = false;
let hasConfirmColumn = false;

async function ensureStaffConfirmColumn() {
  if (confirmColumnChecked) return hasConfirmColumn;
  try {
    await db.execute('SELECT StaffConfirmed FROM delivery_schedules LIMIT 1');
    hasConfirmColumn = true;
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      try {
        await db.execute('ALTER TABLE delivery_schedules ADD COLUMN StaffConfirmed TINYINT(1) NOT NULL DEFAULT 0');
        hasConfirmColumn = true;
      } catch (alterErr) {
        const denied = ['ER_DBACCESS_DENIED_ERROR', 'ER_TABLEACCESS_DENIED_ERROR', 'ER_SPECIFIC_ACCESS_DENIED_ERROR'];
        if (!denied.includes(alterErr.code)) throw alterErr;
        hasConfirmColumn = false;
      }
    } else {
      throw err;
    }
  } finally {
    confirmColumnChecked = true;
  }
  return hasConfirmColumn;
}

/* ── GET /api/appointments
   Staff/Admin: all schedules
   User: only their own */
router.get('/', requireAuth, async (req, res) => {
  try {
    const canTrackConfirm = await ensureStaffConfirmColumn();
    const user    = req.session.user;
    const isStaff = ['STAFF', 'ADMIN'].includes((user.UserRole || '').toUpperCase());

    let sql = `
      SELECT ds.DeliveryNo          AS id,
             ar.AdoptionReqNo       AS adoptionId,
             ds.deliveryDate        AS deliveryDate,
             ds.DeliveryStatus      AS status,
             ${canTrackConfirm ? 'COALESCE(ds.StaffConfirmed, 0)' : '0'} AS staffConfirmed,
             d.DogName              AS dogName,
             u.FirstName            AS firstName,
             u.LastName             AS lastName,
             u.phone                AS phone,
             u.UserEmail            AS email
      FROM   adoption_requests  ar
      JOIN   dogs               d  ON ar.DogId  = d.DogId
      JOIN   users              u  ON ar.UserId = u.UserId
      LEFT   JOIN delivery_schedules ds ON ds.AdoptionReqNo = ar.AdoptionReqNo
      WHERE  ar.ReqStatus = 'APPROVED'`;

    const params = [];
    if (!isStaff) {
      sql += ' AND ar.UserId = ?';
      params.push(user.UserId);
    }
    sql += ' ORDER BY ds.deliveryDate IS NULL DESC, ds.deliveryDate ASC';

    const [rows] = await db.execute(sql, params);
    res.json({ appointments: rows.map(normalise) });
  } catch (err) {
    console.error('GET /appointments:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* ── POST /api/appointments — User sets their preferred pickup date ── */
router.post('/', requireAuth, async (req, res) => {
  try {
    const canTrackConfirm = await ensureStaffConfirmColumn();
    const { adoptionId, deliveryDate } = req.body;
    if (!adoptionId || !deliveryDate) {
      return res.status(400).json({ message: 'กรุณาระบุ adoptionId และ deliveryDate' });
    }

    const user = req.session.user;

    // Verify ownership — user can only set date for their own approved adoption
    const [adoptRows] = await db.execute(
      "SELECT UserId, ReqStatus FROM adoption_requests WHERE AdoptionReqNo=?",
      [adoptionId]
    );
    if (!adoptRows.length) return res.status(404).json({ message: 'ไม่พบคำขอ' });
    if (adoptRows[0].ReqStatus !== 'APPROVED') {
      return res.status(400).json({ message: 'คำขอยังไม่ได้รับการอนุมัติ' });
    }
    const isStaff = ['STAFF', 'ADMIN'].includes((user.UserRole || '').toUpperCase());
    if (!isStaff && adoptRows[0].UserId !== user.UserId) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์' });
    }

    // Update deliveryDate in existing delivery_schedules row
    const [dsRows] = await db.execute(
      'SELECT DeliveryNo FROM delivery_schedules WHERE AdoptionReqNo=?', [adoptionId]
    );
    if (!dsRows.length) {
      // Create if not exists (edge case)
      await db.execute(
        'INSERT INTO delivery_schedules (AdoptionReqNo, deliveryDate) VALUES (?, ?)',
        [adoptionId, deliveryDate]
      );
    } else {
      if (canTrackConfirm) {
        await db.execute(
          'UPDATE delivery_schedules SET deliveryDate=?, StaffConfirmed=0 WHERE AdoptionReqNo=?',
          [deliveryDate, adoptionId]
        );
      } else {
        await db.execute(
          'UPDATE delivery_schedules SET deliveryDate=? WHERE AdoptionReqNo=?',
          [deliveryDate, adoptionId]
        );
      }
    }

    res.json({ message: 'บันทึกวันรับสุนัขสำเร็จ' });
  } catch (err) {
    console.error('POST /appointments:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* ── PUT /api/appointments/:id — Staff marks COMPLETED ── */
router.put('/:id', requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const canTrackConfirm = await ensureStaffConfirmColumn();
    const { status, action } = req.body;
    const rawAction = (action || '').toUpperCase();

    if (rawAction === 'CONFIRM_DATE') {
      if (!canTrackConfirm) {
        return res.status(500).json({ message: 'ระบบยังไม่พร้อมสำหรับการยืนยันวันนัด (ไม่พบคอลัมน์ StaffConfirmed)' });
      }
      await db.execute(
        'UPDATE delivery_schedules SET StaffConfirmed=1 WHERE DeliveryNo=? AND deliveryDate IS NOT NULL',
        [req.params.id]
      );
      return res.json({ message: 'ยืนยันวันนัดรับสำเร็จ' });
    }

    const newStatus = (status || '').toUpperCase();
    if (!['SCHEDULED', 'COMPLETED'].includes(newStatus)) {
      return res.status(400).json({ message: 'สถานะต้องเป็น SCHEDULED หรือ COMPLETED' });
    }
    if (newStatus === 'COMPLETED' && canTrackConfirm) {
      const [rows] = await db.execute(
        'SELECT deliveryDate, StaffConfirmed FROM delivery_schedules WHERE DeliveryNo=?',
        [req.params.id]
      );
      if (!rows.length) return res.status(404).json({ message: 'ไม่พบนัดหมาย' });
      if (!rows[0].deliveryDate) {
        return res.status(400).json({ message: 'ยังไม่กำหนดวันนัดรับ' });
      }
      if (!rows[0].StaffConfirmed) {
        return res.status(400).json({ message: 'กรุณายืนยันวันนัดรับก่อนกดเสร็จสิ้น' });
      }
    }
    await db.execute(
      'UPDATE delivery_schedules SET DeliveryStatus=? WHERE DeliveryNo=?',
      [newStatus, req.params.id]
    );
    res.json({ message: 'อัปเดตสถานะนัดหมายสำเร็จ' });
  } catch (err) {
    console.error('PUT /appointments/:id:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

function normalise(r) {
  return {
    id:           r.id   || null,            // NULL if no delivery row yet
    adoptionId:   r.adoptionId,
    deliveryDate: r.deliveryDate || null,    // NULL until user picks a date
    status:       (r.status || 'pending').toLowerCase(), // 'pending' = no delivery row
    staffConfirmed: !!r.staffConfirmed,
    dogName:      r.dogName,
    firstName:    r.firstName,
    lastName:     r.lastName,
    phone:        r.phone,
    email:        r.email,
  };
}

module.exports = router;
