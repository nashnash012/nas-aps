// ── RCC INFORMATION SHEET MODULE ─────────────────────────────
// Full replica of the paper "Information Sheet" submitted every semester.
// Sections: header (semester/SY) · personal · educational attainment ·
// experience · status · schedule of classes · assignment · certification · approval.
// Used by: Employee (encode own) · Finance/Admin (view-edit).

let infoSheets = (_savedDemo && Array.isArray(_savedDemo.infoSheets)) ? _savedDemo.infoSheets : [];
let infoSheetEducation = (_savedDemo && Array.isArray(_savedDemo.infoSheetEducation)) ? _savedDemo.infoSheetEducation : [];
let teachingLoads = (_savedDemo && Array.isArray(_savedDemo.teachingLoads)) ? _savedDemo.teachingLoads : [];
let nextSheetId = (_savedDemo && _savedDemo.nextSheetId) || 1;
let nextEduId = (_savedDemo && _savedDemo.nextEduId) || 1;
let nextLoadId = (_savedDemo && _savedDemo.nextLoadId) || 1;

let curSheetEmpId = null;
let curSheetSemester = '1st';
let curSheetSchoolYear = '';
let curSheetEditable = false;

const SEMESTER_OPTIONS = ['1st', '2nd', 'Summer'];

// ── Helpers ──────────────────────────────────────────────────
function sheetById(id) { return infoSheets.find(s => s.id === id); }
function sheetsFor(empId) {
  return infoSheets.filter(s => s.empId === empId)
    .sort((a, b) => (a.schoolYear || '').localeCompare(b.schoolYear || '') || (a.semester || '').localeCompare(b.semester || ''));
}
function eduFor(sheetId) {
  return infoSheetEducation.filter(e => e.sheetId === sheetId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}
function loadsForSheet(sheetId) {
  return teachingLoads.filter(l => l.sheetId === sheetId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}
function loadHours(l) {
  return (parseFloat(l.hoursPerWeek) || 0).toFixed(1);
}
function totalHours(sheetId) {
  return loadsForSheet(sheetId).reduce((s, l) => s + (parseFloat(l.hoursPerWeek) || 0), 0);
}

// ── Time / day parsing ───────────────────────────────────────
function parseTimeRange(timeStr) {
  if (!timeStr) return null;
  const m = timeStr.trim().match(/^(\d{1,2}):?(\d{2})?\s*-\s*(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i);
  if (!m) return null;
  let sh = parseInt(m[1], 10);
  let sm = parseInt(m[2] || '0', 10);
  let eh = parseInt(m[3], 10);
  let em = parseInt(m[4] || '0', 10);
  const mer = (m[5] || '').toLowerCase();
  if (mer === 'pm' && sh < 12) sh += 12;
  if (mer === 'pm' && eh < 12) eh += 12;
  if (mer === 'am' && sh === 12) sh = 0;
  if (mer === 'am' && eh === 12) eh = 0;
  if (eh < sh) eh += 24;
  return { start: sh + sm / 60, end: eh + em / 60, hours: eh + em / 60 - (sh + sm / 60) };
}

function dayCount(daysStr) {
  if (!daysStr) return 0;
  return daysStr.split(',').map(d => d.trim()).filter(Boolean).length;
}

function deriveHoursPerWeek(timeStr, daysStr) {
  const tr = parseTimeRange(timeStr);
  const dc = dayCount(daysStr);
  if (!tr || !dc) return 0;
  return Math.round(tr.hours * dc * 10) / 10;
}

function deriveDaysCode(daysStr) {
  if (!daysStr) return '';
  const map = { mon: 'M', tue: 'T', wed: 'W', thu: 'Th', fri: 'F', sat: 'S', sun: 'Su' };
  return daysStr.split(',').map(d => {
    const k = d.trim().toLowerCase();
    return map[k] || d.trim().charAt(0).toUpperCase();
  }).join(',');
}

// ── Save / persist ───────────────────────────────────────────
function saveInfoSheet() {
  if (!curSheetEmpId) { showToast('⚠️', 'No employee selected.'); return; }
  const sem = document.getElementById('isSemester')?.value || curSheetSemester;
  const sy = document.getElementById('isSchoolYear')?.value.trim() || '';
  if (!sy) { showToast('⚠️', 'School Year is required.'); return; }
  const fullName = document.getElementById('isFullName')?.value.trim() || '';
  const existing = infoSheets.find(s => s.empId === curSheetEmpId && s.semester === sem && s.schoolYear === sy);

  const sheet = {
    id: existing ? existing.id : nextSheetId++,
    empId: curSheetEmpId,
    semester: sem,
    schoolYear: sy,
    fullName,
    dateOfBirth: document.getElementById('isDob')?.value || '',
    placeOfBirth: document.getElementById('isPob')?.value || '',
    presentAddress: document.getElementById('isAddress')?.value || '',
    telNo: document.getElementById('isTel')?.value || '',
    yearsTotal: document.getElementById('isYearsTotal')?.value || '',
    yearsRcc: document.getElementById('isYearsRcc')?.value || '',
    yearsOther: document.getElementById('isYearsOther')?.value || '',
    employmentType: document.getElementById('isEmpType')?.value || 'Full Time',
    governmentEmployee: document.getElementById('isGovEmp')?.checked ? 1 : 0,
    natureOfWork: document.getElementById('isNatureWork')?.value || '',
    timeSchedule: document.getElementById('isTimeSched')?.value || '',
    certified: document.getElementById('isCertified')?.checked ? 1 : 0,
    signedName: fullName,
    signedAt: new Date().toLocaleDateString('en-PH'),
    approvedBy: 'GLORIA B. ABRAZADO, Ph. D.',
    approvedTitle: 'Vice President for Academic Affairs'
  };

  if (existing) {
    Object.assign(existing, sheet);
  } else {
    infoSheets.push(sheet);
  }

  const sheetId = sheet.id;
  const eduRows = eduFor(sheetId);
  infoSheetEducation = infoSheetEducation.filter(e => e.sheetId !== sheetId);
  document.querySelectorAll('#isEduBody tr').forEach((tr, i) => {
    const id = parseInt(tr.dataset.eduId) || nextEduId++;
    infoSheetEducation.push({
      id, sheetId,
      degree: tr.querySelector('[data-f=degree]')?.value || '',
      dateEarned: tr.querySelector('[data-f=dateEarned]')?.value || '',
      school: tr.querySelector('[data-f=school]')?.value || '',
      major: tr.querySelector('[data-f=major]')?.value || '',
      minor: tr.querySelector('[data-f=minor]')?.value || '',
      sortOrder: i
    });
  });

  teachingLoads = teachingLoads.filter(l => l.sheetId !== sheetId);
  document.querySelectorAll('#isLoadBody tr').forEach((tr, i) => {
    const id = parseInt(tr.dataset.loadId) || nextLoadId++;
    const subject = tr.querySelector('[data-f=subject]')?.value || '';
    const deptCode = tr.querySelector('[data-f=deptCode]')?.value || '';
    const time = (tr.querySelector('[data-f=timeStart]')?.value || '') + '-' + (tr.querySelector('[data-f=timeEnd]')?.value || '');
    const days = tr.querySelector('[data-f=days]')?.value || '';
    const hpw = deriveHoursPerWeek(time, days);
    teachingLoads.push({
      id, sheetId,
      subject, deptCode,
      timeStart: tr.querySelector('[data-f=timeStart]')?.value || '',
      timeEnd: tr.querySelector('[data-f=timeEnd]')?.value || '',
      days,
      studentsMale: parseInt(tr.querySelector('[data-f=studentsM]')?.value) || 0,
      studentsFemale: parseInt(tr.querySelector('[data-f=studentsF]')?.value) || 0,
      roomNo: tr.querySelector('[data-f=room]')?.value || '',
      googleCode: tr.querySelector('[data-f=gcode]')?.value || '',
      hoursPerWeek: hpw,
      sortOrder: i
    });
  });

  curSheetSemester = sem;
  curSheetSchoolYear = sy;
  saveDemo();
  renderInfoSheet();
  showToast('✅', 'Information Sheet saved for ' + sem + ' Sem, SY ' + sy + '.');
}

// ── Render the full document-style form ──────────────────────
function renderInfoSheet() {
  const emp = users.find(u => u.id === curSheetEmpId);
  const empSelect = document.getElementById('isEmployee');
  if (empSelect && !empSelect.dataset.populated) {
    empSelect.innerHTML = '<option value="">— Select Employee (Teaching) —</option>' +
      users.filter(u => u.classification === 'Teaching').map(u =>
        `<option value="${u.id}">${esc(u.first + ' ' + u.last)} — ${esc(u.schoolLevel || 'No Level')}</option>`).join('');
    empSelect.dataset.populated = '1';
  }
  if (empSelect && curSheetEmpId) empSelect.value = String(curSheetEmpId);

  const semSel = document.getElementById('isSemester');
  if (semSel && !semSel.dataset.populated) {
    semSel.innerHTML = SEMESTER_OPTIONS.map(s => `<option>${s}</option>`).join('');
    semSel.dataset.populated = '1';
  }
  if (semSel) semSel.value = curSheetSemester;

  const existing = infoSheets.find(s => s.empId === curSheetEmpId && s.semester === curSheetSemester && s.schoolYear === curSheetSchoolYear);
  const sheet = existing || { empId: curSheetEmpId, semester: curSheetSemester, schoolYear: curSheetSchoolYear, fullName: emp ? emp.first + ' ' + emp.last : '', dateOfBirth: '', placeOfBirth: '', presentAddress: '', telNo: '', yearsTotal: '', yearsRcc: '', yearsOther: '', employmentType: 'Full Time', governmentEmployee: 0, natureOfWork: '', timeSchedule: '', certified: 0, signedName: '', signedAt: '' };

  const set = (id, v) => { const el = document.getElementById(id); if (el && el.value !== undefined) el.value = v ?? ''; };
  set('isSchoolYear', sheet.schoolYear);
  set('isFullName', sheet.fullName);
  set('isDob', sheet.dateOfBirth);
  set('isPob', sheet.placeOfBirth);
  set('isAddress', sheet.presentAddress);
  set('isTel', sheet.telNo);
  set('isYearsTotal', sheet.yearsTotal);
  set('isYearsRcc', sheet.yearsRcc);
  set('isYearsOther', sheet.yearsOther);
  set('isEmpType', sheet.employmentType);
  const govEl = document.getElementById('isGovEmp'); if (govEl) govEl.checked = !!sheet.governmentEmployee;
  set('isNatureWork', sheet.natureOfWork);
  set('isTimeSched', sheet.timeSchedule);
  const certEl = document.getElementById('isCertified'); if (certEl) certEl.checked = !!sheet.certified;

  const eduTbody = document.getElementById('isEduBody');
  if (eduTbody) {
    const rows = eduFor(sheet.id || -1);
    eduTbody.innerHTML = rows.length ? rows.map(e => `
      <tr data-edu-id="${e.id}">
        <td><input class="fi" style="padding:6px 8px" data-f="degree" value="${esc(e.degree)}" placeholder="Degree"/></td>
        <td><input class="fi" style="padding:6px 8px" data-f="dateEarned" value="${esc(e.dateEarned)}" placeholder="Date Earned"/></td>
        <td><input class="fi" style="padding:6px 8px" data-f="school" value="${esc(e.school)}" placeholder="School"/></td>
        <td><input class="fi" style="padding:6px 8px" data-f="major" value="${esc(e.major)}" placeholder="Major"/></td>
        <td><input class="fi" style="padding:6px 8px" data-f="minor" value="${esc(e.minor)}" placeholder="Minor"/></td>
        <td>${curSheetEditable ? `<button class="btn btn-outline btn-sm" onclick="removeEduRow(this)">🗑</button>` : ''}</td>
      </tr>`).join('') : `<tr><td colspan="6" style="text-align:center;padding:16px;color:var(--text-muted)">No education rows yet.</td></tr>`;
  }

  const loadTbody = document.getElementById('isLoadBody');
  if (loadTbody) {
    const rows = loadsForSheet(sheet.id || -1);
    loadTbody.innerHTML = rows.length ? rows.map(l => `
      <tr data-load-id="${l.id}">
        <td><input class="fi" style="padding:6px 8px" data-f="subject" value="${esc(l.subject)}" placeholder="Subject"/></td>
        <td><input class="fi" style="padding:6px 8px;width:70px" data-f="deptCode" value="${esc(l.deptCode)}" placeholder="CBA"/></td>
        <td><input class="fi" style="padding:6px 8px;width:65px" data-f="timeStart" value="${esc(l.timeStart)}" placeholder="2:30p"/></td>
        <td><input class="fi" style="padding:6px 8px;width:65px" data-f="timeEnd" value="${esc(l.timeEnd)}" placeholder="4:00p"/></td>
        <td><input class="fi" style="padding:6px 8px;width:60px" data-f="days" value="${esc(l.days)}" placeholder="M,W"/></td>
        <td><input class="fi" style="padding:6px 8px;width:45px" type="number" data-f="studentsM" value="${l.studentsMale}"/></td>
        <td><input class="fi" style="padding:6px 8px;width:45px" type="number" data-f="studentsF" value="${l.studentsFemale}"/></td>
        <td><input class="fi" style="padding:6px 8px;width:55px" data-f="room" value="${esc(l.roomNo)}" placeholder="410"/></td>
        <td><input class="fi" style="padding:6px 8px;width:80px" data-f="gcode" value="${esc(l.googleCode)}" placeholder="Class Code"/></td>
        <td style="font-weight:600;color:var(--maroon-dark)">${loadHours(l)}</td>
        <td>${curSheetEditable ? `<button class="btn btn-outline btn-sm" onclick="removeLoadRow(this)">🗑</button>` : ''}</td>
      </tr>`).join('') : `<tr><td colspan="11" style="text-align:center;padding:16px;color:var(--text-muted)">No class rows yet.</td></tr>`;
    const totEl = document.getElementById('isLoadTotal');
    if (totEl) totEl.textContent = (sheet.id ? totalHours(sheet.id) : 0).toFixed(1);
  }

  const certSection = document.getElementById('isCertStatus');
  if (certSection) {
    certSection.textContent = sheet.certified
      ? '✓ Certified by ' + (sheet.signedName || '—') + ' on ' + (sheet.signedAt || '—')
      : 'Not yet certified';
  }

  const empLabel = document.getElementById('isEmpLabel');
  if (empLabel) empLabel.textContent = emp ? (emp.first + ' ' + emp.last) : '—';
}

// ── Row CRUD ─────────────────────────────────────────────────
function addEduRow() {
  const tbody = document.getElementById('isEduBody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input class="fi" style="padding:6px 8px" data-f="degree" placeholder="Degree"/></td>
    <td><input class="fi" style="padding:6px 8px" data-f="dateEarned" placeholder="Date Earned"/></td>
    <td><input class="fi" style="padding:6px 8px" data-f="school" placeholder="School"/></td>
    <td><input class="fi" style="padding:6px 8px" data-f="major" placeholder="Major"/></td>
    <td><input class="fi" style="padding:6px 8px" data-f="minor" placeholder="Minor"/></td>
    <td><button class="btn btn-outline btn-sm" onclick="removeEduRow(this)">🗑</button></td>`;
  tbody.appendChild(tr);
}

function removeEduRow(btn) {
  btn.closest('tr').remove();
}

function addLoadRow() {
  const tbody = document.getElementById('isLoadBody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input class="fi" style="padding:6px 8px" data-f="subject" placeholder="Subject"/></td>
    <td><input class="fi" style="padding:6px 8px;width:70px" data-f="deptCode" placeholder="CBA"/></td>
    <td><input class="fi" style="padding:6px 8px;width:65px" data-f="timeStart" placeholder="2:30p"/></td>
    <td><input class="fi" style="padding:6px 8px;width:65px" data-f="timeEnd" placeholder="4:00p"/></td>
    <td><input class="fi" style="padding:6px 8px;width:60px" data-f="days" placeholder="M,W"/></td>
    <td><input class="fi" style="padding:6px 8px;width:45px" type="number" data-f="studentsM"/></td>
    <td><input class="fi" style="padding:6px 8px;width:45px" type="number" data-f="studentsF"/></td>
    <td><input class="fi" style="padding:6px 8px;width:55px" data-f="room" placeholder="410"/></td>
    <td><input class="fi" style="padding:6px 8px;width:80px" data-f="gcode" placeholder="Class Code"/></td>
    <td style="font-weight:600;color:var(--maroon-dark)">0.0</td>
    <td><button class="btn btn-outline btn-sm" onclick="removeLoadRow(this)">🗑</button></td>`;
  tbody.appendChild(tr);
}

function removeLoadRow(btn) {
  btn.closest('tr').remove();
  updateLoadHoursPreview();
}

function updateLoadHoursPreview() {
  let tot = 0;
  document.querySelectorAll('#isLoadBody tr').forEach(tr => {
    const time = (tr.querySelector('[data-f=timeStart]')?.value || '') + '-' + (tr.querySelector('[data-f=timeEnd]')?.value || '');
    const days = tr.querySelector('[data-f=days]')?.value || '';
    const hpw = deriveHoursPerWeek(time, days);
    const cell = tr.querySelectorAll('td')[10];
    if (cell) cell.textContent = hpw.toFixed(1);
    tot += hpw;
  });
  const totEl = document.getElementById('isLoadTotal');
  if (totEl) totEl.textContent = tot.toFixed(1);
}

// ── Page / role dispatch ─────────────────────────────────────
function openInfoSheetPage(empId, editable) {
  curSheetEmpId = empId || (loggedInUser ? loggedInUser.id : null);
  curSheetEditable = editable !== false;
  if (!curSheetSchoolYear) {
    const y = new Date().getFullYear();
    curSheetSchoolYear = y + '-' + (y + 1);
  }
  renderInfoSheet();
}

function switchSheet() {
  const empSel = document.getElementById('isEmployee');
  curSheetEmpId = empSel ? parseInt(empSel.value) : curSheetEmpId;
  const semSel = document.getElementById('isSemester');
  if (semSel) curSheetSemester = semSel.value;
  const sy = document.getElementById('isSchoolYear');
  if (sy && sy.value.trim()) curSheetSchoolYear = sy.value.trim();
  renderInfoSheet();
}

function empSheetsFor(empId) {
  return infoSheets.filter(s => s.empId === empId);
}

// ── Finance / Admin: list of all info sheets ──────────────────
function renderFinInfoSheets() {
  const container = document.getElementById('finInfoSheetContent');
  if (!container) return;
  const teaching = users.filter(u => u.classification === 'Teaching');
  container.innerHTML = `
    <div class="card" style="margin-top:20px">
      <div class="card-head"><div class="card-title">Faculty Information Sheets</div>
        <div style="font-size:12px;color:var(--text-muted)">Select a faculty to view/edit their sheet</div>
      </div>
      <div style="padding:0">
        <table style="width:100%;font-size:12.5px">
          <thead><tr style="background:var(--maroon-dark);color:#fff">
            <th style="padding:8px 10px;text-align:left">Employee</th>
            <th style="padding:8px 10px;text-align:left">School Level</th>
            <th style="padding:8px 10px;text-align:left">Semester</th>
            <th style="padding:8px 10px;text-align:left">School Year</th>
            <th style="padding:8px 10px;text-align:left">Status</th>
            <th style="padding:8px 10px;text-align:left">Action</th>
          </tr></thead>
          <tbody>
            ${teaching.map(u => {
              const sheets = sheetsFor(u.id);
              const latest = sheets[sheets.length - 1];
              const status = latest
                ? (latest.certified ? '<span class="badge b-green">✓ Certified</span>' : '<span class="badge b-yellow">Pending</span>')
                : '<span class="badge b-gray">No sheet</span>';
              return `<tr>
                <td><strong>${esc(u.first + ' ' + u.last)}</strong></td>
                <td>${esc(u.schoolLevel || '—')}</td>
                <td>${latest ? esc(latest.semester + ' Sem') : '—'}</td>
                <td>${latest ? esc(latest.schoolYear) : '—'}</td>
                <td>${status}</td>
                <td><button class="btn btn-outline btn-sm" onclick="finViewSheet(${u.id})">View / Edit</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function finViewSheet(empId) {
  curSheetEmpId = empId;
  curSheetEditable = true;
  const latest = sheetsFor(empId).slice(-1)[0];
  if (latest) {
    curSheetSemester = latest.semester;
    curSheetSchoolYear = latest.schoolYear;
  }
  renderInfoSheet();
  const card = document.querySelector('#finInfoSheet .card');
  if (card) card.scrollIntoView({ behavior: 'smooth' });
}

function renderAdmInfoSheets() {
  const container = document.getElementById('admInfoSheetContent');
  if (!container) return;
  const teaching = users.filter(u => u.classification === 'Teaching');
  container.innerHTML = `
    <div class="card" style="margin-top:20px">
      <div class="card-head"><div class="card-title">Faculty Information Sheets (Read-Only)</div>
        <div style="font-size:12px;color:var(--text-muted)">View-only — contact Finance Officer to make changes</div>
      </div>
      <div style="padding:0">
        <table style="width:100%;font-size:12.5px">
          <thead><tr style="background:var(--maroon-dark);color:#fff">
            <th style="padding:8px 10px;text-align:left">Employee</th>
            <th style="padding:8px 10px;text-align:left">School Level</th>
            <th style="padding:8px 10px;text-align:left">Semester</th>
            <th style="padding:8px 10px;text-align:left">School Year</th>
            <th style="padding:8px 10px;text-align:left">Status</th>
          </tr></thead>
          <tbody>
            ${teaching.map(u => {
              const sheets = sheetsFor(u.id);
              const latest = sheets[sheets.length - 1];
              const status = latest
                ? (latest.certified ? '<span class="badge b-green">✓ Certified</span>' : '<span class="badge b-yellow">Pending</span>')
                : '<span class="badge b-gray">No sheet</span>';
              return `<tr>
                <td><strong>${esc(u.first + ' ' + u.last)}</strong></td>
                <td>${esc(u.schoolLevel || '—')}</td>
                <td>${latest ? esc(latest.semester + ' Sem') : '—'}</td>
                <td>${latest ? esc(latest.schoolYear) : '—'}</td>
                <td>${status}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}
