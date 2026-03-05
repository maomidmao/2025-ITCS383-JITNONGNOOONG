function getPickupBadge(a) {
  const isCompleted = a.status === 'completed';
  const isScheduled = a.status === 'scheduled';
  const isStaffConfirmed = !!a.staffConfirmed;
  const hasDate = a.deliveryDate && !isNaN(new Date(a.deliveryDate));
  if (isCompleted) return { label: 'จัดส่งแล้ว', type: 'available' };
  if (isScheduled && hasDate) {
    return { label: isStaffConfirmed ? 'ยืนยันวันนัดรับ' : 'รอยืนยันวันนัด', type: isStaffConfirmed ? 'pending' : 'in_treatment' };
  }
  return { label: 'รอกำหนดวัน', type: 'in_treatment' };
}

function getPickupAction(a) {
  const isCompleted = a.status === 'completed';
  const isScheduled = a.status === 'scheduled';
  const isStaffConfirmed = !!a.staffConfirmed;
  const needsDate = !isCompleted && (!a.id || !a.deliveryDate);
  const hasDate = a.deliveryDate && !isNaN(new Date(a.deliveryDate));
  if (isCompleted) {
    return '<span class="badge badge--available">✅ รับสุนัขแล้ว</span>';
  } else if (!needsDate && hasDate) {
    return `<div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap"><span class="text-small text-muted">${isStaffConfirmed ? 'ยืนยันวันนัดรับแล้ว' : 'วันที่ที่เลือก'}: <strong>${fmtDate(a.deliveryDate)}</strong></span>${isStaffConfirmed ? '' : `<button class="btn btn--ghost btn--sm" onclick="openPickupEdit(${a.id || 0}, ${a.adoptionId}, '${a.deliveryDate}')">✏️ เปลี่ยนวัน</button>`}</div>`;
  } else {
    return `<button class="btn btn--primary btn--sm" onclick="openPickupModal(${a.id || 0}, ${a.adoptionId}, '${a.dogName}')">📅 เลือกวันรับน้อง</button>`;
  }
}

async function loadPickup() {
  const container = document.getElementById('pickupList');
  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> กำลังโหลด...</div>';
  try {
    const { appointments } = await api.getAppointments();
    if (!appointments || !appointments.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📅</div><p>ยังไม่มีคำขอที่พร้อมนัดรับ</p><p class="text-small text-muted">คำขอต้องได้รับการอนุมัติก่อนจึงจะเลือกวันได้</p></div>';
      return;
    }
    container.innerHTML = appointments.map((a) => {
      const badge = getPickupBadge(a);
      const actionHtml = getPickupAction(a);
      return `<div class="card" style="margin-bottom:var(--space-4)"><div class="card__body" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-4)"><div><p style="font-weight:600;margin-bottom:var(--space-1)">🐕 ${a.dogName || '—'}</p><span class="badge badge--${badge.type}">${badge.label}</span></div><div>${actionHtml}</div></div></div>`;
    }).join('');
  } catch (err) {
    console.error('loadPickup:', err);
    container.innerHTML = '<div class="empty-state"><p>ไม่สามารถโหลดข้อมูลได้</p></div>';
  }
}

function openPickupModal(deliveryId, adoptionId, dogName) {
  document.getElementById('pickupDeliveryId').value = deliveryId;
  document.getElementById('pickupAdoptionId').value = adoptionId;
  document.getElementById('pickupDogName').textContent = dogName;
  document.getElementById('pickupAlert').className = 'alert';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('pickupDate').min = today;
  document.getElementById('pickupDate').value = '';
  document.getElementById('pickupModal').classList.add('open');
}

function openPickupEdit(deliveryId, adoptionId, currentDate) {
  document.getElementById('pickupDeliveryId').value = deliveryId;
  document.getElementById('pickupAdoptionId').value = adoptionId;
  document.getElementById('pickupDogName').textContent = 'เปลี่ยนวันนัดรับ';
  document.getElementById('pickupAlert').className = 'alert';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('pickupDate').min = today;
  document.getElementById('pickupDate').value = currentDate ? currentDate.split('T')[0] : '';
  document.getElementById('pickupModal').classList.add('open');
}
function closePickupModal() { document.getElementById('pickupModal').classList.remove('open'); }

document.getElementById('pickupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('pickupBtn');
  const adoptionId = document.getElementById('pickupAdoptionId').value;
  const date = document.getElementById('pickupDate').value;
  if (!date) { showAlert('pickupAlert', 'กรุณาเลือกวัน', 'warning'); return; }
  setLoading(btn, true);
  try {
    await api.createAppointment({ adoptionId, deliveryDate: date });
    showAlert('pickupAlert', 'บันทึกวันนัดรับสำเร็จ!', 'success');
    setTimeout(() => { closePickupModal(); loadPickup(); }, 1200);
  } catch (err) {
    showAlert('pickupAlert', err.message || 'เกิดข้อผิดพลาด', 'error');
  } finally {
    setLoading(btn, false);
  }
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePickupModal(); });

initUserShell('/pages/user-dashboard/pickup.html', 'pickup').then(() => loadPickup());
