let currentUser = null;

async function loadFavourites() {
  const grid = document.getElementById('favGrid');
  try {
    const { favourites } = await api.getFavourites();
    if (!favourites || !favourites.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">❤️</div><p>ยังไม่มีรายการโปรด</p><a href="/pages/dogs.html" class="btn btn--primary btn--sm mt-4">ดูสุนัขทั้งหมด</a></div>`;
      return;
    }
    grid.innerHTML = favourites.map((d) => `
      <article class="card dog-card">
        <div class="dog-card__img">${d.image_url ? `<img src="${d.image_url}" alt="${d.name}" onerror="this.parentElement.innerHTML='🐕'">` : '🐕'}</div>
        <div class="dog-card__body"><span class="badge badge--${d.status}">${statusLabel(d.status)}</span><h3 class="dog-card__name mt-4">${d.name}</h3><p class="dog-card__meta">${d.breed || 'ไม่ทราบ'}${d.age != null ? ' · ' + d.age + ' ปี' : ''}</p></div>
        <div class="dog-card__footer">
          ${['available', 'pending'].includes(d.status) ? `<button class="btn btn--primary btn--sm" onclick="openAdopt(${d.id},'${(d.name || '').replace(/'/g, '&apos;')}')">ขอรับเลี้ยง</button>` : `<span class="text-muted text-small">ไม่ว่าง</span>`}
          <button class="btn btn--ghost btn--sm" onclick="removeFav(${d.id})">ลบ</button>
        </div>
      </article>`).join('');
  } catch {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>ไม่สามารถโหลดข้อมูลได้</p></div>';
  }
}

async function removeFav(dogId) {
  try { await api.removeFavourite(dogId); await loadFavourites(); }
  catch (e) { showAlert('favAlert', e.message, 'error'); }
}

function openAdopt(dogId, dogName) {
  document.getElementById('adoptForm').reset();
  document.getElementById('adoptDogId').value = dogId;
  document.getElementById('adoptDogName').textContent = dogName;
  document.getElementById('adoptAlert').className = 'alert';
  document.getElementById('adoptName').value = (currentUser.first_name || currentUser.FirstName || '') + ' ' + (currentUser.last_name || currentUser.LastName || '');
  document.getElementById('adoptEmail').value = currentUser.email || currentUser.UserEmail || '';
  syncAdoptSubmitState();
  document.getElementById('adoptModal').classList.add('open');
}
function closeAdopt() { document.getElementById('adoptModal').classList.remove('open'); }

function isAdoptFormValid() {
  const name = document.getElementById('adoptName').value.trim();
  const phone = document.getElementById('adoptPhone').value.trim();
  const email = document.getElementById('adoptEmail').value.trim();
  const address = document.getElementById('adoptAddress').value.trim();
  const livingType = document.getElementById('adoptLiving').value;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return !!(name && phone && emailOk && address && livingType);
}
function syncAdoptSubmitState() {
  const btn = document.getElementById('adoptBtn');
  if (btn) btn.disabled = !isAdoptFormValid();
}

['adoptName', 'adoptPhone', 'adoptEmail', 'adoptAddress'].forEach((id) => {
  document.getElementById(id).addEventListener('input', syncAdoptSubmitState);
});
document.getElementById('adoptLiving').addEventListener('change', syncAdoptSubmitState);

document.getElementById('adoptForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('adoptBtn');
  if (!isAdoptFormValid()) {
    showAlert('adoptAlert', 'กรุณากรอกข้อมูลที่มี * ให้ครบถ้วนก่อนยืนยัน', 'warning');
    syncAdoptSubmitState();
    return;
  }
  const dogId = document.getElementById('adoptDogId').value;
  const address = document.getElementById('adoptAddress').value.trim();
  const livingType = document.getElementById('adoptLiving').value;
  const message = document.getElementById('adoptMsg').value.trim();
  setLoading(btn, true);
  try {
    await api.submitAdoption({ dogId, address, livingType, message });
    showAlert('adoptAlert', 'ยื่นคำขอสำเร็จ! เจ้าหน้าที่จะติดต่อกลับโดยเร็ว', 'success');
    setTimeout(() => { closeAdopt(); loadFavourites(); }, 1200);
  } catch (err) {
    showAlert('adoptAlert', err.message || 'เกิดข้อผิดพลาด', 'error');
  } finally {
    setLoading(btn, false);
  }
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAdopt(); });

initUserShell('/pages/user-dashboard/favourites.html', 'fav').then((user) => {
  currentUser = user;
  loadFavourites();
  syncAdoptSubmitState();
});
