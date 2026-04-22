let allDogs = [], currentUser = null, favourites = new Set(), debounceTimer = null;

async function init() {
  try { const d = await api.getMe(); currentUser = d.user; } catch { }
  if (currentUser) {
    const role = getUserRole(currentUser);
    const dashLink = getDashboardLink(role);
    const firstName = currentUser.first_name || currentUser.FirstName || '';
    document.getElementById('navUser').innerHTML =
      `<span class="text-small text-muted">${firstName}</span>
       <a href="${dashLink}" class="btn btn--outline btn--sm">แดชบอร์ด</a>`;
    try { const f = await api.getFavourites(); favourites = new Set((f.favourites || []).map(d => d.id)); } catch { }
  }

  // Load all dogs for filter options
  try {
    const d = await api.getDogs({ limit: 50 });
    allDogs = d.dogs || [];
  }
  catch (e) {
    console.error('Error loading dogs:', e);
    allDogs = [];
  }

  // Populate filter dropdowns
  populateFilterOptions();

  // Perform initial search
  performSearch();
}

/** Populate breed and color dropdowns from all dogs */
function populateFilterOptions() {
  const breeds = new Set();
  const colors = new Set();

  allDogs.forEach(dog => {
    if (dog.breed) breeds.add(dog.breed);
    if (dog.color) colors.add(dog.color);
  });

  const breedSelect = document.getElementById('filterBreed');
  const colorSelect = document.getElementById('filterColor');

  // Sort and populate breed dropdown
  Array.from(breeds).sort().forEach(breed => {
    const option = document.createElement('option');
    option.value = breed;
    option.textContent = breed;
    breedSelect.appendChild(option);
  });

  // Sort and populate color dropdown
  Array.from(colors).sort().forEach(color => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = color;
    colorSelect.appendChild(option);
  });
}

/** Toggle filter panel visibility */
function toggleFilterPanel() {
  const panel = document.getElementById('filterPanel');
  const toggle = document.getElementById('toggleFilters');
  const isOpen = panel.classList.contains('open');

  if (isOpen) {
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  } else {
    panel.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  }
}

/** Reset all filters to default */
function resetFilters() {
  document.getElementById('searchKeyword').value = '';
  document.getElementById('filterBreed').value = '';
  document.getElementById('filterColor').value = '';
  document.getElementById('filterTraining').value = '';
  document.getElementById('filterAvailability').checked = false;
  performSearch();
}

/** Debounced search on keyword input */
function debouncedSearch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(performSearch, 300);
}

