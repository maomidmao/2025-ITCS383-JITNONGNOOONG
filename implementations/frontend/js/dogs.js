let allDogs=[], currentUser=null, favourites=new Set(), debounceTimer=null;

async function init(){
  try{ const d=await api.getMe(); currentUser=d.user; }catch{}
  if(currentUser){
    const role = getUserRole(currentUser);
    const dashLink = getDashboardLink(role);
    const firstName = currentUser.first_name || currentUser.FirstName || '';
    document.getElementById('navUser').innerHTML=
      `<span class="text-small text-muted">${firstName}</span>
       <a href="${dashLink}" class="btn btn--outline btn--sm">แดชบอร์ด</a>`;
    try{ const f=await api.getFavourites(); favourites=new Set((f.favourites||[]).map(d=>d.id)); }catch{}
  }
  await loadDogs();
}

async function loadDogs(){
  try{ const d=await api.getDogs({limit:50}); allDogs=d.dogs||[]; filterDogs(); }
  catch(e){ console.error(e); allDogs=[]; filterDogs(); }
}

function debouncedFilter(){ clearTimeout(debounceTimer); debounceTimer=setTimeout(filterDogs,300); }

function filterDogs(){
  const s=document.getElementById('searchInput').value.toLowerCase();
  const st=document.getElementById('filterStatus').value;
  const g=document.getElementById('filterGender').value;
  const f=allDogs.filter(d=>
    (!s||d.name.toLowerCase().includes(s)||(d.breed||'').toLowerCase().includes(s))&&
    (!st||d.status===st)&&
    (!g||d.gender===g)
  );
  renderDogs(f);
  document.getElementById('resultCount').textContent=`พบ ${f.length} ตัว`;
}

function renderDogs(dogs){
  const gr=document.getElementById('dogsGrid');
  if(!dogs.length){
    gr.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">🔍</div><p>ไม่พบสุนัขที่ค้นหา</p></div>';
    return;
  }
  gr.innerHTML=dogs.map(d=>{
    const isFav=favourites.has(d.id);
    const favBtn=currentUser
      ? `<button class="btn btn--ghost btn--sm" id="fav-${d.id}" onclick="toggleFav(${d.id},this)" title="${isFav?'นำออกจากรายการโปรด':'เพิ่มในรายการโปรด'}" style="font-size:1.2rem;padding:2px 6px;line-height:1">${isFav?'❤️':'🤍'}</button>`
      : '';
    const imgHtml=d.image_url ? `<img src="${d.image_url}" alt="${d.name}" onerror="this.parentElement.innerHTML='🐕'">` : '🐕';
    return `<article class="card dog-card" id="dog-${d.id}">
      <div class="dog-card__img" aria-label="รูปของ ${d.name}">${imgHtml}</div>
      <div class="dog-card__body">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2)">
          <span class="badge badge--${d.status}">${statusLabel(d.status)}</span>
          ${favBtn}
        </div>
        <h2 class="dog-card__name">${d.name}</h2>
        <p class="dog-card__meta">${d.breed||'ไม่ทราบ'}${d.age!=null?' · '+d.age+' ปี':''} · ${d.gender==='female'?'เมีย ♀':'ผู้ ♂'}</p>
      </div>
      <div class="dog-card__footer">
        <button class="btn btn--outline btn--sm" onclick="openDetail(${d.id})">รายละเอียด</button>
        ${['available','pending'].includes(d.status)
          ? `<button class="btn btn--primary btn--sm" onclick="openAdopt(${d.id},'${d.name.replace(/'/g,"&apos;")}')">ขอรับเลี้ยง</button>`
          : `<span class="text-muted text-small">ไม่ว่าง</span>`}
      </div>
    </article>`;
  }).join('');
}

async function toggleFav(dogId, btn){
  if(!currentUser){ location.href='/pages/login.html?next='+encodeURIComponent(location.pathname); return; }
  const isFav=favourites.has(dogId);
  try{
    if(isFav){ await api.removeFavourite(dogId); favourites.delete(dogId); btn.innerHTML='🤍'; btn.title='เพิ่มในรายการโปรด'; }
    else{ await api.addFavourite(dogId); favourites.add(dogId); btn.innerHTML='❤️'; btn.title='นำออกจากรายการโปรด'; }
  }catch(err){ alert(err.message||'เกิดข้อผิดพลาด'); }
}

async function openDetail(id){
  const p=document.getElementById('detailPanel'), o=document.getElementById('panelOverlay');
  document.getElementById('detailName').textContent='กำลังโหลด...';
  document.getElementById('detailImg').innerHTML='<span>🐕</span>';
  document.getElementById('detailBody').innerHTML='<div class="loading-overlay"><span class="spinner"></span></div>';
  document.getElementById('detailFooter').innerHTML='';
  p.classList.add('open'); o.classList.add('open'); p.setAttribute('aria-hidden','false');
  try{ const {dog}=await api.getDog(id); renderDetail(dog); }
  catch{ renderDetail(allDogs.find(d=>d.id===id)||{}); }
}

