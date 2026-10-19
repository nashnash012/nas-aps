// ── TEACHING LOAD MODULE ─────────────────────────────────────
// Employee-submitted schedule of classes + workload, per semester+SY.
// Header (name/level/rank/rate) is auto from the profile — employee
// only encodes the schedule and (for Elementary/Non-Teaching) absences.
// Finance can view/edit all records. Formula parameters (workDays,
// hoursPerWorkload) live in Formula Management.

let teachingLoadRecords = (_savedDemo && Array.isArray(_savedDemo.teachingLoadRecords)) ? _savedDemo.teachingLoadRecords : [];
let teachingLoadClasses = (_savedDemo && Array.isArray(_savedDemo.teachingLoadClasses)) ? _savedDemo.teachingLoadClasses : [];
let nextTeachingLoadId = (_savedDemo && _savedDemo.nextTeachingLoadId) || 1;
let nextTeachingLoadClassId = (_savedDemo && _savedDemo.nextTeachingLoadClassId) || 1;

const TL_SEMS = ['1st', '2nd', 'Summer'];
const TL_LEVELS = ['College', 'Graduate School', 'High School', 'Elementary'];
const tlCtx = {
  tl:   { empId: null, sem: '1st', sy: '' },
  finTl: { empId: null, sem: '1st', sy: '' }
};

// ── Helpers ──────────────────────────────────────────────────
function tlDefaultSY() {
  const d = new Date(), y = d.getFullYear(), m = d.getMonth() + 1;
  return (m >= 6) ? (y + '-' + (y + 1)) : ((y - 1) + '-' + y);
}

function tlSemLabel(s) {
  return s === '1st' ? '1st Sem' : s === '2nd' ? '2nd Sem' : 'Summer';
}

function tlIsNT(emp) { return !emp || emp.classification !== 'Teaching'; }
function tlLevelOf(emp) { return tlIsNT(emp) ? 'Non-Teaching' : (emp.schoolLevel || 'College'); }

function tlRateOf(emp) {
  if (!emp) return 0;
  if (tlIsNT(emp)) return parseFloat(emp.salary) || 0;
  return (typeof teacherRate === 'function') ? teacherRate(emp) : (parseFloat(emp.hourlyRate) || 0);
}

function tlUnitOf(emp) {
  if (tlIsNT(emp)) return 'per Month';
  return (typeof rateUnit === 'function') ? rateUnit(tlLevelOf(emp)) : 'per Hour';
}

function tlRecordFor(empId, sem, sy) {
  return teachingLoadRecords.find(r => r.empId === empId && r.semester === sem && r.schoolYear === sy);
}