/** Perform API search with current filters */
async function performSearch() {
  const gr = document.getElementById('dogsGrid');

  function normalizeText(text) {
    return (text || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^\u0E00-\u0E7Fa-z0-9]/g, '');
  }

  try {
    gr.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="loading-overlay"><span class="spinner"></span> กำลังค้นหา...</div>
    </div>`;

    const keyword = document.getElementById('searchKeyword').value.trim();
    const breed = document.getElementById('filterBreed').value.trim();
    const color = document.getElementById('filterColor').value.trim();
    const training_status = document.getElementById('filterTraining').value.trim();
    const onlyAvailable = document.getElementById('filterAvailability').checked;

    const params = {};
    if (keyword) params.keyword = keyword;
    if (breed) params.breed = breed;
    if (color) params.color = color;
    if (training_status) params.training_status = training_status;
    if (onlyAvailable) params.availability = 'Available';
    params.limit = 100;
    params.offset = 0;

    let result;

    try {
      result = await api.searchDogs(params);
    } catch (err) {
      console.warn("Search API failed, fallback to getDogs:", err);
      result = await api.getDogs({ limit: 100 });
    }

    if (!result || !result.dogs) {
      console.error('Invalid API response:', result);
      renderError('❌ ข้อมูลไม่ถูกต้อง');
      return;
    }

    let dogs = result.dogs || [];

    // 🔍 keyword search
    if (keyword) {
      const kw = normalizeText(keyword);

      dogs = dogs.filter(d => {
        const name = normalizeText(d.DogName || d.name);
        const breedText = normalizeText(d.breed);
        return name.includes(kw) || breedText.includes(kw);
      });
    }

    // 🎯 breed
    if (breed) {
      dogs = dogs.filter(d => d.breed === breed);
    }

    // 🎯 color
    if (color) {
      dogs = dogs.filter(d => d.color === color);
    }

    // 🔥 training mapping (ตามที่คุณกำหนด)
    if (training_status) {
      const trainingMap = {
        'ยังไม่ผ่านการฝึก': ['ยังไม่ผ่านการฝึก'],

        'ผ่านการฝึกขั้นต้น': [
          'ผ่านการฝึกขั้นต้น',
          'ขั้นต้น'
        ],

        'ผ่านการฝึกขั้นสูง': [
          'ผ่านการฝึกขั้นสูง',
          'ขั้นสูง'
        ],

        'ผ่านการฝึกพื้นฐาน': [
          'ผ่านการฝึกพื้นฐาน',
        ]
      };

      const targets = trainingMap[training_status] || [];

      dogs = dogs.filter(d => {
        const value = (d.training_status || '').toLowerCase();
        return targets.some(t => value.includes(t));
      });
    }

    // 🔥 availability
    if (onlyAvailable) {
      dogs = dogs.filter(d => {
        const status = (d.DogStatus || d.status || '')
          .toLowerCase()
          .trim();
        return status === 'available';
      });
    }

    const total = dogs.length;

    if (dogs.length === 0) {
      const hasFilters = keyword || breed || color || training_status || onlyAvailable;

      if (hasFilters) {
        const filterSummary = [
          keyword ? `"${keyword}"` : null,
          breed || null,
          color || null,
          training_status || null,
        ].filter(Boolean).join(' • ');

        renderEmpty(
          `🔍 ไม่พบสุนัขที่ตรงกับ<br/><strong>${filterSummary}</strong>`,
          `<button class="btn btn--outline btn--sm" onclick="resetFilters()" style="margin-top:var(--space-4)">
            🔄 ล้างตัวกรอง
          </button>`
        );
      } else {
        renderEmpty(
          `📚 ยังไม่มีสุนัขในระบบ<br/><span style="font-size:0.9rem">กรุณากลับมาตรวจสอบในภายหลัง</span>`
        );
      }

      document.getElementById('resultCount').textContent = '-';
    } else {
      renderDogs(dogs);

      document.getElementById('resultCount').textContent =
        total === 1 ? `พบ 1 ตัว` : `พบ ${total} ตัว`;
    }

  } catch (err) {
    console.error('Unexpected search error:', err);
    renderError('❌ เกิดข้อผิดพลาดที่ไม่คาดคิด<br/><span style="font-size:0.9rem">กรุณารีเฟรชหน้าและลองใหม่</span>');
    document.getElementById('resultCount').textContent = '';
  }
}

/** Render no results state with optional action button */
function renderEmpty(message, action = '') {
  const gr = document.getElementById('dogsGrid');
  gr.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
    <div class="empty-state__icon">🔍</div>
    <p style="margin-bottom:var(--space-3)">${message}</p>
    ${action}
  </div>`;
}

/** Render error state with retry option */
function renderError(message) {
  const gr = document.getElementById('dogsGrid');
  gr.innerHTML = `<div class="empty-state empty-state--error" style="grid-column:1/-1">
    <div class="empty-state__icon">⚠️</div>
    <p style="margin-bottom:var(--space-3)">${message}</p>
    <button class="btn btn--outline btn--sm" onclick="performSearch()">
      🔄 ลองใหม่
    </button>
  </div>`;
}



