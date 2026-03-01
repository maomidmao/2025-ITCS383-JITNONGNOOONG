async function loadCheckups() {
  const container = document.getElementById('chkList');
  try {
    const { checkups } = await api.getCheckups();
    if (!checkups || !checkups.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state__icon">🐾</div><p>ยังไม่มีรายการติดตาม</p><p class="text-small text-muted">รายการนี้จะปรากฏหลังจากคำขอรับเลี้ยงของคุณได้รับการอนุมัติ</p></div>';
      return;
    }

    container.innerHTML = checkups.map((adoption) => {
      const followups = adoption.user_uploads || adoption.followups || [];
      const dogName = adoption.dog_name || '—';
      const adoptionId = adoption.adoption_id;
      const isDelivered = adoption.delivery_status === 'completed';

      const historyRows = followups.length
        ? followups.map((f) => `<div class="chk-record"><div class="chk-record__meta"><span class="badge badge--available">เดือนที่ ${f.month}</span><span class="text-small text-muted">${fmtDate(f.date)}</span></div><p class="chk-record__note">${f.note || '—'}</p>${f.photo_url ? `<a href="${f.photo_url}" target="_blank" class="btn btn--ghost btn--sm">📷 ดูรูป</a>` : ''}</div>`).join('')
        : '<p class="text-muted text-small">คุณยังไม่ได้ส่งรูปและบันทึกการติดตาม</p>';

      return `<div class="card" style="margin-bottom:var(--space-6)"><div class="card__header"><div><h3 class="card__title">🐕 ${dogName}</h3><p class="text-small text-muted">คุณส่งข้อมูลแล้ว: ${followups.length} ครั้ง</p></div>${isDelivered ? `<button class="btn btn--primary btn--sm" onclick="openUpload(${adoptionId},'${dogName.replace(/'/g, '&apos;')}')">📷 ส่งรูปและบันทึก</button>` : `<span class="badge badge--in_treatment">รอรับสุนัข</span>`}</div><div class="card__body" style="padding-top:0">${historyRows}</div></div>`;
    }).join('');
  } catch (err) {
    console.error('loadCheckups:', err);
    container.innerHTML = '<div class="empty-state"><p>ไม่สามารถโหลดข้อมูลได้</p></div>';
  }
}

function openUpload(adoptionId, dogName) {
  document.getElementById('uploadAdoptionId').value = adoptionId;
  document.getElementById('uploadTitle').textContent = `ส่งรูปภาพและบันทึก — ${dogName || ''}`;
  document.getElementById('uploadAlert').className = 'alert';
  document.getElementById('uploadForm').reset();
  document.getElementById('uploadModal').classList.add('open');
}
function closeUpload() { document.getElementById('uploadModal').classList.remove('open'); }

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('uploadBtn');
  const adoptionId = document.getElementById('uploadAdoptionId').value;
  const file = document.getElementById('uploadImg').files[0];
  if (!file) { showAlert('uploadAlert', 'กรุณาเลือกรูปภาพ', 'error'); return; }

  const form = new FormData();
  form.append('adopter_image', file);
  form.append('note', document.getElementById('uploadNote').value);

  setLoading(btn, true);
  try {
    await api.uploadCheckupImg(adoptionId, form);
    showAlert('uploadAlert', 'ส่งรูปภาพและบันทึกสำเร็จ!', 'success');
    setTimeout(() => { closeUpload(); loadCheckups(); }, 1200);
  } catch (err) {
    showAlert('uploadAlert', err.message || 'เกิดข้อผิดพลาด', 'error');
  } finally {
    setLoading(btn, false);
  }
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeUpload(); });

initUserShell('/pages/user-dashboard/checkups.html', 'chk').then(() => loadCheckups());
