async function loadCheckups() {
  const container = document.getElementById('chkList');
  try {
    const { checkups } = await api.getCheckups();
    if (!checkups.length) {
      container.innerHTML = '<div class="empty-state"><p class="text-muted">ยังไม่มีการอนุมัติที่ต้องติดตาม</p></div>';
      return;
    }

    container.innerHTML = checkups.map((adoption) => {
      const name = `${adoption.first_name || ''} ${adoption.last_name || ''}`.trim();
      const staffFollowups = adoption.staff_followups || adoption.followups || [];
      const userUploads = adoption.user_uploads || [];
      const followupRows = staffFollowups.length
        ? staffFollowups.map((f) => `
            <tr style="background:var(--color-gray-50)">
              <td class="text-small" colspan="2" style="padding-left:2rem">📷 เดือนที่ ${f.month} — ${fmtDate(f.date)}</td>
              <td class="text-small" colspan="3">${f.note}</td>
              <td>${f.photo_url ? `<a href="${f.photo_url}" target="_blank" class="btn btn--ghost btn--sm">ดูรูป</a>` : '—'}</td>
            </tr>`).join('')
        : `<tr style="background:var(--color-gray-50)"><td colspan="6" class="text-small text-muted" style="padding-left:2rem">ยังไม่มีบันทึกติดตาม</td></tr>`;

      const uploadRows = userUploads.length
        ? userUploads.map((u) => `
            <tr>
              <td class="text-small">📤 เดือนที่ ${u.month || '-'} — ${fmtDate(u.date)}</td>
              <td class="text-small">${u.note || 'ผู้รับเลี้ยงส่งรูปติดตาม'}</td>
              <td style="text-align:right">${u.photo_url ? `<a href="${u.photo_url}" target="_blank" class="btn btn--ghost btn--sm">ดูรูป</a>` : '—'}</td>
            </tr>`).join('')
        : '<tr><td colspan="3" class="text-small text-muted">ยังไม่มีข้อมูลจากผู้รับเลี้ยง</td></tr>';

      return `
        <div class="table-wrapper" style="margin-bottom:var(--space-6)">
          <table class="table">
            <thead>
              <tr>
                <th colspan="6" style="background:var(--color-primary-50)">
                  <strong>${adoption.dog_name || '—'}</strong>
                  <span class="text-small text-muted" style="margin-left:var(--space-4)">ผู้รับเลี้ยง: ${name} | โทร: ${adoption.phone_num || '—'}</span>
                  <button class="btn btn--primary btn--sm" style="float:right" onclick="openChk(${adoption.adoption_id})">+ บันทึกเดือนใหม่</button>
                </th>
              </tr>
              <tr><th>เดือนที่</th><th>วันที่ตรวจ</th><th colspan="3">บันทึก</th><th>รูปภาพ</th></tr>
            </thead>
            <tbody>${followupRows}</tbody>
          </table>
          <div style="padding:var(--space-4) var(--space-5); border-top:1px dashed var(--color-gray-300); background:#fff">
            <div class="text-small" style="font-weight:700; margin-bottom:var(--space-2)">ข้อมูลที่ผู้รับเลี้ยงส่งมา (สำหรับพิจารณาก่อนบันทึก)</div>
            <table class="table"><thead><tr><th>วันที่/เดือนที่ส่ง</th><th>ข้อความจากผู้รับเลี้ยง</th><th style="text-align:right">รูปภาพ</th></tr></thead><tbody>${uploadRows}</tbody></table>
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    console.error('loadCheckups:', err);
    container.innerHTML = '<div class="empty-state"><p class="text-muted">โหลดไม่ได้</p></div>';
  }
}

function openChk(adoptionId) {
  document.getElementById('chkAdoptionId').value = adoptionId;
  document.getElementById('chkAlert').className = 'alert';
  document.getElementById('chkForm').reset();
  document.getElementById('chkDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('chkModal').classList.add('open');
}
function closeChk() { document.getElementById('chkModal').classList.remove('open'); }

document.getElementById('chkForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('chkSaveBtn');
  const fm = new FormData();
  fm.append('followupMonth', document.getElementById('chkMonth').value);
  fm.append('check_date', document.getElementById('chkDate').value);
  fm.append('note', document.getElementById('chkNote').value);
  const photo = document.getElementById('chkPhoto').files[0];
  if (photo) fm.append('photo', photo);

  setLoading(btn, true);
  try {
    await api.completeCheckup(document.getElementById('chkAdoptionId').value, fm);
    showAlert('gAlert', 'บันทึกการติดตามสำเร็จ', 'success');
    closeChk();
    await loadCheckups();
  } catch (err) {
    showAlert('chkAlert', err.message || 'เกิดข้อผิดพลาด', 'error');
  } finally {
    setLoading(btn, false);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeChk();
});

initStaffShell('/pages/staff-dashboard/checkups.html', 'checkups').then(() => {
  loadCheckups();
});
