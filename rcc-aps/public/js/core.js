// ── AUTH DATA ────────────────────────────────────────────────
// ── DEMO PERSISTENCE (localStorage) ──────────────────────────
const DEMO_KEY = 'rcc_aps_demo_v1';
function loadDemo() {
  try { const raw = localStorage.getItem(DEMO_KEY); return raw ? JSON.parse(raw) : null; } catch(e){ return null; }
}
function saveDemo() {
  try {
    const state = {
      users, nextUserId, cashAdvances, bonusTypes, nextBonusId, auth: USERS_AUTH,
      deductionCategories, nextDedCatId, payrollRecords, bonusPayouts,
      profile: { empPhone: document.getElementById('empPhone')?.value, empAddr: document.getElementById('empAddr')?.value }
    };
    localStorage.setItem(DEMO_KEY, JSON.stringify(state));
    pushToServer(state);
  } catch(e){}
}
function resetDemo() {
  localStorage.removeItem(DEMO_KEY);
  location.reload();
}
const _savedDemo = loadDemo();

function pushToServer(state) {
  try {
    fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) }).catch(() => {});
  } catch(e){}
}
function syncDemo() {
  try {
    fetch('/api/data')
      .then(r => { if (!r.ok) throw new Error('server offline'); return r.json(); })
      .then(d => {
        if (d && d.users && d.users.length) {
          if (!localStorage.getItem(DEMO_KEY)) {
            localStorage.setItem(DEMO_KEY, JSON.stringify(d));
            location.reload();
          } else {
            pushToServer(loadDemo());
          }
        }
      })
      .catch(() => {});
  } catch(e){}
}
document.addEventListener('DOMContentLoaded', syncDemo);

const ROLE_PAGE = {'System Admin':'adminPage','Finance Officer':'financePage','Employee':'empPage'};
const ROLE_ICON = {'System Admin':'🔧','Finance Officer':'💼','Employee':'👤'};
const ROLE_KEY  = {'System Admin':'admin','Finance Officer':'finance','Employee':'employee'};

const USERS_AUTH = {};
function rebuildAuthDefaults() {
  USERS_AUTH['1'] = {id:1, email:'admin@rcc.edu.ph',    pass:'admin123',    label:'System Admin',   icon:'🔧', page:'adminPage',    role:'admin',    status:'Active'};
  USERS_AUTH['2'] = {id:2, email:'finance@rcc.edu.ph',  pass:'finance123',  label:'Finance Officer',icon:'💼', page:'financePage', role:'finance',  status:'Active'};
  USERS_AUTH['3'] = {id:3, email:'employee@rcc.edu.ph', pass:'employee123', label:'Employee',      icon:'👤', page:'empPage',     role:'employee', status:'Active'};
}
rebuildAuthDefaults();
if (_savedDemo && _savedDemo.auth) {
  const byEmail = {};
  Object.values(USERS_AUTH).forEach(a => byEmail[a.email] = a);
  Object.keys(_savedDemo.auth).forEach(k => {
    const e = _savedDemo.auth[k];
    if (!e) return;
    if (e.id) { USERS_AUTH[k] = e; return; }                  // new id-keyed format: copy as-is
    const target = byEmail[(e.email || '').toLowerCase()];    // legacy role-keyed format: migrate password
    if (target) target.pass = e.pass;
  });
}

function ensureAuth(u, pass) {
  let entry = Object.values(USERS_AUTH).find(a => a.id === u.id);
  if (!entry) { entry = { id: u.id }; USERS_AUTH['u' + u.id] = entry; }
  entry.email  = u.email.toLowerCase();
  if (pass) entry.pass = pass;
  entry.label  = u.role;
  entry.icon   = ROLE_ICON[u.role] || '👤';
  entry.page   = ROLE_PAGE[u.role] || 'empPage';
  entry.role   = ROLE_KEY[u.role]  || 'employee';
  entry.status = u.status || 'Active';
  return entry;
}
function removeAuth(userId) {
  Object.keys(USERS_AUTH).forEach(k => { if (USERS_AUTH[k].id === userId) delete USERS_AUTH[k]; });
}
// Restore saved employee profile fields
if (_savedDemo && _savedDemo.profile) {
  const pp = document.getElementById('empPhone');
  const pa = document.getElementById('empAddr');
  if (pp && _savedDemo.profile.empPhone) pp.value = _savedDemo.profile.empPhone;
  if (pa && _savedDemo.profile.empAddr)  pa.value = _savedDemo.profile.empAddr;
}
const DEMOS = {
  employee:'Email: employee@rcc.edu.ph &nbsp;|&nbsp; Password: employee123',
  finance: 'Email: finance@rcc.edu.ph &nbsp;|&nbsp; Password: finance123',
  admin:   'Email: admin@rcc.edu.ph &nbsp;|&nbsp; Password: admin123',
};
let currentRole = 'employee';

// ── FORMAT ───────────────────────────────────────────────────
const fmt = n => '₱' + parseFloat(n).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
