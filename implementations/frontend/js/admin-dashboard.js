function buildBars(title, items) {
  const max = Math.max(1, ...items.map(i => Number(i.value || 0)));
  return `
    <div class="card" style="margin-top:var(--space-5);padding:var(--space-5)">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:var(--space-4)">${title}</h3>
      <div style="display:grid;gap:10px">
        ${items.map(i => {
          const value = Number(i.value || 0);
          const pct = Math.max(4, Math.round((value / max) * 100));
          const display = typeof i.display !== 'undefined' ? i.display : value;
          return `
            <div style="display:grid;grid-template-columns:140px 1fr 48px;gap:10px;align-items:center">
              <div class="text-small text-muted">${i.label}</div>
              <div style="background:var(--color-bg);height:16px;border-radius:999px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${i.color};border-radius:999px"></div>
              </div>
              <div style="text-align:right;font-weight:700">${display}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

async function init() {
  const u = await requireAuth('/pages/admin-dashboard.html');
  if (getUserRole(u) !== 'ADMIN') { location.href = '/'; return; }
  document.getElementById('adminName').textContent = getUserName(u);
  await loadSummary();
}

function showSection(name, link) {
  ['summary','adopters'].forEach(s => {
    document.getElementById('section-'+s).style.display = s === name ? '' : 'none';
    document.getElementById('link-'+s).classList.toggle('active', s === name);
  });
  if (name === 'adopters') loadAdopters();
}

async function loadSummary() {
  const el = document.getElementById('summaryContent');
  try {
    const report = await api.getReportSummary();
    const dogs = report.dogs || {};
    const adoptions = report.adoptions || {};
    const sponsors = report.sponsors || {};
    const donorCount = Number(sponsors.donorCount || 0);
    const totalAmount = Number(sponsors.totalAmount || 0);
    const dogBars = buildBars('กราฟแท่งสุนัข', [
      { label: 'Dog available', value: dogs.available, color: '#16a34a' },
      { label: 'Dog ready', value: dogs.adopted, color: '#2563eb' },
      { label: 'มีผู้สนใจ', value: dogs.pending, color: '#f59e0b' },
      { label: 'ทั้งหมด', value: dogs.total, color: '#6b7280' },
    ]);
    const adoptionBars = buildBars('กราฟแท่งคำขอรับเลี้ยง', [
      { label: 'รอพิจารณา', value: adoptions.pending, color: '#f59e0b' },
      { label: 'อนุมัติ', value: adoptions.approved, color: '#22c55e' },
      { label: 'ปฏิเสธ', value: adoptions.rejected, color: '#ef4444' },
      { label: 'ทั้งหมด', value: adoptions.total, color: '#6b7280' },
    ]);
    const sponsorBars = buildBars('กราฟแท่งผู้สนับสนุน', [
      { label: 'จำนวนผู้บริจาค', value: donorCount, color: '#2563eb' },
      { label: 'ยอดบริจาครวม', value: totalAmount, color: '#22c55e', display: totalAmount.toLocaleString('th-TH') },
    ]);

    el.innerHTML = `
      ${dogBars}
      ${adoptionBars}
      ${sponsorBars}
    `;
  } catch {
    el.innerHTML = `<div class="empty-state"><p>ไม่สามารถโหลดรายงานได้</p><p class="text-small text-muted">กรุณาตรวจสอบการเชื่อมต่อกับเซิร์ฟเวอร์</p></div>`;
  }
}

async function loadAdopters() {
  const tbody = document.getElementById('adoptersTbody');
  try {
    const { adopters } = await api.getPotentialAdopters();
    if (!adopters.length) { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">ไม่มีผู้ใช้</td></tr>'; return; }
    const livingMap = { house:'บ้านเดี่ยว', condo:'คอนโด', apartment:'อพาร์ตเมนต์', townhouse:'ทาวน์เฮาส์' };
    tbody.innerHTML = adopters.map(a => `
      <tr>
        <td><strong>${a.FirstName || ''} ${a.LastName || ''}</strong></td>
        <td class="text-small">${a.UserEmail || '—'}</td>
        <td class="text-small">${a.phone || '—'}</td>
        <td class="text-small">${livingMap[a.living_type] || a.address || '—'}</td>
        <td>
          <span style="color:var(--color-success)">ผ่านทั้งหมด</span>
        </td>
        <td class="text-center">${Number(a.total_requests || 0)}</td>
      </tr>`).join('');
  } catch { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">โหลดไม่ได้</td></tr>'; }
}

async function doLogout() { await logoutToHome(); }
init();
