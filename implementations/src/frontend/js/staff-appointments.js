const sortState = { appointments: 'asc' };

function updateSortButtonText() {
  setSortButtonLabel('apptSortBtn');
}

function toggleSort() {
  sortState.appointments = toggleOrder(sortState.appointments);
  updateSortButtonText();
  loadAppointments();
}

async function loadAppointments() {
  const tb = document.getElementById('apptTbody');
  try {
    const { appointments } = await api.getAppointments();
    const sorted = (appointments || []).slice().sort((a, b) => {
      const diff = idRank(a.id) - idRank(b.id);
      return sortState.appointments === 'asc' ? diff : -diff;
    });
    if (!sorted.length) {
      tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">ยังไม่มีนัดหมาย</td></tr>';
      return;
    }

    tb.innerHTML = sorted.map((a) => {
      const name = `${a.firstName || ''} ${a.lastName || ''}`.trim();
      const isCompleted = a.status === 'completed';
      const hasDate = !!a.deliveryDate;
      const isConfirmed = !!a.staffConfirmed;
      const badge = isCompleted ? 'available' : (isConfirmed ? 'pending' : 'in_treatment');
      const label = isCompleted ? 'เสร็จสิ้น' : (isConfirmed ? 'ยืนยันวันนัดแล้ว' : 'รอยืนยันวันนัด');
      const hasDeliveryRow = !!a.id;
      let action = '—';
      if (!isCompleted && hasDeliveryRow && hasDate && !isConfirmed) {
        action = `<button class="btn btn--outline btn--sm" onclick="confirmApptDate(${a.id})">✓ ยืนยันวันนัด</button>`;
      } else if (!isCompleted && hasDeliveryRow && hasDate && isConfirmed) {
        action = `<button class="btn btn--ghost btn--sm" onclick="markApptDone(${a.id})">✓ เสร็จสิ้น</button>`;
      } else if (!hasDate) {
        action = '<span class="text-small text-muted">รอผู้รับเลี้ยงเลือกวันนัด</span>';
      }
      return `<tr>
        <td class="text-small text-muted">${a.id ? '#' + a.id : '—'}</td>
        <td><strong>${a.dogName || '—'}</strong></td>
        <td>${name || '—'}<br><span class="text-small text-muted">${a.email || ''}</span></td>
        <td>${a.phone || '—'}</td>
        <td class="text-small">${fmtDate(a.deliveryDate)}</td>
        <td><span class="badge badge--${badge}">${label}</span></td>
        <td>${action}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    console.error('loadAppointments:', err);
    tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">โหลดไม่ได้</td></tr>';
  }
}

async function confirmApptDate(id) {
  if (!confirm('ยืนยันวันนัดรับที่ผู้ใช้เลือกแล้ว?')) return;
  try {
    await api.updateAppointment(id, { action: 'CONFIRM_DATE' });
    showAlert('gAlert', 'ยืนยันวันนัดรับสำเร็จ', 'success');
    await loadAppointments();
  } catch (err) {
    showAlert('gAlert', err.message || 'เกิดข้อผิดพลาด', 'error');
  }
}

async function markApptDone(id) {
  if (!confirm('ยืนยันว่าผู้รับเลี้ยงรับสุนัขแล้ว?')) return;
  try {
    await api.updateAppointment(id, { status: 'COMPLETED' });
    showAlert('gAlert', 'อัปเดตสถานะนัดหมายสำเร็จ', 'success');
    await loadAppointments();
  } catch (err) {
    showAlert('gAlert', err.message || 'เกิดข้อผิดพลาด', 'error');
  }
}

initStaffShell('/pages/staff-dashboard/appointments.html', 'appointments').then(() => {
  updateSortButtonText();
  loadAppointments();
});
