function getQueryParam(name) {
  return new URLSearchParams(location.search).get(name) || '';
}

async function runVerifyAll() {
  const citizenId = document.getElementById('vCitizenId').value.trim();
  const adoptionId = document.getElementById('vAdoptionId').value.trim() || null;

  if (!citizenId || citizenId.length !== 13 || !/^\d+$/.test(citizenId)) {
    showAlert('vAlert', 'กรุณากรอกเลขบัตรประชาชน 13 หลัก', 'warning');
    return;
  }

  const btn = document.getElementById('vBtn');
  setLoading(btn, true);
  document.getElementById('vResults').style.display = 'none';

  try {
    const result = await api.verifyAll({ citizen_id: citizenId, adoption_id: adoptionId });
    renderVerifyResults(result);
    showAlert('vAlert', 'ตรวจสอบเสร็จสิ้น', result.passed ? 'success' : 'error');
  } catch (err) {
    showAlert('vAlert', err.message || 'ตรวจสอบไม่สำเร็จ', 'error');
  } finally {
    setLoading(btn, false);
  }
}

function renderVerifyResults(result) {
  const checks = result.checks || {};
  function renderCard(elId, check) {
    const el = document.getElementById(elId);
    const passed = check.passed;
    el.className = `verify-card ${passed ? 'verify-card--pass' : 'verify-card--fail'}`;
    el.innerHTML = `<span class="verify-card__icon">${passed ? '✅' : '⚠️'}</span><span>${check.message}</span>`;
  }

  renderCard('vCard-citizen', checks.citizen || { passed: false, message: 'ไม่มีข้อมูล' });
  renderCard('vCard-criminal', checks.criminal || { passed: false, message: 'ไม่มีข้อมูล' });
  renderCard('vCard-blacklist', checks.blacklist || { passed: false, message: 'ไม่มีข้อมูล' });

  const summary = document.getElementById('vCard-summary');
  summary.className = `verify-card verify-card--summary ${result.passed ? 'verify-card--pass' : 'verify-card--fail'}`;
  summary.innerHTML = result.passed
    ? '<strong>✅ ผ่านการตรวจสอบทั้งหมด — อนุมัติได้</strong>'
    : '<strong>❌ ไม่ผ่านการตรวจสอบ — ไม่แนะนำให้อนุมัติ</strong>';

  document.getElementById('vResults').style.display = 'block';
}

initStaffShell('/pages/staff-dashboard/verify.html', 'verify').then(() => {
  const reqId = getQueryParam('reqId');
  const citizenId = getQueryParam('citizenId');
  if (reqId) document.getElementById('vAdoptionId').value = reqId;
  if (citizenId) {
    document.getElementById('vCitizenId').value = citizenId;
    // showAlert('vAlert', `เติมเลขบัตรอัตโนมัติสำหรับคำขอ #${reqId || '-'}`, 'success');
  }
});
