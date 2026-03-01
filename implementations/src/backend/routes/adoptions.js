/**
 * routes/adoptions.js
 *
 * Core schema:
 *   adoption_requests         : AdoptionReqNo, UserId, DogId, ReqStatus,
 *                               verification_status, rejection_reason, created_at
 *   delivery_schedules        : DeliveryNo, AdoptionReqNo, deliveryDate, DeliveryStatus
 *   adoption_request_details* : AdoptionReqNo, adopter_address, living_type, adoption_reason
 *   * optional; API will auto-create if possible, otherwise gracefully fallback
 *
 * Flow:
 *   1. User submits adoption request  (POST /api/adoptions)
 *   2. Staff approves  (PUT /:id/review)
 *      → creates delivery_schedules row (deliveryDate = NULL, user fills it next)
 *   3. User chooses pickup date  (POST /api/appointments)
 *      → updates delivery_schedules.deliveryDate
 *   3. Staff marks delivery COMPLETED  (PUT /api/appointments/:id)
 *   4. Monthly followups unlock after COMPLETED
 */
const router = require('express').Router();
const db     = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
let detailsTableChecked = false;
let detailsTableAvailable = false;

async function hasAdoptionDetailsTable() {
  if (detailsTableChecked) return detailsTableAvailable;
  try {
    await db.execute('SELECT 1 FROM adoption_request_details LIMIT 1');
    detailsTableAvailable = true;
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      try {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS adoption_request_details (
            AdoptionReqNo INT PRIMARY KEY,
            adopter_address TEXT NULL,
            living_type ENUM('house','condo','apartment','townhouse') NULL,
            adoption_reason TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (AdoptionReqNo) REFERENCES adoption_requests(AdoptionReqNo) ON DELETE CASCADE
          )
        `);
        detailsTableAvailable = true;
      } catch (createErr) {
        const denied = ['ER_DBACCESS_DENIED_ERROR', 'ER_TABLEACCESS_DENIED_ERROR', 'ER_SPECIFIC_ACCESS_DENIED_ERROR'];
        if (denied.includes(createErr.code)) {
          detailsTableAvailable = false;
        } else {
          throw createErr;
        }
      }
    } else {
      throw err;
    }
  } finally {
    detailsTableChecked = true;
  }
  return detailsTableAvailable;
}

/* ── GET /api/adoptions — Staff: all requests ── */
router.get('/', requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const withDetails = await hasAdoptionDetailsTable();
    const { status } = req.query;
    let sql = `
      SELECT ar.*, d.DogName, d.breed, d.image_url,
             u.FirstName, u.LastName, u.UserEmail, u.phone, u.citizen_id, u.address AS user_address
             ${withDetails ? ', ard.adopter_address, ard.living_type, ard.adoption_reason' : ''}
      FROM   adoption_requests ar
      JOIN   dogs  d ON ar.DogId  = d.DogId
      JOIN   users u ON ar.UserId = u.UserId
      ${withDetails ? 'LEFT JOIN adoption_request_details ard ON ard.AdoptionReqNo = ar.AdoptionReqNo' : ''}
      WHERE  1=1`;
    const params = [];
    if (status) { sql += ' AND ar.ReqStatus = ?'; params.push(status.toUpperCase()); }
    sql += ' ORDER BY ar.created_at DESC';
    const [rows] = await db.execute(sql, params);
    res.json({ adoptions: rows.map(normalise) });
  } catch (err) {
    console.error('GET /adoptions:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* ── GET /api/adoptions/my — Authenticated user's own requests ── */
router.get('/my', requireAuth, async (req, res) => {
  try {
    const withDetails = await hasAdoptionDetailsTable();
    const [rows] = await db.execute(
      `SELECT ar.*, d.DogName, d.breed, d.image_url,
              u.address AS user_address
              ${withDetails ? ', ard.adopter_address, ard.living_type, ard.adoption_reason' : ''}
       FROM   adoption_requests ar
       JOIN   dogs d ON ar.DogId = d.DogId
       JOIN   users u ON ar.UserId = u.UserId
       ${withDetails ? 'LEFT JOIN adoption_request_details ard ON ard.AdoptionReqNo = ar.AdoptionReqNo' : ''}
       WHERE  ar.UserId = ?
       ORDER  BY ar.created_at DESC`,
      [req.session.user.UserId]
    );
    res.json({ adoptions: rows.map(normalise) });
  } catch (err) {
    console.error('GET /adoptions/my:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* ── POST /api/adoptions — User submits adoption request ── */
router.post('/', requireAuth, async (req, res) => {
  try {
    const withDetails = await hasAdoptionDetailsTable();
    const { dogId, address, livingType, message } = req.body;
    if (!dogId) return res.status(400).json({ message: 'กรุณาระบุ dogId' });

    const userId = req.session.user.UserId;

    // Dog must still be open for interest
    const [dogRows] = await db.execute(
      'SELECT DogStatus FROM dogs WHERE DogId = ?',
      [dogId]
    );
    if (!dogRows.length) return res.status(404).json({ message: 'ไม่พบสุนัข' });
    const dogStatus = (dogRows[0].DogStatus || '').toUpperCase();
    if (!['AVAILABLE', 'PENDING'].includes(dogStatus)) {
      return res.status(400).json({ message: 'สุนัขตัวนี้ไม่เปิดรับคำขอแล้ว' });
    }

    // Prevent duplicate pending requests for same dog
    const [existing] = await db.execute(
      "SELECT AdoptionReqNo FROM adoption_requests WHERE UserId=? AND DogId=? AND ReqStatus='PENDING'",
      [userId, dogId]
    );
    if (existing.length) {
      return res.status(409).json({ message: 'คุณมีคำขอรอพิจารณาสำหรับสุนัขนี้แล้ว' });
    }

    // Insert using only real schema columns
    const [result] = await db.execute(
      'INSERT INTO adoption_requests (UserId, DogId) VALUES (?, ?)',
      [userId, dogId]
    );

    // Save consideration details from user request form
    const cleanedAddress = (address || '').trim() || null;
    const cleanedLiving  = (livingType || '').trim() || null;
    const cleanedMessage = (message || '').trim() || null;
    const allowedLivingTypes = new Set(['house', 'condo', 'apartment', 'townhouse']);
    if (cleanedLiving && !allowedLivingTypes.has(cleanedLiving)) {
      return res.status(400).json({ message: 'ประเภทที่พักไม่ถูกต้อง' });
    }
    if (withDetails) {
      await db.execute(
        `INSERT INTO adoption_request_details (AdoptionReqNo, adopter_address, living_type, adoption_reason)
         VALUES (?, ?, ?, ?)`,
        [result.insertId, cleanedAddress, cleanedLiving, cleanedMessage]
      );
    }

    // Keep latest user address for future requests
    if (cleanedAddress) {
      await db.execute('UPDATE users SET address = ? WHERE UserId = ?', [cleanedAddress, userId]);
    }

    // Mark as pending once at least one request exists
    if (dogStatus === 'AVAILABLE') {
      await db.execute("UPDATE dogs SET DogStatus='PENDING' WHERE DogId=?", [dogId]);
    }

    res.status(201).json({ message: 'ยื่นคำขอสำเร็จ', adoptionId: result.insertId });
  } catch (err) {
    console.error('POST /adoptions:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* ── PUT /api/adoptions/:id/review — Staff approves or rejects ── */
router.put('/:id/review', requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { action, rejection_reason } = req.body;
    const rawAction = (action || req.body.status || '').toLowerCase();
    const isApprove = rawAction === 'approve' || rawAction === 'approved';
    const isReject  = rawAction === 'reject'  || rawAction === 'rejected';

    if (!isApprove && !isReject) {
      return res.status(400).json({ message: 'action ต้องเป็น approve หรือ reject' });
    }

    const [rows] = await db.execute(
      'SELECT * FROM adoption_requests WHERE AdoptionReqNo = ?', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'ไม่พบคำขอ' });
    const adoption = rows[0];

    if (isApprove) {
      // Enforce: must pass verification before approving
      if ((adoption.verification_status || '').toUpperCase() !== 'PASSED') {
        return res.status(400).json({
          message: 'ไม่สามารถอนุมัติได้ — ต้องผ่านการตรวจสอบคุณสมบัติก่อน (verification_status = PASSED)',
        });
      }

      await db.execute(
        "UPDATE adoption_requests SET ReqStatus='APPROVED' WHERE AdoptionReqNo=?",
        [req.params.id]
      );
      await db.execute("UPDATE dogs SET DogStatus='ADOPTED' WHERE DogId=?", [adoption.DogId]);

      // Close remaining pending requests for this dog to prevent further processing
      await db.execute(
        `UPDATE adoption_requests
         SET ReqStatus='REJECTED',
             rejection_reason=COALESCE(rejection_reason, 'ปิดคำขออัตโนมัติ: มีผู้ได้รับการอนุมัติแล้ว')
         WHERE DogId=? AND AdoptionReqNo<>? AND ReqStatus='PENDING'`,
        [adoption.DogId, req.params.id]
      );

      // Create delivery_schedules row — deliveryDate will be filled by user later
      const [existingDelivery] = await db.execute(
        'SELECT DeliveryNo FROM delivery_schedules WHERE AdoptionReqNo=?', [req.params.id]
      );
      if (!existingDelivery.length) {
        await db.execute(
          "INSERT INTO delivery_schedules (AdoptionReqNo, deliveryDate) VALUES (?, CURDATE())",
          [req.params.id]
        );
      }
    } else {
      await db.execute(
        "UPDATE adoption_requests SET ReqStatus='REJECTED', verification_status='FAILED', rejection_reason=? WHERE AdoptionReqNo=?",
        [rejection_reason || null, req.params.id]
      );

      // Keep dog as pending if there are other pending requests
      const [pendingRows] = await db.execute(
        "SELECT COUNT(*) AS total FROM adoption_requests WHERE DogId=? AND ReqStatus='PENDING'",
        [adoption.DogId]
      );
      const nextDogStatus = pendingRows[0].total > 0 ? 'PENDING' : 'AVAILABLE';
      await db.execute("UPDATE dogs SET DogStatus=? WHERE DogId=?", [nextDogStatus, adoption.DogId]);
    }

    res.json({ message: isApprove ? 'อนุมัติคำขอสำเร็จ' : 'ปฏิเสธคำขอสำเร็จ' });
  } catch (err) {
    console.error('PUT /adoptions/:id/review:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* ── Normalise DB row → clean API shape ── */
function normalise(r) {
  return {
    id:                  r.AdoptionReqNo,
    userId:              r.UserId,
    dogId:               r.DogId,
    dogName:             r.DogName,
    breed:               r.breed,
    image_url:           r.image_url,
    firstName:           r.FirstName,
    lastName:            r.LastName,
    email:               r.UserEmail,
    phone:               r.phone,
    citizen_id:          r.citizen_id,
    address:             r.adopter_address || r.user_address || null,
    living_type:         r.living_type || null,
    adoption_reason:     r.adoption_reason || null,
    status:              (r.ReqStatus || '').toLowerCase(),
    verification_status: (r.verification_status || '').toLowerCase(),
    rejection_reason:    r.rejection_reason || null,
    created_at:          r.created_at,
  };
}

module.exports = router;
