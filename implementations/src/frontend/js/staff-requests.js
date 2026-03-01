const sortState = { requests: 'asc' };

function updateSortButtonText() {
  setSortButtonLabel('reqSortBtn');
}

function toggleSort() {
  sortState.requests = toggleOrder(sortState.requests);
  updateSortButtonText();
  loadRequests();
}

const STATUS_MAP_REQ = {
  pending: 'รอ',
  approved: 'อนุมัติ',
  rejected: 'ปฏิเสธ',
  cancelled: 'ยกเลิก',
};

const BADGE_MAP_REQ = {
  approved: 'available',
  rejected: 'pending',
  pending: 'in_treatment',
};

const LIVING_TYPE_LABELS = {
  house: 'บ้านเดี่ยว',
  condo: 'คอนโด',
  apartment: 'อพาร์ตเมนต์',
  townhouse: 'ทาวน์เฮาส์',
};

function livingTypeLabel(v) {
  const key = (v || '').toLowerCase();
  return LIVING_TYPE_LABELS[key] || (v || 'ไม่ระบุ');
}

async function loadRequests() {
  const tb = document.getElementById('reqTbody');
  const status = document.getElementById('reqFilter').value;
  try {
    const data = await api.getAdoptions(status ? { status } : {});
    const list = (data.adoptions || data.forms || []).slice().sort((a, b) => {
      const diff = idRank(a.id || a.request_id) - idRank(b.id || b.request_id);
      return sortState.requests === 'asc' ? diff : -diff;
    });
    if (!list.length) {
      tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">ไม่มีคำขอ</td></tr>';
      return;
    }

    tb.innerHTML = list.map((f) => {
      const name = `${f.firstName || f.first_name || ''} ${f.lastName || f.last_name || ''}`.trim();
      const dogName = f.dogName || f.dog_name || '—';
      const date = fmtDate(f.created_at || f.request_date);
      const reqId = f.id || f.request_id;
      const badge = BADGE_MAP_REQ[f.status] || 'in_treatment';
      const verificationStatus = (f.verification_status || 'pending').toLowerCase();
      const isPassed = verificationStatus === 'passed';
      const isFailed = verificationStatus === 'failed';
      const citizenId = encodeURIComponent((f.citizen_id || '').trim());
      const livingType = livingTypeLabel(f.living_type || f.livingType);
      const address = f.address || f.user_address || 'ไม่ระบุ';

      const verifBadge = isPassed
        ? '<span style="color:var(--color-success)">✔ ผ่าน</span>'
        : isFailed
          ? '<span style="color:var(--color-danger)">✖ ไม่ผ่าน</span>'
          : `<a style="color:var(--color-warning)" href="/pages/staff-dashboard/verify.html?reqId=${reqId}&citizenId=${citizenId}">🔍 รอตรวจ</a>`;

      let actions = '—';
      if (f.status === 'pending') {
        const approveBtn = isPassed
          ? `<button class="btn btn--primary btn--sm" onclick="openApprove(${reqId})">อนุมัติ</button>`
          : `<a class="btn btn--outline btn--sm" href="/pages/staff-dashboard/verify.html?reqId=${reqId}&citizenId=${citizenId}" style="color:var(--color-warning);border-color:var(--color-warning)"> ตรวจสอบ</a>`;
        actions = `${approveBtn}<button class="btn btn--danger btn--sm" onclick="openReject(${reqId})">ปฏิเสธ</button>`;
      }

      return `<tr>
        <td class="text-small text-muted">#${reqId}</td>
        <td><strong>${name}</strong><br><span class="text-small text-muted">${f.email || ''}</span><br><span class="text-small text-muted">ที่พัก: ${livingType}</span><br><span class="text-small text-muted">ที่อยู่: ${address}</span></td>
        <td>${dogName}</td>
        <td class="text-small">${date}</td>
        <td><span class="badge badge--${badge}">${STATUS_MAP_REQ[f.status] || f.status}</span></td>
        <td class="text-small">${verifBadge}</td>
        <td><div style="display:flex;gap:6px;align-items:center;min-height:42px">${actions}</div></td>
      </tr>`;
    }).join('');
  } catch (err) {
    console.error('loadRequests:', err);
    tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">โหลดไม่ได้</td></tr>';
  }
}

function openApprove(id) {
  document.getElementById('apReqId').value = id;
  document.getElementById('apAlert').className = 'alert';
  document.getElementById('approveModal').classList.add('open');
}
function closeApprove() { document.getElementById('approveModal').classList.remove('open'); }

function openReject(id) {
  document.getElementById('rjReqId').value = id;
  document.getElementById('rjAlert').className = 'alert';
  document.getElementById('rejectModal').classList.add('open');
}
function closeReject() { document.getElementById('rejectModal').classList.remove('open'); }

document.getElementById('approveForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('apBtn');
  setLoading(btn, true);
  try {
    await api.reviewAdoption(document.getElementById('apReqId').value, { action: 'approve' });
    showAlert('gAlert', 'อนุมัติคำขอสำเร็จ — รอผู้รับเลี้ยงเลือกวันรับสุนัข', 'success');
    closeApprove();
    await loadRequests();
  } catch (err) {
    showAlert('apAlert', err.message || 'เกิดข้อผิดพลาด', 'error');
  } finally {
    setLoading(btn, false);
  }
});

document.getElementById('rejectForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('rjBtn');
  setLoading(btn, true);
  try {
    await api.reviewAdoption(document.getElementById('rjReqId').value, {
      action: 'reject',
      rejection_reason: document.getElementById('rjReason').value,
    });
    showAlert('gAlert', 'ปฏิเสธคำขอสำเร็จ', 'success');
    closeReject();
    await loadRequests();
  } catch (err) {
    showAlert('rjAlert', err.message || 'เกิดข้อผิดพลาด', 'error');
  } finally {
    setLoading(btn, false);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeApprove(); closeReject(); }
});

initStaffShell('/pages/staff-dashboard/adoption-req.html', 'requests').then(() => {
  updateSortButtonText();
  loadRequests();
});
