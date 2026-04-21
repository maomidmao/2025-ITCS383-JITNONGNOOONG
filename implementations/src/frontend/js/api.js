const BASE = '';

async function request(method, path, body = null, isForm = false) {
  const opts = {
    method,
    credentials: 'include',
    headers: isForm ? {} : { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = isForm ? body : JSON.stringify(body);

  const res  = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

const api = {
  login:     (email, password)    => request('POST', '/api/auth/login',    { email, password }),
  register:  (payload)            => request('POST', '/api/auth/register', payload),
  logout:    ()                   => request('POST', '/api/auth/logout'),
  getMe:     ()                   => request('GET',  '/api/auth/me'),

  getDogs:      (params = {})     => request('GET',    '/api/dogs?' + new URLSearchParams(params)),
  searchDogs:   (params = {})     => request('GET',    '/api/dogs/search?' + new URLSearchParams(params)),
  getDog:       (id)              => request('GET',    `/api/dogs/${id}`),
  createDog:    (form)            => request('POST',   '/api/dogs',       form, true),
  updateDog:    (id, form)        => request('PUT',    `/api/dogs/${id}`, form, true),
  deleteDog:    (id)              => request('DELETE', `/api/dogs/${id}`),
  addTreatment: (id, body)        => request('POST',   `/api/dogs/${id}/treatments`, body),
  addTraining:  (id, body)        => request('POST',   `/api/dogs/${id}/trainings`,  body),

  getFavourites:   ()             => request('GET',    '/api/favourites'),
  addFavourite:    (dogId)        => request('POST',   `/api/favourites/${dogId}`),
  removeFavourite: (dogId)        => request('DELETE', `/api/favourites/${dogId}`),

  submitAdoption:  (body)         => request('POST', '/api/adoptions',     body),
  getAdoptions:    (params = {})  => request('GET',  '/api/adoptions?' + new URLSearchParams(params)),
  getMyAdoptions:  ()             => request('GET',  '/api/adoptions/my'),
  reviewAdoption:  (id, body)     => request('PUT',  `/api/adoptions/${id}/review`, body),

  getAppointments:    ()          => request('GET',  '/api/appointments'),
  createAppointment:  (body)      => request('POST', '/api/appointments',       body),
  updateAppointment:  (id, body)  => request('PUT',  `/api/appointments/${id}`, body),

  getCheckups:      ()            => request('GET',  '/api/checkups'),
  completeCheckup:  (id, form)    => request('PUT',  `/api/checkups/${id}`,        form, true),
  uploadCheckupImg: (id, form)    => request('POST', `/api/checkups/${id}/upload`, form, true),

  verifyCitizen:   (body)         => request('POST', '/api/verify/citizen',   body),
  verifyCriminal:  (body)         => request('POST', '/api/verify/criminal',  body),
  verifyBlacklist: (body)         => request('POST', '/api/verify/blacklist', body),
  verifyAll:       (body)         => request('POST', '/api/verify/all',       body),

  getSponsors:        ()          => request('GET',  '/api/sponsors'),
  getMySponsor:       ()          => request('GET',  '/api/sponsors/me'),
  saveSponsorProfile: (form)      => request('POST', '/api/sponsors/register', form, true),

  getReportSummary:     ()        => request('GET', '/api/reports/summary'),
  getPotentialAdopters: ()        => request('GET', '/api/reports/potential-adopters'),
  getAIReportSummary:   ()        => request('GET', '/api/reports/ai-summary'),
};

function showAlert(el, message, type = 'error') {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return;
  el.className = `alert alert--${type} show`;
  el.innerHTML = `<span class="alert__icon" aria-hidden="true">${
    type === 'success' ? '✓' : type === 'warning' ? '⚠' : 'ⓘ'
  }</span><span>${message}</span>`;
  if (type === 'success') setTimeout(() => { el.className = 'alert'; }, 5000);
}

function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.dataset.origText = btn.dataset.origText || btn.innerHTML;
  btn.innerHTML = loading
    ? '<span class="spinner" aria-hidden="true"></span> กรุณารอ...'
    : btn.dataset.origText;
}

const STATUS_LABELS = {
  available:    'ว่าง',
  pending:      'มีผู้สนใจ',
  adopted:      'รับเลี้ยงแล้ว',
  in_treatment: 'อยู่ระหว่างดูแล',
};
function statusLabel(s) { return STATUS_LABELS[s] || s; }

const ROLE_LABELS = {
  user: 'ผู้ใช้ทั่วไป',  USER: 'ผู้ใช้ทั่วไป',
  staff: 'เจ้าหน้าที่',  STAFF: 'เจ้าหน้าที่',
  admin: 'ผู้ดูแลระบบ',  ADMIN: 'ผู้ดูแลระบบ',
  sponsor: 'ผู้สนับสนุน', SPONSOR: 'ผู้สนับสนุน',
};
function roleLabel(r) { return ROLE_LABELS[r] || r; }

async function requireAuth(redirectTo) {
  try {
    const data = await api.getMe();
    if (!data.user) throw new Error('no session');
    return data.user;
  } catch {
    location.href = '/pages/login.html?next=' + encodeURIComponent(redirectTo || location.pathname);
  }
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function getUserRole(user) {
  return (user?.UserRole || user?.role || '').toUpperCase();
}

function getUserName(user) {
  return ((user?.first_name || user?.FirstName || '') + ' ' + (user?.last_name || user?.LastName || '')).trim();
}

function getDashboardLink(role) {
  const upper = (role || '').toUpperCase();
  if (upper === 'ADMIN') return '/pages/admin-dashboard.html';
  if (upper === 'STAFF') return '/pages/staff-dashboard/dogmanagement.html';
  if (upper === 'SPONSOR') return '/pages/sponsor-dashboard.html';
  return '/pages/user-dashboard/favourites.html';
}

async function logoutToHome() {
  await api.logout();
  location.href = '/';
}

function setActiveSidebarLink(activeLinkId) {
  const links = document.querySelectorAll('.sidebar__link[data-link-id]');
  links.forEach((link) => link.classList.toggle('active', link.dataset.linkId === activeLinkId));
}

function idRank(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : Number.MAX_SAFE_INTEGER;
}

function toggleOrder(order) {
  return order === 'asc' ? 'desc' : 'asc';
}

function setSortButtonLabel(buttonId, text = 'ล่าสุด ↑↓') {
  const btn = document.getElementById(buttonId);
  if (btn) btn.textContent = text;
}