function tlClassesFor(recordId) {
  return teachingLoadClasses.filter(c => c.recordId === recordId)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

// Robust time parser — handles "2:30p - 4:00p", "2:30PM-4:00PM", "14:00-16:00"
function tlParseTimeRange(str) {
  if (!str) return null;
  const m = String(str).trim().match(/^(\d{1,2}):?(\d{2})?\s*(am|pm|a|p)?\s*-\s*(\d{1,2}):?(\d{2})?\s*(am|pm|a|p)?$/i);
  if (!m) return null;
  let sh = parseInt(m[1], 10), sm = parseInt(m[2] || '0', 10);
  let eh = parseInt(m[4], 10), em = parseInt(m[5] || '0', 10);
  const m1 = (m[3] || '').toLowerCase(), m2 = (m[6] || '').toLowerCase();
  if ((m1 === 'pm' || m1 === 'p') && sh < 12) sh += 12;
  if ((m1 === 'am' || m1 === 'a') && sh === 12) sh = 0;
  if ((m2 === 'pm' || m2 === 'p') && eh < 12) eh += 12;
  if ((m2 === 'am' || m2 === 'a') && eh === 12) eh = 0;
  if (!m2 && m1 && eh < sh) eh += 12;
  if (eh < sh) eh += 24;
  const hours = eh + em / 60 - (sh + sm / 60);
  if (hours <= 0) return null;
  return { start: sh + sm / 60, end: eh + em / 60, hours: hours };
}

function tlRowHours(tr) {
  const g = f => { const el = tr.querySelector('[data-f=' + f + ']'); return el ? (el.value || '') : ''; };
  const tr2 = tlParseTimeRange(g('timeStart') + '-' + g('timeEnd'));
  const days = g('days').split(',').map(x => x.trim()).filter(Boolean).length;
  if (!tr2 || !days) return 0;
  return Math.round(tr2.hours * days * 10) / 10;
}

function tlTotalHours(pfx) {
  let total = 0;
  const body = document.getElementById(pfx + 'ClassBody');
  if (!body) return 0;
  body.querySelectorAll('tr').forEach(tr => { total += tlRowHours(tr); });
  return Math.round(total * 10) / 10;
}

// ── Core computation (shared by preview + save) ──────────────
// Returns { pay, formulaText, hint, workloadType, workloadValue, absences }
function tlCompute(emp, totalHours, absences) {
  const WD = (typeof WORK_DAYS !== 'undefined' && WORK_DAYS) ? WORK_DAYS : 22;
  const HPW = (typeof HOURS_PER_WORKLOAD !== 'undefined' && HOURS_PER_WORKLOAD) ? HOURS_PER_WORKLOAD : 3;
  const weeks = WD / 5;
  const level = tlLevelOf(emp);
  const r = tlRateOf(emp);
  const a = Math.max(0, parseFloat(absences) || 0);
  const h = Math.max(0, parseFloat(totalHours) || 0);

  if (tlIsNT(emp)) {
    const pay = Math.max(0, parseFloat((r - (a / WD) * r).toFixed(2)));
    return {
      pay, workloadType: 'absences', workloadValue: 0, absences: a,
      hint: 'Non-Teaching pay = Salary − (Absences ÷ Work Days) × Salary.',
      formulaText: fmt(r) + ' − (' + a + ' ÷ ' + WD + ') × ' + fmt(r) + ' = ' + fmt(pay)
    };
  }
  if (level === 'Elementary') {
    const pay = Math.max(0, parseFloat((r - (a / WD) * r).toFixed(2)));
    return {
      pay, workloadType: 'absences', workloadValue: 0, absences: a,
      hint: 'Elementary pay = Monthly Rate − (Absences ÷ Work Days) × Monthly Rate.',
      formulaText: fmt(r) + ' − (' + a + ' ÷ ' + WD + ') × ' + fmt(r) + ' = ' + fmt(pay)
    };
  }
  if (level === 'High School') {
    const mh = Math.round(h * weeks * 10) / 10;
    const wl = mh / HPW;
    const pay = Math.max(0, parseFloat((wl * r).toFixed(2)));
    return {
      pay, workloadType: 'hours', workloadValue: h, absences: 0,
      hint: 'High School pay = Rate per Workload × (Hours ÷ ' + HPW + '). 1 workload = ' + HPW + ' hrs.',
      formulaText: h.toFixed(1) + ' hrs/week × ' + weeks.toFixed(1) + ' weeks = ' + mh.toFixed(1) +
        ' hrs/month ÷ ' + HPW + ' = ' + wl.toFixed(2) + ' workload(s) × ' + fmt(r) + ' = ' + fmt(pay)
    };
  }
  // College / Graduate School (and unset level): rate per hour
  const mh = Math.round(h * weeks * 10) / 10;
  const pay = Math.max(0, parseFloat((mh * r).toFixed(2)));
  return {
    pay, workloadType: 'hours', workloadValue: h, absences: 0,
    hint: level + ' pay = Rate per Hour × Hours Worked.',
    formulaText: h.toFixed(1) + ' hrs/week × ' + weeks.toFixed(1) + ' weeks = ' + mh.toFixed(1) +
      ' hrs/month × ' + fmt(r) + ' = ' + fmt(pay)
  };
}

// ── Form markup (one template, two hosts: tl / finTl) ────────
function tlClassRowHtml(c, pfx) {
  const v = f => c ? esc(c[f] != null ? c[f] : '') : '';
  const inp = (f, w, ph) => '<input class="fi" style="padding:6px 8px' + (w ? ';width:' + w : '') + '" data-f="' + f +
    '" value="' + v(f) + '" placeholder="' + ph + '" oninput="tlPreview(\'' + pfx + '\')"/>';
  const lv = (c && c.level) ? c.level : '';
  const lvOpts = ['<option value="">(auto)</option>']
    .concat(TL_LEVELS.map(l => '<option value="' + l + '"' + (lv === l ? ' selected' : '') + '>' + l + '</option>'))
    .join('');
  const lvCell = '<select class="fi tl-level-sel" data-f="level" title="For College / For Grad — tag which level this subject is for" onchange="tlPreview(\'' + pfx + '\')">' + lvOpts + '</select>';
  return '<tr data-cid="' + (c ? c.id : '') + '">' +
    '<td>' + inp('subject', '140px', 'Subject') + '</td>' +
    '<td>' + lvCell + '</td>' +
    '<td>' + inp('deptCode', '56px', 'CBA') + '</td>' +
    '<td>' + inp('timeStart', '58px', '2:30p') + '</td>' +
    '<td>' + inp('timeEnd', '58px', '4:00p') + '</td>' +
    '<td>' + inp('days', '52px', 'M,W') + '</td>' +
    '<td><input class="fi" style="padding:6px 8px;width:44px" type="number" min="0" data-f="studentsM" value="' + (c ? (c.studentsMale || 0) : 0) + '" oninput="tlPreview(\'' + pfx + '\')"/></td>' +
    '<td><input class="fi" style="padding:6px 8px;width:44px" type="number" min="0" data-f="studentsF" value="' + (c ? (c.studentsFemale || 0) : 0) + '" oninput="tlPreview(\'' + pfx + '\')"/></td>' +
    '<td>' + inp('room', '50px', '410') + '</td>' +
    '<td>' + inp('gcode', '66px', 'Class Code') + '</td>' +
    '<td class="tl-hours-cell" style="font-weight:600;color:var(--maroon-dark);white-space:nowrap">0.0</td>' +
    '<td><button class="btn btn-outline btn-sm" onclick="tlRemoveRow(this,\'' + pfx + '\')">🗑</button></td>' +
    '</tr>';
}

function tlFormMarkup(pfx) {
  const tabs = TL_SEMS.map(s =>
    '<button class="tl-tab" data-sem="' + s + '" onclick="tlSwitchSem(\'' + s + '\',this,\'' + pfx + '\')">' + tlSemLabel(s) + '</button>'
  ).join('');
  const empRow = pfx === 'finTl' ? (
    '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:14px">' +
    '<label style="font-size:13px;font-weight:600">Employee:</label>' +
    '<select class="fi" style="min-width:270px" id="finTlEmployee" onchange="tlEmployeeChange(this.value)"></select>' +
    '<button class="btn btn-outline btn-sm" onclick="tlCloseFinanceForm()">✕ Close</button>' +
    '</div>') : '';
  return '' +
    '<div class="tl-tabs">' + tabs + '</div>' +
    '<div class="card" style="margin-top:0;border-top-left-radius:0;border-top-right-radius:0">' +
      '<div class="card-body" style="padding:24px 28px">' +
        empRow +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px 16px">' +
          '<div class="fg"><label class="fl">Name</label><input class="fi" id="' + pfx + 'Name" readonly placeholder="—"/></div>' +
          '<div class="fg"><label class="fl">Level</label><input class="fi" id="' + pfx + 'Level" readonly placeholder="—"/></div>' +
          '<div class="fg"><label class="fl">Rank</label><input class="fi" id="' + pfx + 'Rank" readonly placeholder="—"/></div>' +
          '<div class="fg"><label class="fl">Rate</label><input class="fi" id="' + pfx + 'Rate" readonly placeholder="—"/></div>' +
          '<div class="fg"><label class="fl">School Year</label><input class="fi" id="' + pfx + 'SchoolYear" placeholder="2026-2027" onchange="tlSyChange(\'' + pfx + '\')"/></div>' +
        '</div>' +
        '<div id="' + pfx + 'SaveStatus" style="font-size:12px;color:var(--text-muted);margin-top:8px"></div>' +

        '<div id="' + pfx + 'ClassesSection">' +
          '<div style="font-size:14px;font-weight:700;margin:20px 0 8px;color:var(--maroon-dark)">📅 Schedule of Classes</div>' +
          '<div style="overflow-x:auto">' +
            '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
              '<thead><tr style="background:var(--maroon-dark);color:#fff">' +
                '<th style="padding:8px 6px;text-align:left">Subject</th>' +
                '<th style="padding:8px 6px;text-align:left" title="Tag which level this subject is for (College / Graduate)">Level</th>' +
                '<th style="padding:8px 6px;text-align:left">Dept</th>' +
                '<th style="padding:8px 6px;text-align:left">Time Start</th>' +
                '<th style="padding:8px 6px;text-align:left">Time End</th>' +
                '<th style="padding:8px 6px;text-align:left">Days</th>' +
                '<th style="padding:8px 6px;text-align:left">Students M</th>' +
                '<th style="padding:8px 6px;text-align:left">Students F</th>' +
                '<th style="padding:8px 6px;text-align:left">Rm#</th>' +
                '<th style="padding:8px 6px;text-align:left">Google Class Code</th>' +
                '<th style="padding:8px 6px;text-align:left">Hrs/Week</th>' +
                '<th style="padding:8px 6px;width:40px"></th>' +
              '</tr></thead>' +
              '<tbody id="' + pfx + 'ClassBody"></tbody>' +
            '</table>' +
          '</div>' +
          '<div style="display:flex;gap:12px;align-items:center;margin-top:8px;flex-wrap:wrap">' +
            '<button class="btn btn-outline btn-sm" onclick="tlAddClassRow(\'' + pfx + '\')">+ Add Class</button>' +
            '<span style="font-size:13px;font-weight:600;color:var(--maroon-dark)">Total Hours/Week: <span id="' + pfx + 'TotalHours">0.0</span></span>' +
          '</div>' +
        '</div>' +

        '<div style="font-size:14px;font-weight:700;margin:20px 0 8px;color:var(--maroon-dark)">Pay Basis</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px 16px;align-items:end">' +
          '<div class="fg" id="' + pfx + 'HoursWrap" style="display:none">' +
            '<label class="fl" id="' + pfx + 'HoursLabel">Total Hours / Week</label>' +
            '<input class="fi" id="' + pfx + 'Hours" readonly value="0.0"/>' +
          '</div>' +
          '<div class="fg" id="' + pfx + 'AbsencesWrap" style="display:none">' +
            '<label class="fl">Absences (days)</label>' +
            '<input class="fi" id="' + pfx + 'Absences" type="number" min="0" step="0.5" placeholder="0" oninput="tlPreview(\'' + pfx + '\')"/>' +
          '</div>' +
        '</div>' +
        '<div id="' + pfx + 'FormulaHint" style="font-size:12px;color:var(--text-muted);margin-top:6px"></div>' +

        '<div style="margin-top:16px;padding:14px 18px;background:var(--gold-pale);border:1px solid rgba(107,26,26,0.18);border-radius:10px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">' +
          '<span style="font-size:13px;font-weight:600;color:var(--maroon-dark)">💰 Estimated Monthly Pay</span>' +
          '<span id="' + pfx + 'EstimatedPay" style="font-size:20px;font-weight:700;color:var(--maroon-dark)">₱0.00</span>' +
        '</div>' +
        '<div id="' + pfx + 'FormulaText" style="font-size:12px;color:var(--text-muted);margin-top:6px;font-family:monospace"></div>' +

        '<div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap">' +
          '<button class="btn btn-primary" onclick="tlSave(\'' + pfx + '\')">💾 Save Teaching Load</button>' +
          '<button class="btn btn-outline" onclick="tlRenderForm(\'' + pfx + '\', tlCtx[\'' + pfx + '\'].empId, tlCtx[\'' + pfx + '\'].sem)">↻ Reload</button>' +
        '</div>' +
      '</div>' +
    '</div>';
}

// ── Render / open ────────────────────────────────────────────
function tlRenderForm(pfx, empId, sem) {
  try {
    if (typeof users === 'undefined' || !Array.isArray(users)) return;
    const host = document.getElementById(pfx === 'tl' ? 'tlFormHost' : 'finTlFormHost');
    if (!host) return;
    if (!host.dataset.armed) {
      host.innerHTML = tlFormMarkup(pfx);
      host.dataset.armed = '1';
    }
    const ctx = tlCtx[pfx];
    if (empId) ctx.empId = parseInt(empId) || ctx.empId;
    if (!ctx.empId) {
      if (pfx === 'tl') ctx.empId = (typeof loggedInUser !== 'undefined' && loggedInUser) ? loggedInUser.id : null;
      else { const t = users.find(u => !tlIsNT(u)); if (t) ctx.empId = t.id; }
    }
    if (sem) ctx.sem = sem;
    if (!ctx.sy) ctx.sy = tlDefaultSY();

    let emp = users.find(u => u.id === ctx.empId);
    // Teaching Load applies to Teaching staff only.
    // Finance view falls back to the first faculty member; the employee
    // view shows a notice for Non-Teaching accounts.
    if (tlIsNT(emp) && pfx === 'finTl') {
      emp = users.find(u => !tlIsNT(u));
      if (emp) ctx.empId = emp.id;
    }
    if (!emp || tlIsNT(emp)) {
      delete host.dataset.armed;
      const isFin = pfx === 'finTl';
      host.innerHTML = '<div class="empty-state" style="margin-top:30px">' +
        '<div class="empty-icon">📚</div>' +
        '<div class="empty-title">' + (isFin ? 'No faculty members found' : 'Not applicable') + '</div>' +
        '<div style="font-size:13px;color:var(--text-muted)">' +
        (isFin
          ? 'Add Teaching employees in User Management first.'
          : 'The Teaching Load page applies to Teaching staff only.') +
        '</div></div>';
      return;
    }

    // tabs
    host.querySelectorAll('.tl-tab').forEach(t => t.classList.toggle('active', t.dataset.sem === ctx.sem));

    // finance employee selector
    const empSel = document.getElementById('finTlEmployee');
    if (empSel) {
      if (!empSel.dataset.populated) {
        empSel.innerHTML = users.filter(u => !tlIsNT(u)).map(u =>
          '<option value="' + u.id + '">' + esc(u.first + ' ' + u.last) + ' — ' + esc(u.classification) +
          (u.schoolLevel ? ' · ' + esc(u.schoolLevel) : '') + '</option>').join('');
        empSel.dataset.populated = '1';
      }
      if (String(emp.id) !== empSel.value) empSel.value = String(emp.id);
    }

    // header (auto from profile)
    const isNT = tlIsNT(emp);
    const level = tlLevelOf(emp);
    const rank = isNT ? '—' : ((typeof rankById === 'function' && rankById(emp.rankId)) ? rankById(emp.rankId).rank : (emp.rankName || '—'));
    const r = tlRateOf(emp);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set(pfx + 'Name', emp.first + ' ' + emp.last);
    set(pfx + 'Level', level);
    set(pfx + 'Rank', isNT ? rank : (rank + (emp.rateCustom ? ' (custom rate)' : '')));
    set(pfx + 'Rate', fmt(r) + ' ' + tlUnitOf(emp));
    set(pfx + 'SchoolYear', ctx.sy);

    // record for emp+sem+sy
    const rec = tlRecordFor(emp.id, ctx.sem, ctx.sy);
    const cls = rec ? tlClassesFor(rec.id) : [];

    // classes section visibility
    const clsSec = document.getElementById(pfx + 'ClassesSection');
    if (clsSec) clsSec.style.display = isNT ? 'none' : 'block';
    const body = document.getElementById(pfx + 'ClassBody');
    if (body) body.innerHTML = cls.map(c => tlClassRowHtml(c, pfx)).join('');

    // pay inputs visibility
    const hoursWrap = document.getElementById(pfx + 'HoursWrap');
    const absWrap = document.getElementById(pfx + 'AbsencesWrap');
    const absEl = document.getElementById(pfx + 'Absences');
    const hoursLabel = document.getElementById(pfx + 'HoursLabel');
    const absType = isNT || level === 'Elementary';
    if (hoursWrap) hoursWrap.style.display = absType ? 'none' : 'block';
    if (absWrap) absWrap.style.display = absType ? 'block' : 'none';
    if (hoursLabel && !absType) hoursLabel.textContent = level === 'High School' ? 'Total Hours / Week (→ workloads)' : 'Total Hours / Week';
    if (absEl) absEl.value = rec ? (rec.absences || 0) : '';

    // saved status
    const st = document.getElementById(pfx + 'SaveStatus');
    if (st) {
      st.innerHTML = rec
        ? '<span class="badge b-green">✓ Saved</span> &nbsp;' + esc(tlSemLabel(rec.semester) + ' · SY ' + rec.schoolYear) +
          (rec.savedAt ? ' · last saved ' + esc(String(rec.savedAt).slice(0, 10)) : '')
        : '<span class="badge b-gray">Not yet saved</span> for ' + esc(tlSemLabel(ctx.sem) + ' · SY ' + ctx.sy);
    }

    tlPreview(pfx);
  } catch (e) {
    console.error('[TeachingLoad] renderForm error:', e);
    showToast('⚠️', 'Unable to load the Teaching Load form. Please refresh and try again.');
  }
}

function tlPreview(pfx) {
  try {
    const ctx = tlCtx[pfx];
    if (!ctx || typeof users === 'undefined') return;
    const emp = users.find(u => u.id === ctx.empId);
    if (!emp) return;
    const body = document.getElementById(pfx + 'ClassBody');
    let total = 0;
    if (body) {
      body.querySelectorAll('tr').forEach(tr => {
        const h = tlRowHours(tr);
        const cell = tr.querySelector('.tl-hours-cell');
        if (cell) cell.textContent = h.toFixed(1);
        total += h;
      });
    }
    total = Math.round(total * 10) / 10;
    const totEl = document.getElementById(pfx + 'TotalHours');
    if (totEl) totEl.textContent = total.toFixed(1);
    const hrsEl = document.getElementById(pfx + 'Hours');
    if (hrsEl) hrsEl.value = total.toFixed(1);

    const absEl = document.getElementById(pfx + 'Absences');
    const a = absEl ? (parseFloat(absEl.value) || 0) : 0;
    const out = tlCompute(emp, total, a);

    const payEl = document.getElementById(pfx + 'EstimatedPay');
    if (payEl) payEl.textContent = fmt(out.pay);
    const hintEl = document.getElementById(pfx + 'FormulaHint');
    if (hintEl) hintEl.textContent = out.hint;
    const fEl = document.getElementById(pfx + 'FormulaText');
    if (fEl) fEl.textContent = out.formulaText;
  } catch (e) {
    console.error('[TeachingLoad] preview error:', e);
  }
}

// ── Form interactions ────────────────────────────────────────
function tlSwitchSem(sem, btn, pfx) {
  const ctx = tlCtx[pfx || 'tl'];
  if (!ctx) return;
  ctx.sem = sem;
  const host = document.getElementById(pfx === 'finTl' ? 'finTlFormHost' : 'tlFormHost');
  if (host) host.querySelectorAll('.tl-tab').forEach(t => t.classList.toggle('active', t.dataset.sem === sem));
  tlRenderForm(pfx, ctx.empId, sem);
}

function tlSyChange(pfx) {
  const ctx = tlCtx[pfx];
  const el = document.getElementById(pfx + 'SchoolYear');
  ctx.sy = (el && el.value.trim()) ? el.value.trim() : tlDefaultSY();
  tlRenderForm(pfx, ctx.empId, ctx.sem);
}

function tlEmployeeChange(empId) {
  const ctx = tlCtx.finTl;
  ctx.empId = parseInt(empId) || ctx.empId;
  tlRenderForm('finTl', ctx.empId, ctx.sem);
}

function tlOpenFinanceForm(empId, sem) {
  const host = document.getElementById('finTlFormHost');
  if (!host) return;
  host.style.display = 'block';
  tlCtx.finTl.sy = ''; // reset SY to default on each open
  tlRenderForm('finTl', empId, sem || '1st');
  host.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function tlCloseFinanceForm() {
  const host = document.getElementById('finTlFormHost');
  if (host) host.style.display = 'none';
}

function tlAddClassRow(pfx) {
  const body = document.getElementById(pfx + 'ClassBody');
  if (!body) return;
  const div = document.createElement('div');
  div.innerHTML = tlClassRowHtml(null, pfx);
  body.appendChild(div.firstChild);
  tlPreview(pfx);
}

function tlRemoveRow(btn, pfx) {
  const tr = btn.closest('tr');
  if (tr) tr.remove();
  tlPreview(pfx);
}

// ── Save ─────────────────────────────────────────────────────
function tlSave(pfx) {
  try {
    const ctx = tlCtx[pfx];
    const emp = (typeof users !== 'undefined') ? users.find(u => u.id === ctx.empId) : null;
    if (!emp) { showToast('⚠️', 'No employee selected.'); return; }
    const syEl = document.getElementById(pfx + 'SchoolYear');
    const sy = (syEl && syEl.value.trim()) ? syEl.value.trim() : '';
    if (!sy) { showToast('⚠️', 'School Year is required.'); return; }

    const isNT = tlIsNT(emp);
    const level = tlLevelOf(emp);
    const body = document.getElementById(pfx + 'ClassBody');
    let rows = [];
    if (body && !isNT) rows = Array.from(body.querySelectorAll('tr'));

    const total = tlTotalHours(pfx);
    const absEl = document.getElementById(pfx + 'Absences');
    const a = absEl ? (parseFloat(absEl.value) || 0) : 0;
    const absType = isNT || level === 'Elementary';
    if (!absType && total <= 0) {
      showToast('⚠️', 'Encode at least one class with valid time and days (Total Hours/Week > 0).');
      return;
    }

    const out = tlCompute(emp, total, a);
    const rank = isNT ? null : ((typeof rankById === 'function' && rankById(emp.rankId)) ? rankById(emp.rankId) : null);
    const existing = tlRecordFor(emp.id, ctx.sem, sy);

    const rec = {
      id: existing ? existing.id : nextTeachingLoadId++,
      empId: emp.id,
      semester: ctx.sem,
      schoolYear: sy,
      classification: emp.classification || 'Teaching',
      level: isNT ? 'Non-Teaching' : (emp.schoolLevel || ''),
      rankId: emp.rankId || 0,
      rankName: rank ? rank.rank : (emp.rankName || ''),
      rate: tlRateOf(emp),
      rateUnit: tlUnitOf(emp),
      salary: parseFloat(emp.salary) || 0,
      workloadType: out.workloadType,
      workloadValue: out.workloadType === 'hours' ? total : 0,
      absences: out.absences,
      computedPay: out.pay,
      savedAt: new Date().toISOString()
    };

    if (existing) Object.assign(existing, rec);
    else teachingLoadRecords.push(rec);

    // schedule rows (replace for this record)
    teachingLoadClasses = teachingLoadClasses.filter(c => c.recordId !== rec.id);
    rows.forEach((tr, i) => {
      const g = f => { const el = tr.querySelector('[data-f=' + f + ']'); return el ? (el.value || '') : ''; };
      const id = parseInt(tr.dataset.cid) || nextTeachingLoadClassId++;
      tr.dataset.cid = id;
      teachingLoadClasses.push({
        id: id,
        recordId: rec.id,
        subject: g('subject'),
        level: g('level'),
        deptCode: g('deptCode'),
        timeStart: g('timeStart'),
        timeEnd: g('timeEnd'),
        days: g('days'),
        studentsMale: parseInt(g('studentsM'), 10) || 0,
        studentsFemale: parseInt(g('studentsF'), 10) || 0,
        roomNo: g('room'),
        googleCode: g('gcode'),
        hoursPerWeek: tlRowHours(tr),
        sortOrder: i
      });
    });

    ctx.sy = sy;
    saveDemo();
    if (pfx === 'finTl' && typeof renderFinTeachingLoads === 'function') renderFinTeachingLoads();
    tlRenderForm(pfx, emp.id, ctx.sem);
    showToast('✅', 'Teaching Load saved — ' + tlSemLabel(ctx.sem) + ', SY ' + sy + '.');
  } catch (e) {
    console.error('[TeachingLoad] save error:', e);
    showToast('⚠️', 'Error saving Teaching Load. Please try again.');
  }
}

// Show/hide the "Teaching Load" sidebar item — Teaching accounts only.
function refreshEmpTlNav() {
  const nav = document.getElementById('empTlNav');
  if (!nav) return;
  const emp = (typeof loggedInUser !== 'undefined' && loggedInUser &&
               typeof users !== 'undefined' && Array.isArray(users))
    ? users.find(u => u.id === loggedInUser.id) : null;
  nav.style.display = (emp && emp.classification === 'Teaching') ? '' : 'none';
}

// ── Finance: list of all teaching load records ───────────────
function renderFinTeachingLoads() {
  const c = document.getElementById('finTeachingLoadContent');
  if (!c || typeof users === 'undefined') return;
  const semOrder = s => TL_SEMS.indexOf(s) < 0 ? 9 : TL_SEMS.indexOf(s);
  const faculty = users.filter(u => !tlIsNT(u));
  const rows = faculty.map(u => {
    const recs = teachingLoadRecords.filter(r => r.empId === u.id);
    // Sort newest-first: SY desc → semester desc → id desc.
    const latest = recs.slice().sort((a, b) =>
      (b.schoolYear || '').localeCompare(a.schoolYear || '') ||
      semOrder(b.semester) - semOrder(a.semester) ||
      (b.id || 0) - (a.id || 0))[0];
    const isNT = tlIsNT(u);
    const level = isNT ? 'Non-Teaching' : (u.schoolLevel || '—');
    const rank = isNT ? '—' : ((typeof rankById === 'function' && rankById(u.rankId)) ? rankById(u.rankId).rank : (u.rankName || '—'));
    const r = tlRateOf(u);
    const unit = tlUnitOf(u);
    const workload = latest
      ? (latest.workloadType === 'hours'
          ? (latest.workloadValue || 0) + ' hrs/wk'
          : (latest.absences || 0) + ' absence(s)')
      : '—';
    const status = latest
      ? '<span class="badge b-green">✓ Saved (' + recs.length + ')</span>'
      : '<span class="badge b-gray">No record</span>';
    return '<tr>' +
      '<td><strong>' + esc(u.first + ' ' + u.last) + '</strong></td>' +
      '<td><span class="badge b-blue">' + esc(level) + '</span></td>' +
      '<td>' + esc(rank) + '</td>' +
      '<td>' + fmt(r) + ' <span style="font-size:11px;color:var(--text-muted)">' + esc(unit) + '</span></td>' +
      '<td style="font-weight:600">' + esc(workload) + '</td>' +
      '<td style="font-weight:600;color:var(--maroon-dark)">' + (latest ? fmt(latest.computedPay) : '—') + '</td>' +
      '<td>' + (latest ? esc(tlSemLabel(latest.semester) + ' · ' + latest.schoolYear) : '—') + '</td>' +
      '<td>' + status + '</td>' +
      '<td><button class="btn btn-outline btn-sm" onclick="tlOpenFinanceForm(' + u.id + ', \'' + (latest ? latest.semester : '1st') + '\')">View / Edit</button></td>' +
      '</tr>';
  }).join('');

  c.innerHTML =
    '<div class="card" style="margin-top:20px">' +
      '<div class="card-head"><div class="card-title">Faculty Teaching Load Records</div>' +
        '<div style="font-size:12px;color:var(--text-muted)">Select a faculty member to view/edit their schedule and workload</div>' +
      '</div>' +
      '<div style="padding:0;overflow-x:auto">' +
        '<table style="width:100%;font-size:12.5px">' +
          '<thead><tr style="background:var(--maroon-dark);color:#fff">' +
            '<th style="padding:8px 10px;text-align:left">Employee</th>' +
            '<th style="padding:8px 10px;text-align:left">Level</th>' +
            '<th style="padding:8px 10px;text-align:left">Rank</th>' +
            '<th style="padding:8px 10px;text-align:left">Rate</th>' +
            '<th style="padding:8px 10px;text-align:left">Workload</th>' +
            '<th style="padding:8px 10px;text-align:left">Est. Monthly Pay</th>' +
            '<th style="padding:8px 10px;text-align:left">Sem · SY</th>' +
            '<th style="padding:8px 10px;text-align:left">Status</th>' +
            '<th style="padding:8px 10px;text-align:left">Action</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}
