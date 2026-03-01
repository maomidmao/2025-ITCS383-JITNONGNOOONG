/**
 * routes/verify.js
 * Background checks against citizen, criminal, and blacklist records.
 * All endpoints restricted to STAFF and ADMIN roles.
 */
const router = require('express').Router();
const db     = require('../config/db');
const { requireRole } = require('../middleware/auth');

/* ── POST /api/verify/citizen — Check Thai citizen registry */
router.post('/citizen', requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { citizen_id } = req.body;
    if (!citizen_id) return res.status(400).json({ message: 'กรุณาระบุเลขบัตรประชาชน' });

    const [rows] = await db.execute(
      'SELECT * FROM citizen_records WHERE citizen_id = ?', [citizen_id]
    );
    res.json({ found: rows.length > 0, record: rows[0] || null });
  } catch (err) {
    console.error('POST /verify/citizen:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* ── POST /api/verify/criminal — Check criminal record */
router.post('/criminal', requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { citizen_id } = req.body;
    if (!citizen_id) return res.status(400).json({ message: 'กรุณาระบุเลขบัตรประชาชน' });

    const [rows] = await db.execute(
      'SELECT * FROM criminal_records WHERE citizen_id = ?', [citizen_id]
    );
    const hasCriminal = rows.length > 0 && !!rows[0].has_criminal_record;
    res.json({ found: rows.length > 0, has_criminal_record: hasCriminal });
  } catch (err) {
    console.error('POST /verify/criminal:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* ── POST /api/verify/blacklist — Check blacklist */
router.post('/blacklist', requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { citizen_id } = req.body;
    if (!citizen_id) return res.status(400).json({ message: 'กรุณาระบุเลขบัตรประชาชน' });

    const [rows] = await db.execute(
      'SELECT * FROM blacklist_records WHERE citizen_id = ?', [citizen_id]
    );
    res.json({ blacklisted: rows.length > 0, reason: rows[0]?.reason || null });
  } catch (err) {
    console.error('POST /verify/blacklist:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* ── POST /api/verify/all — Run all 3 checks and optionally persist result */
router.post('/all', requireRole('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { citizen_id, adoption_id } = req.body;
    if (!citizen_id) return res.status(400).json({ message: 'กรุณาระบุเลขบัตรประชาชน' });

    // Run all three checks in parallel for speed
    const [[citizenRows], [criminalRows], [blacklistRows]] = await Promise.all([
      db.execute('SELECT * FROM citizen_records   WHERE citizen_id = ?', [citizen_id]),
      db.execute('SELECT * FROM criminal_records  WHERE citizen_id = ?', [citizen_id]),
      db.execute('SELECT * FROM blacklist_records WHERE citizen_id = ?', [citizen_id]),
    ]);

    const isCitizen     = citizenRows.length > 0;
    const hasCriminal   = criminalRows.length > 0 && !!criminalRows[0].has_criminal_record;
    const isBlacklisted = blacklistRows.length > 0;

    // Pass only if: found in citizen registry AND no criminal record AND not blacklisted
    const passed = isCitizen && !hasCriminal && !isBlacklisted;

    // Persist verification result to user profile so admin reports can use it.
    if (passed) {
      await db.execute(
        'UPDATE users SET is_verified = TRUE WHERE citizen_id = ?',
        [citizen_id]
      );
    }

    // Persist verification result to adoption if adoption_id provided
    // Business rule: set FAILED only on explicit reject action, not here.
    if (adoption_id) {
      if (passed) {
        await db.execute(
          "UPDATE adoption_requests SET verification_status = 'PASSED' WHERE AdoptionReqNo = ?",
          [adoption_id]
        );
      }
    }

    res.json({
      passed,
      checks: {
        citizen: {
          passed:  isCitizen,
          message: isCitizen
            ? `พบข้อมูลในทะเบียนราษฎร์: ${citizenRows[0]?.full_name || citizenRows[0]?.citizen_id}`
            : 'ไม่พบข้อมูลในระบบทะเบียนราษฎร์',
        },
        criminal: {
          passed:  !hasCriminal,
          message: hasCriminal
            ? 'พบประวัติอาชญากรรม — ไม่ผ่านการตรวจสอบ'
            : 'ไม่มีประวัติอาชญากรรม',
        },
        blacklist: {
          passed:  !isBlacklisted,
          message: isBlacklisted
            ? `อยู่ในบัญชีดำ: ${blacklistRows[0]?.reason || 'ไม่ระบุเหตุผล'}`
            : 'ไม่อยู่ในบัญชีดำ',
        },
      },
    });
  } catch (err) {
    console.error('POST /verify/all:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
