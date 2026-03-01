const router = require('express').Router();
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');

async function getSummaryData() {
  const [[dogStats]] = await db.execute(
    `SELECT
       COUNT(*) AS total,
       SUM(DogStatus = 'AVAILABLE') AS available,
       SUM(DogStatus = 'PENDING')   AS pending,
       SUM(DogStatus = 'ADOPTED')   AS adopted
     FROM dogs`
  );
  const [[adoptStats]] = await db.execute(
    `SELECT
       COUNT(*) AS total,
       SUM(ReqStatus = 'PENDING')  AS pending,
       SUM(ReqStatus = 'APPROVED') AS approved,
       SUM(ReqStatus = 'REJECTED') AS rejected
     FROM adoption_requests`
  );
  const [[userCount]] = await db.execute('SELECT COUNT(*) AS total FROM users WHERE UserRole = "USER"');
  const [[sponsorAgg]] = await db.execute(
    `SELECT
       COUNT(DISTINCT UserId) AS donor_count,
       COALESCE(SUM(donation_amount),0) AS total
     FROM sponsors`
  );

  return {
    dogs: dogStats,
    adoptions: adoptStats,
    users: { total: userCount.total },
    sponsors: {
      donorCount: sponsorAgg.donor_count,
      totalAmount: sponsorAgg.total,
    },
  };
}

function buildAiSummary(report) {
  const dogs = report.dogs || {};
  const adoptions = report.adoptions || {};
  const users = report.users || {};
  const sponsors = report.sponsors || {};
  const lines = [];

  lines.push('สรุปรายงานอัตโนมัติ (AI)');
  lines.push(`- Dog available: ${Number(dogs.available || 0)} ตัว`);
  lines.push(`- Dog ready: ${Number(dogs.adopted || 0)} ตัว`);
  lines.push(`- มีผู้สนใจ: ${Number(dogs.pending || 0)} ตัว`);
  lines.push(`- คำขอรอพิจารณา: ${Number(adoptions.pending || 0)} คำขอ`);
  lines.push(`- คำขออนุมัติแล้ว: ${Number(adoptions.approved || 0)} คำขอ`);
  lines.push(`- คำขอปฏิเสธ: ${Number(adoptions.rejected || 0)} คำขอ`);
  lines.push(`- ผู้ใช้ทั้งหมด: ${Number(users.total || 0)} คน`);
  lines.push(`- ยอดสนับสนุนรวม: ${Number(sponsors.totalAmount || 0).toLocaleString('th-TH')} บาท`);
  lines.push('');
  lines.push('ข้อเสนอแนะ');

  if (Number(adoptions.pending || 0) >= 5) {
    lines.push('- คำขอรอพิจารณาค่อนข้างมาก ควรจัดรอบตรวจสอบผู้รับเลี้ยงเพิ่ม');
  } else {
    lines.push('- จำนวนคำขอรอพิจารณาอยู่ในระดับจัดการได้');
  }

  if (Number(dogs.available || 0) > Number(dogs.adopted || 0)) {
    lines.push('- ควรเพิ่มการประชาสัมพันธ์สุนัขที่ยังว่างเพื่อเร่งการรับเลี้ยง');
  } else {
    lines.push('- อัตราการรับเลี้ยงอยู่ในเกณฑ์ดี ควรรักษากระบวนการเดิมไว้');
  }

  return lines.join('\n');
}

/* GET /api/reports/summary */
router.get('/summary', requireRole('ADMIN'), async (req, res) => {
  try {
    const summary = await getSummaryData();
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* GET /api/reports/ai-summary */
router.get('/ai-summary', requireRole('ADMIN'), async (req, res) => {
  try {
    const summary = await getSummaryData();
    const text = buildAiSummary(summary);
    res.json({
      generatedAt: new Date().toISOString(),
      text,
      metrics: summary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

/* GET /api/reports/potential-adopters */
router.get('/potential-adopters', requireRole('ADMIN'), async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.UserId, u.FirstName, u.LastName, u.UserEmail, u.phone, u.address, MAX(ard.living_type) AS living_type,
              COUNT(DISTINCT f.DogId) AS favourite_count,
              COALESCE(SUM(ar.ReqStatus = 'APPROVED'), 0) AS approved_adoptions,
              COALESCE(SUM(ar.ReqStatus = 'PENDING'), 0)  AS pending_adoptions,
              COUNT(DISTINCT ar.AdoptionReqNo) AS total_requests
       FROM users u
       LEFT JOIN favorites f ON u.UserId = f.UserId
       LEFT JOIN adoption_requests ar ON u.UserId = ar.UserId
       LEFT JOIN adoption_request_details ard ON ard.AdoptionReqNo = ar.AdoptionReqNo
       LEFT JOIN citizen_records crs ON crs.citizen_id = u.citizen_id
       LEFT JOIN criminal_records crr ON crr.citizen_id = u.citizen_id
       LEFT JOIN blacklist_records blr ON blr.citizen_id = u.citizen_id
       WHERE u.UserRole = 'USER'
         AND crs.citizen_id IS NOT NULL
         AND COALESCE(crr.has_criminal_record, 0) = 0
         AND blr.citizen_id IS NULL
         AND (
           u.is_verified = TRUE
           OR EXISTS (
             SELECT 1
             FROM adoption_requests ar_verify
             WHERE ar_verify.UserId = u.UserId
               AND ar_verify.verification_status = 'PASSED'
           )
         )
       GROUP BY u.UserId
       HAVING favourite_count > 0 OR total_requests > 0
       ORDER BY total_requests DESC, approved_adoptions DESC, pending_adoptions DESC, favourite_count DESC`
    );
    res.json({ adopters: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
