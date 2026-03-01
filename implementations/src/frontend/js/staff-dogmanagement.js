const dogSortState = { order: 'asc' };
function toggleDogSort() {
  dogSortState.order = toggleOrder(dogSortState.order);
  setSortButtonLabel('dogSortBtn');
  loadDogs();
}

async function loadDogs() {
  const tb = document.getElementById('dogsTbody');
  try {
    const data = await api.getDogs({ limit: 100 });
    const dogs = (data.dogs || []).slice().sort((a, b) => {
      const diff = idRank(a.id) - idRank(b.id);
      return dogSortState.order === 'asc' ? diff : -diff;
    });
    if (!dogs.length) {
      tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">ยังไม่มีสุนัขในระบบ</td></tr>';
      return;
    }
    tb.innerHTML = dogs.map(d => `
      <tr>
        <td class="text-small text-muted">#${d.id}</td>
        <td><strong>${d.name}</strong></td>
        <td>${d.breed || '—'}</td>
        <td>${d.age != null ? d.age + ' ปี' : '—'}</td>
        <td>${d.gender === 'female' ? 'เมีย ♀' : 'ผู้ ♂'}</td>
        <td><span class="badge badge--${d.status}">${statusLabel(d.status)}</span></td>
        <td style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn--ghost btn--sm" onclick="openDogModal(${d.id})">แก้ไข</button>
          <button class="btn btn--danger btn--sm" onclick="deleteDog(${d.id},'${(d.name||'').replace(/'/g,'&apos;')}')">ลบ</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('loadDogs:', err);
    tb.innerHTML = '<tr><td colspan="7" class="text-center text-muted">โหลดไม่ได้</td></tr>';
  }
}

function openDogModal(id) {
  document.getElementById('editDogId').value = id || '';
  document.getElementById('dogModalTitle').textContent = id ? 'แก้ไขสุนัข' : 'เพิ่มสุนัข';
  document.getElementById('dogForm').reset();
  document.getElementById('dogAlert').className = 'alert';
  document.getElementById('dogModal').classList.add('open');
  if (id) prefillDog(id);
}

async function prefillDog(id) {
  try {
    const { dog } = await api.getDog(id);
    document.getElementById('dName').value   = dog.name   || '';
    document.getElementById('dBreed').value  = dog.breed  || '';
    document.getElementById('dAge').value    = dog.age    != null ? dog.age : '';
    document.getElementById('dGender').value = dog.gender || 'male';
    document.getElementById('dColor').value  = dog.color  || '';
    document.getElementById('dMed').value    = dog.medical_profile || '';
    document.getElementById('dTreat').value  = dog.treatment_process || '';
    document.getElementById('dTrain').value  = dog.training_status || '';
  } catch (err) {
    console.error('prefillDog:', err);
  }
}

function closeDogModal() {
  document.getElementById('dogModal').classList.remove('open');
}

document.getElementById('dogForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('dogSaveBtn');
  const id  = document.getElementById('editDogId').value;

  const fm = new FormData();
  fm.append('dogName',         document.getElementById('dName').value);
  fm.append('breed',           document.getElementById('dBreed').value);
  fm.append('age',             document.getElementById('dAge').value);
  fm.append('gender',          document.getElementById('dGender').value);
  fm.append('color',           document.getElementById('dColor').value);
  fm.append('medical_profile', document.getElementById('dMed').value);
  fm.append('treatment_process', document.getElementById('dTreat').value);
  fm.append('training_status',   document.getElementById('dTrain').value);
  const imgFile = document.getElementById('dImg').files[0];
  if (imgFile) fm.append('image', imgFile);

  setLoading(btn, true);
  try {
    id ? await api.updateDog(id, fm) : await api.createDog(fm);
    showAlert('gAlert', id ? 'อัปเดตสุนัขสำเร็จ' : 'เพิ่มสุนัขสำเร็จ', 'success');
    closeDogModal();
    await loadDogs();
  } catch (err) {
    showAlert('dogAlert', err.message || 'เกิดข้อผิดพลาด', 'error');
  } finally {
    setLoading(btn, false);
  }
});

async function deleteDog(id, name) {
  if (!confirm(`ลบสุนัข "${name}" ออกจากระบบ?`)) return;
  try {
    await api.deleteDog(id);
    showAlert('gAlert', 'ลบสุนัขสำเร็จ', 'success');
    await loadDogs();
  } catch (err) {
    showAlert('gAlert', err.message || 'ลบไม่สำเร็จ', 'error');
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDogModal();
});

initStaffShell('/pages/staff-dashboard/dogmanagement.html', 'dogs').then(() => {
  setSortButtonLabel('dogSortBtn');
  loadDogs();
});