function renderDogs(dogs) {
  const gr = document.getElementById('dogsGrid');

  if (!dogs.length) {
    gr.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">🔍</div>
        <p>ไม่พบสุนัขที่ค้นหา</p>
      </div>`;
    return;
  }

  gr.innerHTML = dogs.map(d => {

    // 🔥 normalize data จาก backend
    const id = d.DogId || d.id;
    const name = d.DogName || d.name || 'ไม่ทราบชื่อ';
    const statusRaw = d.DogStatus || d.status || '';
    const status = statusRaw.toLowerCase();

    const age = d.Age ?? d.age;
    const breed = d.breed || 'ไม่ทราบ';
    const color = d.color || '';
    const genderRaw = (d.gender || '').toLowerCase();
    const gender = genderRaw === 'female' || genderRaw === 'female'
      ? 'เมีย ♀'
      : 'ผู้ ♂';

    const image = d.image_url || '';

    // 🔥 favourite
    const isFav = favourites.has(id);
    const favBtn = currentUser
      ? `<button class="btn btn--ghost btn--sm"
          id="fav-${id}"
          onclick="toggleFav(${id},this)"
          title="${isFav ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}"
          style="font-size:1.2rem;padding:2px 6px;line-height:1">
          ${isFav ? '❤️' : '🤍'}
        </button>`
      : '';

    // 🔥 image fallback
    const imgHtml = image
      ? `<img src="${image}" alt="${name}" onerror="this.parentElement.innerHTML='🐕'">`
      : '🐕';

    return `
      <article class="card dog-card" id="dog-${id}">
        <div class="dog-card__img" aria-label="รูปของ ${name}">
          ${imgHtml}
        </div>

        <div class="dog-card__body">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2)">
            <span class="badge badge--${status}">
              ${statusLabel(status)}
            </span>
            ${favBtn}
          </div>

          <h2 class="dog-card__name">${name}</h2>

          <p class="dog-card__meta">
            ${breed}
            ${age != null ? ' · ' + age + ' ปี' : ''}
            ${color ? ' · ' + color : ''}
            ${gender ? ' · ' + gender : ''}
          </p>
        </div>

        <div class="dog-card__footer">
          <button class="btn btn--outline btn--sm"
            onclick="openDetail(${id})">
            รายละเอียด
          </button>

          ${['available', 'pending'].includes(status)
        ? `<button class="btn btn--primary btn--sm"
                   onclick="openAdopt(${id},'${name.replace(/'/g, "&apos;")}')">
                   ขอรับเลี้ยง
                 </button>`
        : `<span class="text-muted text-small">ไม่ว่าง</span>`
      }
        </div>
      </article>
    `;
  }).join('');
}

async function toggleFav(dogId, btn) {
  if (!currentUser) { location.href = '/pages/login.html?next=' + encodeURIComponent(location.pathname); return; }
  const isFav = favourites.has(dogId);
  try {
    if (isFav) { await api.removeFavourite(dogId); favourites.delete(dogId); btn.innerHTML = '🤍'; btn.title = 'เพิ่มในรายการโปรด'; }
    else { await api.addFavourite(dogId); favourites.add(dogId); btn.innerHTML = '❤️'; btn.title = 'นำออกจากรายการโปรด'; }
  } catch (err) { alert(err.message || 'เกิดข้อผิดพลาด'); }
}

async function openDetail(id) {
  const p = document.getElementById('detailPanel'), o = document.getElementById('panelOverlay');
  document.getElementById('detailName').textContent = 'กำลังโหลด...';
  document.getElementById('detailImg').innerHTML = '<span>🐕</span>';
  document.getElementById('detailBody').innerHTML = '<div class="loading-overlay"><span class="spinner"></span></div>';
  document.getElementById('detailFooter').innerHTML = '';
  p.classList.add('open'); o.classList.add('open'); p.setAttribute('aria-hidden', 'false');
  try { const { dog } = await api.getDog(id); renderDetail(dog); }
  catch { renderDetail(allDogs.find(d => d.id === id) || {}); }
}

function renderDetail(d) {
  if (!d || !d.id) return;
  document.getElementById('detailName').textContent = d.name;
  document.getElementById('detailImg').innerHTML = d.image_url
    ? `<img src="${d.image_url}" alt="${d.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='🐕'">`
    : '🐕';
  const isFav = favourites.has(d.id);
  const favSection = currentUser
    ? `<div class="detail-action"><button class="btn btn--outline btn--sm" onclick="toggleFav(${d.id},this)">
         ${isFav ? '❤️ นำออกจากรายการโปรด' : '🤍 เพิ่มในรายการโปรด'}
       </button></div>`
    : '';
  document.getElementById('detailBody').innerHTML = `
    ${favSection}
    <div class="detail-section">
      <p class="detail-section__title">ข้อมูลทั่วไป</p>
      <div class="detail-kv">
        <div class="detail-item"><span class="detail-item__label">สถานะ</span><span class="detail-item__val"><span class="badge badge--${d.status}">${statusLabel(d.status)}</span></span></div>
        <div class="detail-item"><span class="detail-item__label">สายพันธุ์</span><span class="detail-item__val">${d.breed || '—'}</span></div>
        ${d.age != null ? `<div class="detail-item"><span class="detail-item__label">อายุ</span><span class="detail-item__val">${d.age} ปี</span></div>` : ''}
        <div class="detail-item"><span class="detail-item__label">สี</span><span class="detail-item__val">${d.color || '—'}</span></div>
        <div class="detail-item"><span class="detail-item__label">เพศ</span><span class="detail-item__val">${d.gender === 'female' ? 'เมีย ♀' : 'ผู้ ♂'}</span></div>
      </div>
    </div>
    ${d.medical_profile ? `<div class="detail-section"><p class="detail-section__title">ประวัติสุขภาพ</p><p class="detail-text">${d.medical_profile}</p></div>` : ''}
    ${d.treatment_process ? `<div class="detail-section"><p class="detail-section__title">การรักษา</p><p class="detail-text">${d.treatment_process}</p></div>` : ''}
    ${d.training_status ? `<div class="detail-section"><p class="detail-section__title">การฝึก</p><p class="detail-text">${d.training_status}</p></div>` : ''}
  `;
  document.getElementById('detailFooter').innerHTML = ['available', 'pending'].includes(d.status)
    ? `<button class="btn btn--primary" onclick="openAdopt(${d.id},'${d.name.replace(/'/g, "&apos;")}') " style="width:100%">ขอรับเลี้ยง</button>`
    : '<span class="text-muted text-small">สุนัขตัวนี้ไม่ว่างในขณะนี้</span>';
}

function closeDetail() {
  document.getElementById('detailPanel').classList.remove('open');
  document.getElementById('panelOverlay').classList.remove('open');
  document.getElementById('detailPanel').setAttribute('aria-hidden', 'true');
}

function openAdopt(id, name) {
  if (!currentUser) { location.href = '/pages/login.html?next=' + encodeURIComponent(location.pathname); return; }
  document.getElementById('adoptForm').reset();
  document.getElementById('adoptAlert').className = 'alert';
  document.getElementById('adoptDogId').value = id;
  document.getElementById('adoptDogName').textContent = name;
  document.getElementById('adoptName').value = (currentUser.first_name || '') + ' ' + (currentUser.last_name || '');
  document.getElementById('adoptEmail').value = currentUser.email || '';
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
  if (!btn) return;
  btn.disabled = !isAdoptFormValid();
}

['adoptName', 'adoptPhone', 'adoptEmail', 'adoptAddress'].forEach(id => {
  document.getElementById(id).addEventListener('input', syncAdoptSubmitState);
});
document.getElementById('adoptLiving').addEventListener('change', syncAdoptSubmitState);
syncAdoptSubmitState();

document.getElementById('adoptForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = document.getElementById('adoptBtn');
  if (!isAdoptFormValid()) {
    showAlert('adoptAlert', 'กรุณากรอกข้อมูลที่มี * ให้ครบถ้วนก่อนยืนยัน', 'warning');
    syncAdoptSubmitState();
    return;
  }
  const payload = {
    dogId: document.getElementById('adoptDogId').value,
    address: document.getElementById('adoptAddress').value.trim(),
    livingType: document.getElementById('adoptLiving').value,
    message: document.getElementById('adoptMsg').value.trim(),
  };
  if (!payload.address || !payload.livingType) {
    showAlert('adoptAlert', 'กรุณากรอกที่อยู่และประเภทที่พักให้ครบถ้วน', 'warning');
    return;
  }
  setLoading(btn, true);
  try {
    await api.submitAdoption(payload);
    showAlert('adoptAlert', 'ยื่นคำขอสำเร็จ! เจ้าหน้าที่จะติดต่อกลับโดยเร็ว', 'success');
    setTimeout(closeAdopt, 2500); await loadDogs();
  } catch (err) { showAlert('adoptAlert', err.message || 'เกิดข้อผิดพลาด', 'error'); }
  finally { setLoading(btn, false); }
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDetail(); closeAdopt(); } });
init();