function renderDetail(d){
  if(!d||!d.id) return;
  document.getElementById('detailName').textContent=d.name;
  document.getElementById('detailImg').innerHTML=d.image_url
    ? `<img src="${d.image_url}" alt="${d.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='🐕'">`
    : '🐕';
  const isFav=favourites.has(d.id);
  const favSection=currentUser
    ? `<div class="detail-action"><button class="btn btn--outline btn--sm" onclick="toggleFav(${d.id},this)">
         ${isFav?'❤️ นำออกจากรายการโปรด':'🤍 เพิ่มในรายการโปรด'}
       </button></div>`
    : '';
  document.getElementById('detailBody').innerHTML=`
    ${favSection}
    <div class="detail-section">
      <p class="detail-section__title">ข้อมูลทั่วไป</p>
      <div class="detail-kv">
        <div class="detail-item"><span class="detail-item__label">สถานะ</span><span class="detail-item__val"><span class="badge badge--${d.status}">${statusLabel(d.status)}</span></span></div>
        <div class="detail-item"><span class="detail-item__label">สายพันธุ์</span><span class="detail-item__val">${d.breed||'—'}</span></div>
        ${d.age!=null?`<div class="detail-item"><span class="detail-item__label">อายุ</span><span class="detail-item__val">${d.age} ปี</span></div>`:''}
        <div class="detail-item"><span class="detail-item__label">สี</span><span class="detail-item__val">${d.color||'—'}</span></div>
        <div class="detail-item"><span class="detail-item__label">เพศ</span><span class="detail-item__val">${d.gender==='female'?'เมีย ♀':'ผู้ ♂'}</span></div>
      </div>
    </div>
    ${d.medical_profile?`<div class="detail-section"><p class="detail-section__title">ประวัติสุขภาพ</p><p class="detail-text">${d.medical_profile}</p></div>`:''}
    ${d.treatment_process?`<div class="detail-section"><p class="detail-section__title">การรักษา</p><p class="detail-text">${d.treatment_process}</p></div>`:''}
    ${d.training_status?`<div class="detail-section"><p class="detail-section__title">การฝึก</p><p class="detail-text">${d.training_status}</p></div>`:''}
  `;
  document.getElementById('detailFooter').innerHTML=['available','pending'].includes(d.status)
    ? `<button class="btn btn--primary" onclick="openAdopt(${d.id},'${d.name.replace(/'/g,"&apos;")}') " style="width:100%">ขอรับเลี้ยง</button>`
    : '<span class="text-muted text-small">สุนัขตัวนี้ไม่ว่างในขณะนี้</span>';
}

function closeDetail(){
  document.getElementById('detailPanel').classList.remove('open');
  document.getElementById('panelOverlay').classList.remove('open');
  document.getElementById('detailPanel').setAttribute('aria-hidden','true');
}

function openAdopt(id,name){
  if(!currentUser){ location.href='/pages/login.html?next='+encodeURIComponent(location.pathname); return; }
  document.getElementById('adoptForm').reset();
  document.getElementById('adoptAlert').className='alert';
  document.getElementById('adoptDogId').value=id;
  document.getElementById('adoptDogName').textContent=name;
  document.getElementById('adoptName').value=(currentUser.first_name||'')+' '+(currentUser.last_name||'');
  document.getElementById('adoptEmail').value=currentUser.email||'';
  syncAdoptSubmitState();
  document.getElementById('adoptModal').classList.add('open');
}
function closeAdopt(){ document.getElementById('adoptModal').classList.remove('open'); }

function isAdoptFormValid(){
  const name = document.getElementById('adoptName').value.trim();
  const phone = document.getElementById('adoptPhone').value.trim();
  const email = document.getElementById('adoptEmail').value.trim();
  const address = document.getElementById('adoptAddress').value.trim();
  const livingType = document.getElementById('adoptLiving').value;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return !!(name && phone && emailOk && address && livingType);
}

function syncAdoptSubmitState(){
  const btn=document.getElementById('adoptBtn');
  if(!btn) return;
  btn.disabled = !isAdoptFormValid();
}

['adoptName','adoptPhone','adoptEmail','adoptAddress'].forEach(id=>{
  document.getElementById(id).addEventListener('input', syncAdoptSubmitState);
});
document.getElementById('adoptLiving').addEventListener('change', syncAdoptSubmitState);
syncAdoptSubmitState();

document.getElementById('adoptForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const btn=document.getElementById('adoptBtn');
  if(!isAdoptFormValid()){
    showAlert('adoptAlert','กรุณากรอกข้อมูลที่มี * ให้ครบถ้วนก่อนยืนยัน','warning');
    syncAdoptSubmitState();
    return;
  }
  const payload={
    dogId: document.getElementById('adoptDogId').value,
    address: document.getElementById('adoptAddress').value.trim(),
    livingType: document.getElementById('adoptLiving').value,
    message: document.getElementById('adoptMsg').value.trim(),
  };
  if(!payload.address || !payload.livingType){
    showAlert('adoptAlert','กรุณากรอกที่อยู่และประเภทที่พักให้ครบถ้วน','warning');
    return;
  }
  setLoading(btn,true);
  try{
    await api.submitAdoption(payload);
    showAlert('adoptAlert','ยื่นคำขอสำเร็จ! เจ้าหน้าที่จะติดต่อกลับโดยเร็ว','success');
    setTimeout(closeAdopt,2500); await loadDogs();
  }catch(err){ showAlert('adoptAlert',err.message||'เกิดข้อผิดพลาด','error'); }
  finally{ setLoading(btn,false); }
});

document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeDetail(); closeAdopt(); } });
init();
