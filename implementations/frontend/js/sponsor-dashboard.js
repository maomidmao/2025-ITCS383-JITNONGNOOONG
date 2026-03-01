async function init() {
  const u = await requireAuth('/pages/sponsor-dashboard.html');
  const role = getUserRole(u);
  if (role !== 'SPONSOR' && role !== 'ADMIN') {
    location.href = '/'; return;
  }
  document.getElementById('spName').textContent = getUserName(u);
  document.getElementById('spDashBtn').setAttribute('href', getDashboardLink(role));
  await loadCurrentProfile();
}

async function loadCurrentProfile() {
  try {
    const { sponsor: sp } = await api.getMySponsor();
    if (sp) {
      document.getElementById('donationAmount').value = sp.donation_amount || '';
      const card = document.getElementById('currentSponsorCard');
      card.style.display = '';
      document.getElementById('currentSponsorBody').innerHTML = `
        <div style="display:flex;gap:var(--space-6);align-items:flex-start;flex-wrap:wrap">
          <div>
            <p><strong>${((sp.first_name || '') + ' ' + (sp.last_name || '')).trim() || 'ผู้สนับสนุน'}</strong></p>
            <p class="text-small text-muted">ยอดบริจาครวม: <strong>${(sp.total_donated || 0).toLocaleString('th')} บาท</strong></p>
          </div>
          ${sp.banner_url ? `<div style="width:100%"><p class="text-small text-muted mb-4">แบนเนอร์ปัจจุบัน:</p><img src="${sp.banner_url}" alt="Banner" style="max-width:970px;width:100%;border-radius:var(--radius-sm)"></div>` : ''}
        </div>`;
    }
  } catch {}
}

function previewImage(input, previewId) {
  const preview = document.getElementById(previewId);
  const file = input.files[0];
  if (!file) { preview.style.display = 'none'; return; }
  const reader = new FileReader();
  reader.onload = e => {
    preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width:100%;max-width:970px;aspect-ratio:970 / 250;object-fit:cover">`;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

document.getElementById('spForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('spBtn');
  const donationRaw = document.getElementById('donationAmount').value;
  const donationAmount = Number(donationRaw);

  if (!Number.isFinite(donationAmount) || donationAmount <= 0) {
    showAlert('spAlert', 'กรุณาระบุจำนวนเงินบริจาคให้ถูกต้อง', 'error');
    return;
  }

  const form = new FormData();
  form.append('donation_amount', String(donationAmount));
  const banner = document.getElementById('bannerFile').files[0];
  if (banner) form.append('banner', banner);

  setLoading(btn, true);
  try {
    await api.saveSponsorProfile(form);
    showAlert('spAlert', 'บันทึกโปรไฟล์สำเร็จ! ขอบคุณสำหรับการสนับสนุน', 'success');
    await loadCurrentProfile();
  } catch(err) {
    showAlert('spAlert', err.message || 'เกิดข้อผิดพลาด', 'error');
  } finally { setLoading(btn, false); }
});

async function doLogout() { await logoutToHome(); }
init();
