// ── AUTH DATA ────────────────────────────────────────────────
// ── DEMO PERSISTENCE (localStorage) ──────────────────────────
const DEMO_KEY = 'rcc_aps_demo_v1';
function loadDemo() {
  try { const raw = localStorage.getItem(DEMO_KEY); return raw ? JSON.parse(raw) : null; } catch(e){ return null; }
}
const _savedDemo = loadDemo();
// ── PER-USER PROFILE STORAGE ─────────────────────────────────
// Profiles are keyed by the logged-in user's id so each account keeps its
// own phone/address instead of one global blob shared by everyone.
const PROFILES = Object.assign(
  {},
  (_savedDemo && _savedDemo.profiles) || {},
  // Legacy migration: very old saves stored a single global `profile` blob.
  // Attribute it to the demo employee account so it is not lost.
  (_savedDemo && _savedDemo.profile) ? { 3: _savedDemo.profile } : {}
);
function currentUid() {
  return (typeof loggedInUser !== 'undefined' && loggedInUser && loggedInUser.id) || 0;
}
function saveDemo() {
  return new Promise((resolve) => {
    try {
      const uid = currentUid();
      if (uid) {
        const pp = document.getElementById('empPhone');
        const pa = document.getElementById('empAddr');
        if (pp && pa && (pp.value.trim() || pa.value.trim())) {
          PROFILES[uid] = { ...(PROFILES[uid] || {}), empPhone: pp.value, empAddr: pa.value };
        }
      }
      const state = {
        users, nextUserId, cashAdvances, bonusTypes, nextBonusId, auth: USERS_AUTH,
        deductionCategories, nextDedCatId, payrollRecords, bonusPayouts,
        sssTable, philData, pagData, birData, dedMeta, bonusExemptionLimit: BONUS_EXEMPTION_LIMIT,
        workDays: WORK_DAYS,
        leaveTypes: (typeof LEAVE_TYPES !== 'undefined') ? LEAVE_TYPES : [],
        nextLeaveTypeId: (typeof NEXT_LEAVE_TYPE_ID !== 'undefined') ? NEXT_LEAVE_TYPE_ID : 1,
        leaveRecords: (typeof LEAVE_RECORDS !== 'undefined') ? LEAVE_RECORDS : [],
        nextLeaveRecordId: (typeof nextLeaveRecordId !== 'undefined') ? nextLeaveRecordId : 1,
        attendance: (typeof ATTENDANCE !== 'undefined') ? ATTENDANCE : [],
        teacherRanks: (typeof teacherRanks !== 'undefined') ? teacherRanks : [],
        nextRankId: (typeof nextRankId !== 'undefined') ? nextRankId : 1,
        teachingLoadRecords: (typeof teachingLoadRecords !== 'undefined') ? teachingLoadRecords : [],
        teachingLoadClasses: (typeof teachingLoadClasses !== 'undefined') ? teachingLoadClasses : [],
        nextTeachingLoadId: (typeof nextTeachingLoadId !== 'undefined') ? nextTeachingLoadId : 1,
        nextTeachingLoadClassId: (typeof nextTeachingLoadClassId !== 'undefined') ? nextTeachingLoadClassId : 1,
        hoursPerWorkload: (typeof HOURS_PER_WORKLOAD !== 'undefined') ? HOURS_PER_WORKLOAD : 3,
        profiles: PROFILES,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(DEMO_KEY, JSON.stringify(state));
      pushToServer(state).then(saved => {
        resolve(saved);
      });
    } catch(e){
      resolve(false);
    }
  });
}
function resetDemo() {
  localStorage.removeItem(DEMO_KEY);
  location.reload();
}

function pushToServer(state) {
  return new Promise((resolve) => {
    const token = (typeof getAuthToken === 'function') ? getAuthToken() : null;
    if (!token) { resolve(false); return; }
    try {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(state)
      })
        .then(r => { if (r.status === 401) clearAuthToken(); resolve(r.ok); })
        .catch(() => { resolve(false); });
    } catch(e) { resolve(false); }
  });
}
function syncDemo() {
  return new Promise((resolve) => {
    try {
      const token = (typeof getAuthToken === 'function') ? getAuthToken() : null;
      const headers = {};
      if (token) headers['Authorization'] = 'Bearer ' + token;
      fetch('/api/data', { headers })
        .then(r => {
          if (r.status === 401) { clearAuthToken(); resolve(false); return null; }
          if (!r.ok) throw new Error('server offline');
          return r.json();
        })
        .then(d => {
          if (!d || !d.users || !d.users.length) { resolve(false); return; }
          const localRaw = localStorage.getItem(DEMO_KEY);
          let adopt = false;
          if (!localRaw) {
            adopt = true;
          } else {
            let local = null;
            try { local = JSON.parse(localRaw); } catch(e) {}
            const serverTime = Date.parse(d.savedAt) || 0;
            const localTime  = Date.parse(local && local.savedAt) || 0;
            if (serverTime >= localTime) adopt = true;
            else pushToServer(local);
          }
          if (adopt) {
            localStorage.setItem(DEMO_KEY, JSON.stringify(d));
            if (typeof applyServerData === 'function') applyServerData(d);
            refreshVisiblePage();
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(() => { resolve(false); });
    } catch(e) { resolve(false); }
  });
}
function refreshVisiblePage() {
  if (!(typeof loggedInUser !== 'undefined' && loggedInUser && loggedInUser.page)) return;
  if (typeof initPage !== 'function') return;
  const el = document.getElementById(loggedInUser.page);
  if (el && el.classList.contains('show')) initPage(loggedInUser.page);
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
// Restore the logged-in user's saved profile fields into the form.
// Called from initPage() after login (fields depend on the active account).
function restoreProfileFields() {
  const pp = document.getElementById('empPhone');
  const pa = document.getElementById('empAddr');
  if (!pp || !pa) return; 
  const p = PROFILES[currentUid()] || {};
  pp.value = p.empPhone || '';
  pa.value = p.empAddr || '';
}
const DEMOS = {
  employee:'Email: employee@rcc.edu.ph &nbsp;|&nbsp; Password: employee123',
  finance: 'Email: finance@rcc.edu.ph &nbsp;|&nbsp; Password: finance123',
  admin:   'Email: admin@rcc.edu.ph &nbsp;|&nbsp; Password: admin123',
};
let currentRole = 'employee';

// ── FORMAT ───────────────────────────────────────────────────
const fmt = n => '₱' + parseFloat(n).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});

// ── DEMO LABEL ───────────────────────────────────────────────
const DEMO_EMAILS = ['admin@rcc.edu.ph', 'finance@rcc.edu.ph', 'employee@rcc.edu.ph'];
function isDemoUser(u) { return !!u && DEMO_EMAILS.includes((u.email || '').toLowerCase()); }
function displayName(u) { return u ? `${u.first} ${u.last}` + (isDemoUser(u) ? ' (demo)' : '') : ''; }
