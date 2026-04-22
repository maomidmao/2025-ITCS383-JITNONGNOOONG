    const DEMO = [
      { id:1, name:'มะลิ',  breed:'Thai Ridgeback', age:3, gender:'female', status:'available' },
      { id:2, name:'เพชร',  breed:'Thai Bangkaew',  age:2, gender:'male',   status:'available' },
      { id:3, name:'ดาว',   breed:'Mixed Breed',    age:5, gender:'female', status:'available' },
      { id:4, name:'สิงห์', breed:'Thai Aspin',     age:1, gender:'male',   status:'available' },
    ];

    async function initNav() {
      try {
        const { user } = await api.getMe();
        if (!user) return;
        const role = getUserRole(user);
        const name = getUserName(user);
        const dashLink = getDashboardLink(role);
        document.getElementById('navUser').innerHTML = `
          <span class="nav__user-badge">${roleLabel(role)}</span>
          <span class="text-small text-muted">${name}</span>
          <a href="${dashLink}" class="btn btn--outline btn--sm">แดชบอร์ด</a>
          <button onclick="doLogout()" class="btn btn--ghost btn--sm">ออกจากระบบ</button>`;
        if (typeof initNotificationBell === 'function') setTimeout(initNotificationBell, 100);
      } catch {}
    }

    async function doLogout() { await api.logout(); location.reload(); }

    async function loadDogs() {
      const g = document.getElementById('dogsGrid');
      try {
        const d = await api.getDogs({ limit: 6 });
        render(g, d.dogs);
      } catch {
        render(g, DEMO);
      }
    }

    function render(c, dogs) {
      if (!dogs || !dogs.length) {
        c.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">🐾</div><p>ไม่พบสุนัขในขณะนี้</p></div>';
        return;
      }
      c.innerHTML = dogs.map(d => {
        const imgHtml = d.image_url
          ? `<img src="${d.image_url}" alt="${d.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='🐕'">`
          : '🐕';
        return `<article class="card dog-card">
          <div class="dog-card__img" aria-label="รูปของ ${d.name}">${imgHtml}</div>
          <div class="dog-card__body">
            <span class="badge badge--${d.status}">${statusLabel(d.status)}</span>
            <h3 class="dog-card__name mt-4">${d.name}</h3>
            <p class="dog-card__meta">${d.breed||'ไม่ทราบ'} · ${d.age!=null?d.age+' ปี':'—'} · ${d.gender==='female'?'เมีย':'ผู้'}</p>
          </div>
          <div class="dog-card__footer">
            <a href="/pages/dogs.html" class="btn btn--primary btn--sm" style="flex:1">ดูรายละเอียด</a>
          </div>
        </article>`;
      }).join('');
    }

    async function loadSponsors() {
      try {
        const d = await api.getSponsors();
        const l = document.getElementById('sponsorLogos');
        if (d.sponsors && d.sponsors.length) {
          const latest = d.sponsors.find(s => !!s.banner_url);
          if (latest) {
            const name = ((latest.first_name || latest.FirstName || '') + ' ' + (latest.last_name || latest.LastName || '')).trim() || 'ผู้สนับสนุน';
            l.innerHTML = `<a class="sponsor-billboard" href="/pages/sponsor-dashboard.html" aria-label="${name}">
              <div class="sponsor-billboard__frame">
                <img src="${latest.banner_url}" alt="${name}" onerror="this.closest('.sponsor-billboard').outerHTML='<div class=&quot;sponsor-empty&quot;>ยังไม่มีแบนเนอร์ผู้สนับสนุน</div>'">
              </div>
            </a>`;
          } else {
            l.innerHTML = '<div class="sponsor-empty">ยังไม่มีแบนเนอร์ผู้สนับสนุน</div>';
          }
        } else {
          l.innerHTML = '<div class="sponsor-empty">ยังไม่มีแบนเนอร์ผู้สนับสนุน</div>';
        }
      } catch {
        document.getElementById('sponsorLogos').innerHTML = '<div class="sponsor-empty">ยังไม่มีแบนเนอร์ผู้สนับสนุน</div>';
      }
    }

    initNav();
    loadDogs();
    loadSponsors();
