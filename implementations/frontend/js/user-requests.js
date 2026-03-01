const REQUEST_STATUS_LABELS = {
  pending: 'รอพิจารณา',
  reviewing: 'กำลังตรวจสอบ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
  cancelled: 'ยกเลิก',
};

async function loadMyRequests() {
  const tbody = document.getElementById('reqBody');
  try {
    const data = await api.getMyAdoptions();
    const forms = data.forms || data.adoptions || [];
    if (!forms.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">ยังไม่มีคำขอ</td></tr>';
      return;
    }
    tbody.innerHTML = forms.map((f) => `
      <tr>
        <td><strong>${f.dog_name || f.dogName || '—'}</strong><br><span class="text-small text-muted">${f.breed || ''}</span></td>
        <td>${fmtDate(f.request_date || f.created_at)}</td>
        <td><span class="badge badge--${f.status}">${REQUEST_STATUS_LABELS[f.status] || f.status}</span></td>
        <td class="text-small text-muted">${f.rejection_reason || '—'}</td>
      </tr>`).join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">ไม่สามารถโหลดข้อมูลได้</td></tr>';
  }
}

initUserShell('/pages/user-dashboard/requests.html', 'req').then(() => loadMyRequests());
