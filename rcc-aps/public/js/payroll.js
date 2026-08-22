// ── USERS DATA ───────────────────────────────────────────────
let users = (_savedDemo && _savedDemo.users) || [
  {id:1, first:'Nash',        last:'Valencia',  email:'admin@rcc.edu.ph',    role:'System Admin',   status:'Active',  date:'Jan 10, 2026', salary:45000, classification:'Non-Teaching', department:'IT Office',            hireDate:'2020-01-10'},
  {id:2, first:'John',        last:'Cabigting', email:'finance@rcc.edu.ph', role:'Finance Officer', status:'Active',  date:'Jan 10, 2026', salary:38000, classification:'Non-Teaching', department:'Finance Office',       hireDate:'2019-06-01'},
  {id:3, first:'Jhon Gerald', last:'Batuaan',   email:'employee@rcc.edu.ph',role:'Employee',        status:'Active',  date:'Jan 12, 2026', salary:28500, classification:'Teaching',      department:'College of Computer Studies', hireDate:'2025-06-01', hourlyRate:190,  hoursWorked:150},
  {id:4, first:'Ana',         last:'Cruz',      email:'ana@rcc.edu.ph',     role:'Employee',        status:'Active',  date:'Feb 5, 2026',  salary:22000, classification:'Non-Teaching', department:'Accounting Office',   hireDate:'2023-08-15'},
  {id:5, first:'Roberto',     last:'Lim',       email:'roberto@rcc.edu.ph', role:'Finance Officer', status:'Inactive', date:'Feb 12, 2026', salary:35000, classification:'Non-Teaching', department:'Finance Office',       hireDate:'2018-01-20', endDate:'2026-05-31'},
  {id:6, first:'Luz',         last:'Reyes',     email:'luz@rcc.edu.ph',     role:'Employee',        status:'Active',  date:'Mar 3, 2026',  salary:32500, classification:'Teaching',      department:'College of Education', hireDate:'2022-06-01', hourlyRate:217,  hoursWorked:150},
  {id:7, first:'Carlo',       last:'Mendoza',   email:'carlo@rcc.edu.ph',   role:'Employee',        status:'Active',  date:'Mar 15, 2026', salary:20000, classification:'Non-Teaching', department:'Maintenance Office',  hireDate:'2024-02-01'},
  {id:8, first:'Sofia',       last:'Garcia',    email:'sofia@rcc.edu.ph',   role:'Employee',        status:'Inactive', date:'Apr 1, 2026',  salary:25000, classification:'Teaching',      department:'College of Arts & Sciences', hireDate:'2025-11-03', endDate:'2026-03-31', hourlyRate:167, hoursWorked:150},
  {id:9, first:'Maricel',     last:'Dela Cruz', email:'maricel@rcc.edu.ph', role:'Employee',        status:'Active',  date:'Apr 14, 2026', salary:27000, classification:'Non-Teaching', department:'Registrar Office',       hireDate:'2023-01-16'},
  {id:10,first:'Rey',         last:'Santos',    email:'rey@rcc.edu.ph',     role:'Employee',        status:'Active',  date:'Apr 22, 2026', salary:31000, classification:'Teaching',      department:'College of Business & Accountancy', hireDate:'2021-06-01', hourlyRate:207, hoursWorked:150},
  {id:11,first:'Jennifer',    last:'Torres',    email:'jennifer@rcc.edu.ph',role:'Employee',        status:'Active',  date:'May 5, 2026',  salary:24000, classification:'Non-Teaching', department:'Guidance Office',       hireDate:'2024-07-01'},
  {id:12,first:'Edwin',       last:'Navarro',   email:'edwin@rcc.edu.ph',   role:'Employee',        status:'Active',  date:'May 12, 2026', salary:33000, classification:'Teaching',      department:'College of Criminal Justice', hireDate:'2019-06-01', hourlyRate:220, hoursWorked:150},
];
let nextUserId = (_savedDemo && _savedDemo.nextUserId) || 13;
let editingUserId = null;
let cashAdvances = (_savedDemo && _savedDemo.cashAdvances) || {}; // per-employee cash advance: { id: amount }
// Payroll runs confirmed from the calculator (persisted). { empId, period, month, year, gross, sss, phil, pag, bir, cash, thirteenth, net, date }
let payrollRecords = (_savedDemo && _savedDemo.payrollRecords) || [];
// 13th-month payout tracking: { empId_year: { date } }
let bonusPayouts = (_savedDemo && _savedDemo.bonusPayouts) || {};

// ── PAYROLL RECORDS (per employee per month) ─────────────────
// Employee classification helpers
const EMP_CLASS = { Teaching: {badge:'b-blue'}, 'Non-Teaching': {badge:'b-gold'} };
function empGrossPay(emp, hours, absences) {
  if (emp.classification === 'Teaching') {
    const h = Math.max(0, (hours != null && hours !== '') ? parseFloat(hours) : (emp.hoursWorked || 0));
    const r = Math.max(0, parseFloat(emp.hourlyRate) || 0);
    return parseFloat((h * r).toFixed(2));
  }
  const base = Math.max(0, parseFloat(emp.salary) || 0);
  const a = Math.max(0, (absences != null && absences !== '') ? parseFloat(absences) : (emp.absenceDays || 0));
  return parseFloat((base - (a / WORK_DAYS) * base).toFixed(2));
}
function empHrsOrAbs(emp) {
  return emp.classification === 'Teaching'
    ? { label:'Hours Worked', unit:'hrs',  value: emp.hoursWorked || 0 }
    : { label:'Absences',     unit:'days', value: emp.absenceDays || 0 };
}
function getEmpCashAdvance(id) { return parseFloat(cashAdvances[id]) || 0; }

// RA 10963 (TRAIN) / CREATE Act: 13th month pay + other bonuses are exempt
// from income tax only up to a configurable annual limit (default ₱90,000);
// the excess is taxable income. Editable in Bonus Management.
let BONUS_EXEMPTION_LIMIT = (_savedDemo && _savedDemo.bonusExemptionLimit) || 90000;
// Payroll basis: working days per month used as the absence divisor for
// monthly-paid (Non-Teaching) staff. Configurable in Deduction Tables —
// standard convention is 22; holidays stay paid so they are not deducted.
let WORK_DAYS = (_savedDemo && _savedDemo.workDays) || 22;
// Splits bonuses (13th month + other bonuses) into exempt and taxable parts.
// Returns the taxable excess and how much of it comes from the 13th month.
function splitBonusTaxable(thirteenth, otherBonuses) {
  const t13 = parseFloat(thirteenth) || 0;
  const ob  = parseFloat(otherBonuses) || 0;
  const total = t13 + ob;
  const taxableTotal = Math.max(0, total - BONUS_EXEMPTION_LIMIT);
  const taxable13 = Math.min(t13, taxableTotal);
  const taxableBonus = taxableTotal - taxable13;
  return {
    total, taxableTotal,
    taxable13, taxableBonus,
    exempt13: t13 - taxable13,
    exemptBonus: ob - taxableBonus,
    exemptTotal: Math.min(total, BONUS_EXEMPTION_LIMIT),
  };
}

// BIR annual withholding (TRAIN Law brackets) — computed from the EDITABLE
// birData table (Deduction Tables → BIR). Keeping the tax in sync with what
// the Finance Officer configures keeps the system compliant when BIR issues
// new schedules. Brackets are structured {min, max, base, rate} rows matching
// income in (min, max]; max = null is the open-ended top bracket.
function annualBIR(annual) {
  for (const row of birData) {
    const min = parseFloat(row.min) || 0;
    const max = openMax(row) ? Infinity : (parseFloat(row.max) || Infinity);
    if (annual > min && annual <= max) {
      return parseFloat(((parseFloat(row.base)||0) + (annual - min) * ((parseFloat(row.rate)||0)) / 100).toFixed(2));
    }
  }
  return 0;
}
// Taxable monthly income = gross minus the employee's mandatory contributions
// (SSS, PhilHealth, Pag-IBIG). Per BIR RR 11-2018 this is the base the BIR taxes.
function taxableMonthlyOf(gross, d) {
  return Math.max(0, (parseFloat(gross)||0) - (parseFloat(d?.sss)||0) - (parseFloat(d?.phil)||0) - (parseFloat(d?.pag)||0));
}
// Extra ANNUAL BIR tax caused by the taxable one-time bonus (0 when fully exempt ≤₱90,000).
// Computed on the annual TAXABLE income so it is consistent with the monthly BIR method.
function bonusAnnualTax(taxableMonthly, taxableBonus) {
  const base = Math.max(0, parseFloat(taxableMonthly) || 0) * 12;
  const b = parseFloat(taxableBonus) || 0;
  if (b <= 0) return 0;
  return Math.max(0, annualBIR(base + b) - annualBIR(base));
}
// 13th Month Excess Tax (RA 10963 / CREATE): the FULL tax on the taxable excess is
// withheld from the December 13th Month Pay per BIR annualized withholding rules.
// d.bir here is the regular monthly withholding (13th is NOT added to monthly BIR).
function thirteenthTaxSplit(d, monthlyGross, taxable13) {
  const annualTax = bonusAnnualTax(taxableMonthlyOf(monthlyGross, d), taxable13);
  return { annualTax, baseBir: parseFloat((d.bir || 0).toFixed(2)) };
}

// Active custom deduction categories (Deduction Tables → Other Deduction
// Categories) applied on top of statutory deductions. Non-statutory: they do
// NOT reduce taxable income — they lower net pay only, like a cash advance.
// customOverrides maps category id → amount for per-run calculator overrides;
// ids left blank fall back to the category default (fixed ₱ or % of gross).
function activeCustomDeductions(gross, customOverrides) {
  return deductionCategories
    .filter(c => c.status === 'Active')
    .map(c => {
      let amt;
      if (customOverrides && customOverrides[c.id] !== undefined) amt = parseFloat(customOverrides[c.id]) || 0;
      else if (c.type === 'percent') amt = (parseFloat(gross) || 0) * c.amount / 100;
      else amt = parseFloat(c.amount) || 0;
      return { id: c.id, name: c.name, amount: parseFloat(amt.toFixed(2)) };
    })
    .filter(x => x.amount > 0);
}

// Reads the per-run override inputs from the Payroll Calculator. Blank = use
// the category default; an explicit 0 excludes the category for this run.
function collectCustomOverrides() {
  const ov = {};
  deductionCategories.filter(c => c.status === 'Active').forEach(c => {
    const el = document.getElementById('calcCustom_' + c.id);
    if (el && el.value !== '') ov[c.id] = Math.max(0, parseFloat(el.value) || 0);
  });
  return ov;
}

// Helper: compute deductions
function computeDeductions(gross, cashAdv, extraAnnual, customOverrides) {
  const salary = Math.max(0, parseFloat(gross) || 0);
  // SSS — 2025 schedule (RA 11199, Circular 2024-006): Employee share is read
  // from the editable structured sssTable brackets (MSC ₱5,000–₱35,000, 5%
  // employee share). A bracket matches when salary >= min and salary < max.
  function getSSS(s) {
    for (const row of sssTable) {
      const min = parseFloat(row.min) || 0;
      const max = openMax(row) ? Infinity : (parseFloat(row.max) || Infinity);
      if (s >= min && s < max) return parseFloat(row.emp) || 0;
    }
    return sssTable.length ? (parseFloat(sssTable[sssTable.length - 1].emp) || 0) : 0;
  }
// Total monthly PhilHealth premium (employee + employer) for a salary base,
// clamped to the editable min/max contribution. Shared by the calculator and
// the Deduction Tables example renderer so both always agree.
function philMonthlyTotal(s) {
  return Math.min(philData.max, Math.max(philData.min, s * philData.rate / 100));
}
// PhilHealth — rate% of the salary base (half = employee share). The base is
// clamped to the editable salary floor/ceiling before applying the rate.
function getPhil(s) {
  const base = Math.min(philData.ceiling || Infinity, Math.max(philData.floor || 0, s));
  return parseFloat((philMonthlyTotal(base) / 2).toFixed(2));
}
  // Pag-IBIG — 2% of monthly compensation (1% for ≤₱1,500), max ₱100 employee
  function getPag(s) {
    const r = s <= 1500 ? pagData.rate1 : pagData.rate2;
    return parseFloat(Math.min(s * r / 100, pagData.empMax).toFixed(2));
  }
  // BIR TRAIN Law (CREATE MORE brackets retained) — BIR withholds on the monthly
  // TAXABLE income (gross minus mandatory SSS/PhilHealth/Pag-IBIG), annualized.
  // extraAnnual is the one-time taxable bonus excess (e.g. 13th month over ₱90,000).
  function getBIR(s, sss, phil, pag) {
    const taxable = Math.max(0, s - sss - phil - pag);
    const annual = taxable * 12 + (parseFloat(extraAnnual) || 0);
    return parseFloat((annualBIR(annual) / 12).toFixed(2));
  }
  const sss  = getSSS(salary);
  const phil = getPhil(salary);
  const pag  = getPag(salary);
  const bir  = getBIR(salary, sss, phil, pag);
  const cash = parseFloat(cashAdv) || 0;
  const custom = activeCustomDeductions(salary, customOverrides);
  const customTotal = parseFloat(custom.reduce((s, x) => s + x.amount, 0).toFixed(2));
  const net  = parseFloat((salary - sss - phil - pag - bir - cash - customTotal).toFixed(2));
  return { sss, phil, pag, bir, cash, custom, customTotal, gross: salary, net };
}

// ── PAYROLL CALCULATOR ────────────────────────────────────────
function calcEmpOptions() {
  const type = (document.getElementById('calcType')||{}).value || '';
  return users.filter(u=>u.status==='Active' && (u.role==='Employee'||u.role==='Finance Officer'||u.role==='System Admin'))
    .filter(u=>!type || u.classification===type);
}

function getCalcEmpQuery() {
  return ((document.getElementById('calcEmpSearch')||{}).value||'').toLowerCase().trim();
}

function calcEmpMatches(u) {
  const q = getCalcEmpQuery();
  if (!q) return true;
  const name = `${u.first} ${u.last}`.toLowerCase();
  return name.includes(q) || (u.email||'').toLowerCase().includes(q) || (u.department||'').toLowerCase().includes(q);
}

function renderCalcEmpList(list, show) {
  const box = document.getElementById('calcEmpList');
  if (!box) return;
  box.innerHTML = list.length
    ? list.map(u=>`<div class="combobox-item" onclick="selectCalcEmp(${u.id})">${esc(displayName(u))} — ${u.classification}${u.department?' · '+esc(u.department):''}</div>`).join('')
    : '<div class="combobox-empty">No employee found.</div>';
  box.classList.toggle('show', show !== false);
}

function openCalcEmpList() {
  renderCalcEmpList(calcEmpOptions().filter(calcEmpMatches));
}

function closeCalcEmpList() {
  const box = document.getElementById('calcEmpList');
  if (box) box.classList.remove('show');
}

function resetCalcOutput() {
  const res = document.getElementById('calcResult');
  const empty = document.getElementById('calcEmpty');
  const meta = document.getElementById('calcEmpMeta');
  if (res) res.style.display = 'none';
  if (empty) { empty.style.display = 'block'; empty.innerHTML = '<div style="font-size:36px;margin-bottom:8px">💰</div><div>Select an employee, enter hours worked (Teaching) or absences (Non-Teaching), and any cash advance to begin computation.</div>'; }
  if (meta) meta.style.display = 'none';
}

function onCalcEmpInput() {
  const hidden = document.getElementById('calcEmp');
  if (hidden && hidden.value) { hidden.value = ''; resetCalcOutput(); }
  openCalcEmpList();
}

function selectCalcEmp(id) {
  const emp = users.find(u=>u.id===id);
  if (!emp) return;
  document.getElementById('calcEmp').value = id;
  const inp = document.getElementById('calcEmpSearch');
  if (inp) inp.value = `${displayName(emp)} — ${emp.classification}${emp.department?' · '+emp.department:''}`;
  closeCalcEmpList();
  loadEmployeeData();
}

function onCalcEmpKey(e) {
  if (e.key === 'Escape') { closeCalcEmpList(); return; }
  if (e.key === 'Enter') {
    e.preventDefault();
    const item = document.querySelector('#calcEmpList .combobox-item');
    if (item) item.click();
  }
}

function populateCalcEmployees() {
  renderCalcEmpList(calcEmpOptions(), false);
  renderCalcCustomInputs();
  updateCalc13thState();
}

// Per-run override inputs for active custom deduction categories. Fixed
// categories pre-fill their default amount; percent categories start blank
// (auto % of gross) and any typed value overrides the computed amount.
function renderCalcCustomInputs() {
  const row = document.getElementById('calcCustomRow');
  if (!row) return;
  const cats = deductionCategories.filter(c => c.status === 'Active');
  if (!cats.length) { row.style.display = 'none'; row.innerHTML = ''; return; }
  row.style.display = 'grid';
  row.innerHTML = cats.map(c => `
    <div class="fg">
      <label class="fl">📌 ${esc(c.name)} ${c.type === 'percent' ? '(' + c.amount + '% of gross)' : '(₱)'}</label>
      <input class="fi" type="number" step="0.01" min="0" id="calcCustom_${c.id}"
        value="${c.type === 'fixed' ? (parseFloat(c.amount)||0).toFixed(2) : ''}"
        placeholder="${c.type === 'percent' ? 'auto — ' + c.amount + '% of gross' : '0.00'}"
        oninput="computePayroll()"/>
    </div>`).join('');
}

// Enable/disable the 13th Month option in the payroll calculator based on Bonus Management toggle
function updateCalc13thState() {
  const chk = document.getElementById('calc13th');
  const wrap = document.getElementById('calc13thWrap');
  const lbl = document.getElementById('calc13thLabel');
  if (!chk) return;
  const active = isThirteenthActive();
  const period = (document.getElementById('payPeriod')?.value || 'December 2026');
  const isDec = /^december/i.test(period.split(' ')[0]);
  const canUse = active && isDec;
  chk.disabled = !canUse;
  chk.checked = canUse;
  if (wrap) wrap.style.opacity = canUse ? '1' : '0.5';
  if (wrap) wrap.style.cursor = canUse ? 'pointer' : 'not-allowed';
  if (lbl) lbl.textContent = canUse
    ? '🎁 Include 13th Month Pay (RA 8515)'
    : active
      ? '🎁 13th Month Pay — applies only in the December run'
      : '🎁 13th Month Pay — disabled (enable in Bonus Management)';
  computePayroll();
}

function onPayPeriodChange() {
  updateCalc13thState();
  updateCalcStatusBadge();
  renderPayrollSummary();
}

function filterCalcEmployees() {
  const hidden = document.getElementById('calcEmp');
  const cur = parseInt(hidden.value) || 0;
  if (cur && !calcEmpOptions().some(u=>u.id===cur)) {
    hidden.value = '';
    const inp = document.getElementById('calcEmpSearch');
    if (inp) inp.value = '';
    resetCalcOutput();
  }
  openCalcEmpList();
}

document.addEventListener('click', function(e){
  const wrap = document.getElementById('calcEmpWrap');
  if (wrap && !wrap.contains(e.target)) closeCalcEmpList();
});

function loadEmployeeData() {
  const id = parseInt(document.getElementById('calcEmp').value);
  const emp = users.find(u=>u.id===id);
  const res = document.getElementById('calcResult');
  const empty = document.getElementById('calcEmpty');
  const meta = document.getElementById('calcEmpMeta');
  const salEl = document.getElementById('calcSalary');
  const attEl = document.getElementById('calcAtt');
  const cashEl = document.getElementById('calcCash');
  if (!emp) {
    res.style.display='none'; empty.style.display='block'; meta.style.display='none';
    return;
  }
  const isTeaching = emp.classification === 'Teaching';
  document.getElementById('calcMetaName').textContent = displayName(emp);
  document.getElementById('calcMetaClass').textContent = emp.classification;
  document.getElementById('calcMetaDept').textContent = emp.department || '—';
  meta.style.display = 'block';
  document.getElementById('calcGrossFieldLabel').textContent = isTeaching ? 'Hourly Rate (₱)' : 'Monthly Base Salary (₱)';
  document.getElementById('calcAttLabel').textContent = isTeaching ? 'Hours Worked' : 'Absences (days, ÷' + WORK_DAYS + ')';
  salEl.value = isTeaching ? (emp.hourlyRate||'') : (emp.salary||'');
  attEl.value = isTeaching ? (emp.hoursWorked||'') : (emp.absenceDays||0);
  cashEl.value = getEmpCashAdvance(emp.id) || '';
  empty.style.display = 'none';
  res.style.display = 'block';
  computePayroll();
  updateCalcStatusBadge();
}

// Shows a warning badge when the selected employee already has a released
// payroll record for the current pay period, so the user knows confirming will overwrite it.
function updateCalcStatusBadge() {
  const badge = document.getElementById('calcStatusBadge');
  if (!badge) return;
  const id = parseInt(document.getElementById('calcEmp').value) || 0;
  const emp = users.find(u=>u.id===id);
  const period = document.getElementById('payPeriod').value || 'December 2026';
  const [monthName, yearStr] = period.split(' ');
  const year = parseInt(yearStr) || 2026;
  const monthNum = MONTHS.indexOf(monthName) + 1;
  const rec = payrollRecords.find(r=>r.empId===id && r.month===monthNum && r.year===year);
  if (emp && rec) {
    badge.style.display = 'block';
    badge.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;background:#FFEBEE;border:1px solid #F5C6C6;color:#C62828;border-radius:8px;padding:8px 12px;font-size:12.5px;font-weight:600">✓ Already processed for <strong>${rec.period}</strong> — Net ${fmt(rec.net)} · Released ${rec.date}. Confirming will <u>overwrite</u> the existing record.</span>`;
  } else {
    badge.style.display = 'none';
    badge.innerHTML = '';
  }
}

// Holds the last computed payroll so "Confirm & Generate Payslip" can store it
let lastCalc = null;

// Active configurable bonus types (excl. statutory 13th month, id=1) applied to earnings.
// Defense-in-depth: legacy entries saved before the reserved-name rule
// (duplicates of "13th Month Pay") are ignored in every computation, even if
// they still exist in stored data or a stale cache. Months-of-Pay customs are
// 13th-month-style annual payouts: DECEMBER-ONLY (fail-closed when the period
// cannot be determined), computed as value × the employee's average monthly pay.
// Last calendar day of a payroll period string like "November 2026".
function periodEndDate(periodStr) {
  const parts = String(periodStr || '').trim().split(/\s+/);
  const m = MONTHS.indexOf(parts[0]);
  const y = parseInt(parts[1]);
  if (m < 0 || isNaN(y)) return null;
  return new Date(y, m + 1, 0);
}

function activeBonusTypes(emp, baseGross, periodEnd) {
  const isDecemberPeriod = !!periodEnd && periodEnd.getMonth() === 11;
  return bonusTypes
    .filter(b => {
      if (b.status !== 'Active' || b.id === 1 || isIgnoredCustomBonus(b)) return false;
      // Months-of-Pay customs mirror the statutory 13th Month Pay: December-only.
      if (b.kind === 'months' && !isDecemberPeriod) return false;
      // Give-date scheduling: a bonus with a release date only applies to
      // payroll periods ending on or after that date.
      if (b.releaseDate && periodEnd) {
        const rd = parseDate(b.releaseDate);
        if (!isNaN(rd) && rd > periodEnd) return false;
      }
      return true;
    })
    .map(b => {
      let amount = 0;
      if (b.kind === 'fixed')       amount = b.value;
      else if (b.kind === 'percent') amount = baseGross * (b.value / 100);
      else if (b.kind === 'months')  amount = avgMonthlyPay(emp) * b.value;
      return { name: b.name, amount: parseFloat(amount.toFixed(2)), deMinimis: !!b.deMinimis };
    })
    .filter(b => b.amount > 0);
}

// Splits active bonuses into taxable (subject to BIR + ₱90k pool + contributions)
// and de minimis (BIR RR 11-2018: exempt from tax & contributions, NOT in ₱90k pool)
function splitBonuses(bonuses) {
  const deMinimisSum = bonuses.filter(b => b.deMinimis).reduce((s, b) => s + b.amount, 0);
  const taxableSum   = bonuses.filter(b => !b.deMinimis).reduce((s, b) => s + b.amount, 0);
  return { deMinimisSum: parseFloat(deMinimisSum.toFixed(2)), taxableSum: parseFloat(taxableSum.toFixed(2)) };
}

function computePayroll() {
  const id = parseInt(document.getElementById('calcEmp').value);
  const emp = users.find(u=>u.id===id);
  if (!emp) return;
  const isTeaching = emp.classification === 'Teaching';
  const rateEl = document.getElementById('calcSalary');
  const attEl = document.getElementById('calcAtt');
  const cashEl = document.getElementById('calcCash');
  const period = document.getElementById('payPeriod').value || 'December 2026';
  const [monthName, yearStr] = period.split(' ');
  const year = parseInt(yearStr) || 2026;
  const isDec = /^december/i.test(monthName);

  let gross = 0, meta = '';
  if (isTeaching) {
    const h = Math.max(0, parseFloat(attEl.value) || 0);
    const r = Math.max(0, parseFloat(rateEl.value) || 0);
    gross = parseFloat((h * r).toFixed(2));
    meta = `${h} hrs × ₱${r.toLocaleString('en-PH',{minimumFractionDigits:2})} = ${fmt(gross)}`;
  } else {
    const base = Math.max(0, parseFloat(rateEl.value) || 0);
    const a = Math.max(0, parseFloat(attEl.value) || 0);
    gross = parseFloat((base - (a/WORK_DAYS)*base).toFixed(2));
    meta = `₱${base.toLocaleString('en-PH',{minimumFractionDigits:2})} − (${a}/${WORK_DAYS}) = ${fmt(gross)}`;
  }

  // Active bonus types (excl. the statutory 13th month, id=1) are added to gross.
  // De minimis benefits (BIR RR 11-2018) are tax-exempt & excluded from the ₱90k pool and contributions.
  const bonuses = activeBonusTypes(emp, gross, periodEndDate(period));
  const { deMinimisSum, taxableSum } = splitBonuses(bonuses);
  const grossTaxable = gross + taxableSum;

  // 13th Month Pay (RA 8515) — automatic for the December payroll run, opt-out via checkbox
  const chk = document.getElementById('calc13th');
  const use13th = isDec && chk && chk.checked && isThirteenthActive();
  const el13 = thirteenthEligibility(emp, year);
  // Uses the salary/gross actually entered in the calculator, not the stored profile salary
  const thirteenth = use13th && el13.eligible ? computeThirteenth(emp, year, gross) : 0;
  // Real-world (RA 10963 / CREATE): 13th month pay is exempt only up to ₱90,000/yr.
  // The excess is added as one-time taxable income in the BIR annualization.
  // Only TAXABLE bonuses join the 13th month in the ₱90,000 exempt pool (de minimis is separate).
  const thirteenSplit = splitBonusTaxable(thirteenth, taxableSum);
  const cash = Math.max(0, parseFloat(cashEl.value) || 0);
  // Taxable 13th month excess is a one-time annual amount added to the BIR annualization
  const d = computeDeductions(grossTaxable, cash, 0, collectCustomOverrides());
  const tTax = thirteenthTaxSplit(d, grossTaxable, thirteenSplit.taxable13);
  // Annual BIR tax caused by the taxable 13th month excess (₱0 when fully exempt ≤₱90,000)
  const thirteenTaxAmt = tTax.annualTax;
  let note13 = '';
  if (isDec && use13th && !el13.eligible) {
    note13 = '<div style="font-size:12px;color:#C62828;margin-top:8px;background:#FFEBEE;border:1px solid #F5C6C6;border-radius:8px;padding:8px 10px">⚠️ '+emp.first+' <strong>rendered no service</strong> in '+year+', so no basic salary was earned — no 13th Month Pay under RA 8515 / DOLE.</div>';
  } else if (!isDec) {
    note13 = '<div style="font-size:12px;color:var(--text-muted);margin-top:8px;background:#F5F0EA;border:1px solid var(--border);border-radius:8px;padding:8px 10px">💡 13th Month Pay applies only to the <strong>December</strong> payroll run per RA 8515 / DOLE. Select December as the pay period to include it.</div>';
  } else if (thirteenSplit.taxable13 > 0) {
    note13 = '<div style="font-size:12px;color:#C62828;margin-top:8px;background:#FFEBEE;border:1px solid #F5C6C6;border-radius:8px;padding:8px 10px">⚠️ 13th Month Pay + taxable bonuses exceed the <strong>'+fmt(BONUS_EXEMPTION_LIMIT)+' annual exemption</strong> (RA 10963 / CREATE Act). Exempt: <strong>'+fmt(thirteenSplit.exempt13)+'</strong> · Taxable excess: <strong>'+fmt(thirteenSplit.taxable13)+'</strong><br>🧾 <strong>13th Month Excess Tax: '+fmt(thirteenTaxAmt)+'</strong> — this is withheld in full from your December 13th Month Pay.</div>';
  }

  const grossTotal = grossTaxable + deMinimisSum + thirteenth;
  const net = parseFloat((d.net + deMinimisSum + thirteenth - tTax.annualTax).toFixed(2));
  lastCalc = {
    empId: emp.id, name:`${emp.first} ${emp.last}`, month:MONTHS.indexOf(monthName)+1, monthName, year, period,
    gross: grossTaxable, deMinimisSum, thirteenth, thirteenTaxable: thirteenSplit.taxable13, thirteenExempt: thirteenSplit.exempt13, thirteenTax: tTax.annualTax, net, sss:d.sss, phil:d.phil, pag:d.pag, bir:d.bir, cash, bonuses,
    customDeds: d.custom, customTotal: d.customTotal
  };

  document.getElementById('calcEarnings').innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F0EA;font-size:13.5px"><span style="color:var(--text-muted)">${emp.classification==='Teaching'?'Hours Worked × Rate':'Monthly Base Salary'}</span><span style="font-weight:600">${meta}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F0EA;font-size:13.5px"><span style="color:var(--text-muted)">${emp.classification==='Teaching'?'Hourly Earnings':'Base Salary'}</span><span style="font-weight:600">${fmt(gross)}</span></div>
    ${bonuses.map(b=>'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F0EA;font-size:13.5px"><span style="color:var(--text-muted)">🎁 '+esc(b.name)+' <span style="font-size:11px;color:'+(b.deMinimis?'#2E7D32':'var(--text-muted)')+'">— '+(b.deMinimis?'de minimis (tax-exempt)':'taxable bonus')+'</span></span><span style="font-weight:600">+'+fmt(b.amount)+'</span></div>').join('')}
    ${thirteenth>0 ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F0EA;font-size:13.5px"><span style="color:var(--text-muted)">🎁 13th Month Pay (RA 8515) <span style="font-size:11px;color:#2E7D32">— exempt up to '+fmt(BONUS_EXEMPTION_LIMIT)+'/yr</span></span><span style="font-weight:700;color:var(--maroon-dark)">+'+fmt(thirteenSplit.exempt13)+'</span></div>' : ''}
    ${thirteenth>0 && thirteenSplit.taxable13>0 ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F0EA;font-size:13.5px"><span style="color:var(--text-muted)">⚠️ 13th Month excess <span style="font-size:11px;color:#C62828">— taxable (over '+fmt(BONUS_EXEMPTION_LIMIT)+')</span></span><span style="font-weight:600;color:#C62828">+'+fmt(thirteenSplit.taxable13)+'</span></div>' : ''}
    ${note13}`;
  document.getElementById('rBasic').textContent = fmt(grossTotal);
  document.getElementById('rSSS').textContent = fmt(d.sss);
  document.getElementById('rPhil').textContent = fmt(d.phil);
  document.getElementById('rPag').textContent = fmt(d.pag);
  document.getElementById('rBIR').textContent = fmt(d.bir);
  const r13Row = document.getElementById('r13TaxRow');
  if (r13Row) {
    r13Row.style.display = tTax.annualTax > 0 ? 'flex' : 'none';
    document.getElementById('r13Tax').textContent = fmt(tTax.annualTax);
  }
  document.getElementById('rCash').textContent = fmt(d.cash);
  const rCustom = document.getElementById('rCustomRows');
  if (rCustom) {
    rCustom.innerHTML = d.custom.map(x =>
      '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F0EA;font-size:13.5px"><span style="color:var(--text-muted)">📌 ' + esc(x.name) + '</span><span style="font-weight:600;color:#C62828">' + fmt(x.amount) + '</span></div>'
    ).join('');
  }
  document.getElementById('rTotDed').textContent = fmt(d.sss + d.phil + d.pag + d.bir + d.cash + d.customTotal + tTax.annualTax);
  document.getElementById('rNetPay').textContent = fmt(net);
}

function confirmPayroll() {
  if (!lastCalc || !users.find(u=>u.id===lastCalc.empId)) { showToast('⚠️','Select an employee and compute the payroll first.'); return; }
  const rec = Object.assign({}, lastCalc, {
    date: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
  });
  const existing = payrollRecords.find(r=>r.empId===rec.empId && r.month===rec.month && r.year===rec.year);
  if (existing) {
    document.getElementById('confirmIcon').textContent = '⚠️';
    document.getElementById('confirmMsg').innerHTML =
      `<strong>${esc(rec.name)}</strong> already has a released payroll for <strong>${rec.period}</strong> (Net ${fmt(existing.net)} · Released ${existing.date}).<br><br>` +
      `Confirming will <strong style="color:#C62828">overwrite</strong> this record and its payslip with the new computation (Net ${fmt(rec.net)}). Continue?`;
    document.getElementById('confirmActionBtn').onclick = () => { closeModal('confirmModal'); doSavePayroll(rec, existing); };
    document.getElementById('confirmModal').classList.add('show');
    return;
  }
  doSavePayroll(rec, null);
}

function doSavePayroll(rec, existing) {
  if (existing) Object.assign(existing, rec);
  else payrollRecords.push(rec);
  // One-time deduction semantics: the cash advance is consumed by this
  // payroll run — clear it so it is not deducted again in the next period.
  if ((parseFloat(rec.cash) || 0) > 0) cashAdvances[rec.empId] = 0;
  saveDemo();
  renderPayrollSummary();
  updateCalcStatusBadge();
  const thirteenthMsg = rec.thirteenth > 0 ? ' — includes 13th Month Pay (RA 8515)' : '';
  showToast('✅',`${rec.name} payroll computed and payslip generated — ${rec.period} · Net Pay ${fmt(rec.net)}${thirteenthMsg}`);
}

function renderPayrollSummary() {
  const tbody = document.getElementById('payrollSummaryBody');
  if (!tbody) return;
  const period = document.getElementById('payPeriod').value || 'December 2026';
  const [monthName, yearStr] = period.split(' ');
  const year = parseInt(yearStr) || 2026;
  const monthNum = MONTHS.indexOf(monthName) + 1;
  const isDec = /^december/i.test(monthName);
  const titleEl = document.getElementById('payrollSummaryTitle');
  if (titleEl) titleEl.textContent = `📋 Payroll Summary — ${period}`;
  const emps = users.filter(u=>u.status==='Active' && (u.role==='Employee'||u.role==='Finance Officer'||u.role==='System Admin'));
  tbody.innerHTML = emps.map(emp => {
    const h = empHrsOrAbs(emp);
    const base = empGrossPay(emp);
    const bonuses = activeBonusTypes(emp, base, periodEndDate(period));
    const { deMinimisSum, taxableSum } = splitBonuses(bonuses);
    const gross = base + taxableSum;
    const thirteenth = isDec && isThirteenthActive() && thirteenthEligibility(emp, year).eligible ? computeThirteenth(emp, year) : 0;
    const taxable13 = splitBonusTaxable(thirteenth, taxableSum).taxable13;
    const d = computeDeductions(gross, getEmpCashAdvance(emp.id), 0);
    const tTax = thirteenthTaxSplit(d, gross, taxable13);
    const rec = payrollRecords.find(r=>r.empId===emp.id && r.month===monthNum && r.year===year);
    const status = rec
      ? `<span class="badge b-green">✓ Released ${rec.date}</span>`
      : '<span class="badge b-yellow">Pending</span>';
    const grossTotal = gross + deMinimisSum + thirteenth;
    const net = d.net + deMinimisSum + thirteenth - tTax.annualTax;
    const thirteenCell = tTax.annualTax > 0
      ? `<span style="color:#C62828;font-weight:600" title="13th Month Excess Tax — withheld from the 13th Month Pay">${fmt(tTax.annualTax)}</span>`
      : '<span style="color:#BBB">—</span>';
    const bonusCell = bonuses.length
      ? '<span style="color:#2E7D32;font-weight:600" title="'+esc(bonuses.map(b=>b.name+': +'+fmt(b.amount)+(b.deMinimis?' (de minimis)':'')).join('\n'))+'">+'+fmt(taxableSum+deMinimisSum)+'</span>'
      : '<span style="color:#BBB">—</span>';
    return `<tr>
      <td><strong>${esc(displayName(emp))}</strong></td>
      <td><span class="badge ${EMP_CLASS[emp.classification].badge}">${emp.classification}</span></td>
      <td>${emp.classification==='Teaching' ? h.value+' hrs' : h.value+' days'}</td>
      <td>${fmt(grossTotal)}${thirteenth>0?' <span class="badge b-gold" style="font-size:9px">🎁 13th</span>':''}${taxableSum>0?` <span class="badge b-gold" style="font-size:9px">+bonus</span>`:''}${deMinimisSum>0?` <span class="badge b-green" style="font-size:9px">+de minimis</span>`:''}</td>
      <td>${bonusCell}</td>
      <td>${fmt(d.sss)}</td>
      <td>${fmt(d.phil)}</td>
      <td>${fmt(d.pag)}</td>
      <td>${fmt(d.bir)}</td>
      <td>${thirteenCell}</td>
      <td>${d.cash>0 ? '<span style="color:#C62828;font-weight:600">'+fmt(d.cash)+'</span>' : '—'}</td>
      <td>${d.customTotal>0 ? '<span style="color:#C62828;font-weight:600" title="'+esc(d.custom.map(x=>x.name+': '+fmt(x.amount)).join('  ·  '))+'">'+fmt(d.customTotal)+'</span>' : '—'}</td>
      <td><strong style="color:var(--maroon-dark)">${fmt(net)}</strong></td>
      <td>${status}</td>
    </tr>`;
  }).join('');
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Finance dashboard: recent payroll activity rendered live from active employees
// and the confirmed payroll records for the current pay period.
function renderFinRecentActivity() {
  const tbody = document.getElementById('finRecentActivityBody');
  if (!tbody) return;
  const period = document.getElementById('payPeriod')?.value || 'December 2026';
  const [monthName, yearStr] = period.split(' ');
  const year = parseInt(yearStr) || 2026;
  const monthNum = MONTHS.indexOf(monthName) + 1;
  const isDec = /^december/i.test(monthName);
  const emps = users.filter(u=>u.status==='Active' && (u.role==='Employee'||u.role==='Finance Officer'||u.role==='System Admin'));
  if (!emps.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px">No active employees yet.</td></tr>';
    return;
  }
  tbody.innerHTML = emps.map(emp => {
    const base = empGrossPay(emp);
    const bonuses = activeBonusTypes(emp, base, periodEndDate(period));
    const { deMinimisSum, taxableSum } = splitBonuses(bonuses);
    const gross = base + taxableSum;
    const thirteenth = isDec && isThirteenthActive() && thirteenthEligibility(emp, year).eligible ? computeThirteenth(emp, year) : 0;
    const taxable13 = splitBonusTaxable(thirteenth, taxableSum).taxable13;
    const d = computeDeductions(gross, getEmpCashAdvance(emp.id), 0);
    const tTax = thirteenthTaxSplit(d, gross, taxable13);
    const rec = payrollRecords.find(r=>r.empId===emp.id && r.month===monthNum && r.year===year);
    const net = d.net + deMinimisSum + thirteenth - tTax.annualTax;
    return `<tr>
      <td><strong>${esc(displayName(emp))}</strong></td>
      <td>${rec ? rec.period : period}</td>
      <td><strong style="color:var(--maroon-dark)">${fmt(net)}</strong></td>
      <td>${rec ? '<span class="badge b-green">✅ Released</span>' : '<span class="badge b-yellow">⏳ Pending</span>'}</td>
    </tr>`;
  }).join('');
}

// Payroll records for a given period — only CONFIRMED/released runs are reported,
// using the exact values stored at the time of release (not recomputed).
function getPayrollRecords(monthNum, yearNum) {
  return payrollRecords
    .filter(r => r.month === monthNum && r.year === yearNum)
    .map(rec => ({
      empId:  rec.empId,
      name:   rec.name,
      month:  rec.month,
      year:   rec.year,
      gross:  parseFloat(rec.gross) + (parseFloat(rec.deMinimisSum) || 0) + (parseFloat(rec.thirteenth) || 0),
      sss:    rec.sss,
      phil:   rec.phil,
      pag:    rec.pag,
      bir:    rec.bir,
      thirteenTax: parseFloat(rec.thirteenTax) || 0,
      net:    rec.net,
      status: 'Released'
    }));
}

// Months that have confirmed payroll records for a given year.
function reportMonthsFor(year) {
  return [...new Set(
    payrollRecords.filter(r => r.year === year).map(r => r.month)
  )].sort((a, b) => a - b);
}

// Confirmed payroll records for a given user + year, shaped for the payslip view.
// Uses the exact values stored at the time of release (not recomputed).
function payslipRecordsFor(userId, year) {
  return payrollRecords
    .filter(r => r.empId === userId && r.year === year)
    .sort((a, b) => a.month - b.month)
    .map(rec => ({
      monthNum:   rec.month,
      month:      MONTHS[rec.month - 1] || '',
      year:       rec.year,
      period:     `${MONTHS[rec.month - 1]} ${rec.year}`,
      gross:      parseFloat(rec.gross) + (parseFloat(rec.deMinimisSum) || 0) + (parseFloat(rec.thirteenth) || 0),
      deMinimis:  parseFloat(rec.deMinimisSum) || 0,
      thirteenth: parseFloat(rec.thirteenth) || 0,
      exempt13:   parseFloat(rec.thirteenExempt) || 0,
      taxable13:  parseFloat(rec.thirteenTaxable) || 0,
      thirteenTax:parseFloat(rec.thirteenTax) || 0,
      sss:  rec.sss,
      phil: rec.phil,
      pag:  rec.pag,
      bir:  rec.bir,
      cash: parseFloat(rec.cash) || 0,
      customDeds: Array.isArray(rec.customDeds) ? rec.customDeds : [],
      customTotal: (Array.isArray(rec.customDeds) ? rec.customDeds : []).reduce((s, x) => s + (parseFloat(x.amount) || 0), 0),
      net:  rec.net,
      status: 'Released'
    }));
}

// Years that have confirmed payroll records for a given user.
function payslipYearsFor(userId) {
  return [...new Set(
    payrollRecords.filter(r => r.empId === userId).map(r => r.year)
  )].sort((a, b) => a - b);
}

function showMonthReport(monthNum, year, monthName) {
  const out = document.getElementById('reportOutput');
  out.style.display = 'block';
  out.scrollIntoView({behavior:'smooth'});
  document.getElementById('reportTitle').textContent = `Payroll Summary Report — ${monthName} ${year}`;
  document.getElementById('rptHead').innerHTML = `<tr>
    <th>EMPLOYEE</th><th>TYPE</th><th>GROSS PAY</th><th>BONUS</th><th>SSS</th>
    <th>PHILHEALTH</th><th>PAG-IBIG</th><th>BIR</th><th>NET PAY</th><th>STATUS</th>
  </tr>`;

  const employees = users.filter(u => u.salary > 0 && u.status === 'Active');
  if (!employees.length) {
    document.getElementById('rptBody').innerHTML = '';
    document.getElementById('rptEmpty').style.display = 'block';
    document.getElementById('rptTotals').innerHTML = '';
    return;
  }
  document.getElementById('rptEmpty').style.display = 'none';

  const records = getPayrollRecords(monthNum, year);
  const rows = records.filter(r => employees.some(u => u.id === r.empId));
  if (!rows.length) {
    document.getElementById('rptBody').innerHTML = '';
    document.getElementById('rptEmpty').style.display = 'block';
    document.getElementById('rptTotals').innerHTML = '';
    return;
  }
  document.getElementById('rptEmpty').style.display = 'none';
  let tGross=0, tBonus=0, tSSS=0, tPhil=0, tPag=0, tBIR=0, tNet=0;
  document.getElementById('rptBody').innerHTML = rows.map(r => {
    const emp = employees.find(u => u.id === r.empId);
    const birTotal = r.bir + (r.thirteenTax || 0);
    const recBonuses = Array.isArray(r.bonuses) ? r.bonuses : [];
    const bTotal = recBonuses.reduce((s,b)=>s+(parseFloat(b.amount)||0),0);
    const bonusCell = bTotal > 0
      ? '<span style="color:#2E7D32;font-weight:600" title="'+esc(recBonuses.map(b=>b.name+': +'+fmt(b.amount)).join('\n'))+'">+'+fmt(bTotal)+'</span>'
      : '<span style="color:#BBB">—</span>';
    tGross+=r.gross; tBonus+=bTotal; tSSS+=r.sss; tPhil+=r.phil;
    tPag+=r.pag; tBIR+=birTotal; tNet+=r.net;
    return `<tr>
      <td><strong>${emp ? esc(displayName(emp)) : esc(r.name)}</strong></td>
      <td><span class="badge ${EMP_CLASS[emp?.classification]?.badge||'b-gray'}">${emp?.classification||'Non-Teaching'}</span></td>
      <td>${fmt(r.gross)}</td>
      <td>${bonusCell}</td>
      <td>${fmt(r.sss)}</td>
      <td>${fmt(r.phil)}</td>
      <td>${fmt(r.pag)}</td>
      <td>${fmt(birTotal)}</td>
      <td><strong style="color:var(--maroon-dark)">${fmt(r.net)}</strong></td>
      <td><span class="badge b-green">Released</span></td>
    </tr>`;
  }).join('');

  document.getElementById('rptTotals').innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:13px">
      <span><strong>Total Gross:</strong> ${fmt(tGross)}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Total Bonus:</strong> ${fmt(tBonus)}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Total SSS:</strong> ${fmt(tSSS)}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Total PhilHealth:</strong> ${fmt(tPhil)}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Total Pag-IBIG:</strong> ${fmt(tPag)}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Total BIR:</strong> ${fmt(tBIR)}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Total Deductions:</strong> ${fmt(tSSS+tPhil+tPag+tBIR)}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Total Net Pay: <span style="color:var(--maroon-dark)">${fmt(tNet)}</span></strong></span>
    </div>`;
}

function showYearReport(year) {
  const out = document.getElementById('reportOutput');
  out.style.display = 'block';
  out.scrollIntoView({behavior:'smooth'});

  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const dataMonths = reportMonthsFor(year);

  document.getElementById('reportTitle').textContent = `Payroll Summary Report — Full Year ${year}`;
  document.getElementById('rptHead').innerHTML = `<tr>
    <th>EMPLOYEE</th>
    ${MONTHS_SHORT.map((m, i) => {
      const hasMonth = dataMonths.includes(i + 1);
      return `<th style="color:${hasMonth ? 'inherit' : '#BBB'}">${m}</th>`;
    }).join('')}
    <th>TOTAL NET PAY</th>
  </tr>`;

  const employees = users.filter(u => u.salary > 0 && u.status === 'Active');

  if (!employees.length || !dataMonths.length) {
    document.getElementById('rptBody').innerHTML = '';
    document.getElementById('rptEmpty').style.display = 'block';
    document.getElementById('rptTotals').innerHTML = '';
    return;
  }
  document.getElementById('rptEmpty').style.display = 'none';

  const recordsByMonth = {};
  dataMonths.forEach(monthNum => {
    recordsByMonth[monthNum] = getPayrollRecords(monthNum, year);
  });

  let grandYTD = 0;
  document.getElementById('rptBody').innerHTML = employees.map(emp => {
    let empYTD = 0;
    const monthlyCells = MONTHS_SHORT.map((m, i) => {
      const monthNum = i + 1;
      const rec = (recordsByMonth[monthNum] || []).find(r => r.empId === emp.id);
      if (rec) {
        empYTD += rec.net;
        return `<td style="font-size:12px">${fmt(rec.net)}</td>`;
      }
      return `<td style="font-size:12px;color:#CCC">—</td>`;
    }).join('');
    grandYTD += empYTD;
    return `<tr>
      <td>
        <strong>${emp.first} ${emp.last}</strong><br/>
        <span style="font-size:11px;color:#999">${emp.role}</span>
      </td>
      ${monthlyCells}
      <td><strong style="color:var(--maroon-dark)">${fmt(empYTD)}</strong></td>
    </tr>`;
  }).join('');

  const processedCount = dataMonths.length;
  const monthNames = dataMonths.map(n => MONTHS_FULL[n - 1]);
  const isComplete = processedCount === 12;
  const netLabel = isComplete
    ? 'Annual Net Pay'
    : `Total Net Pay (${monthNames.join(', ')} ${year})`;
  document.getElementById('rptTotals').innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:13px;align-items:center">
      <span><strong>Year:</strong> ${year}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Months Processed:</strong>
        <span style="color:var(--maroon-dark)">${processedCount}</span>
        <span style="color:#AAA"> / 12</span>
      </span>
      <span style="color:#CCC">|</span>
      <span><strong>Total Employees:</strong> ${employees.length}</span>
      <span style="color:#CCC">|</span>
      <span><strong>${netLabel}:
        <span style="color:var(--maroon-dark)">${fmt(grandYTD)}</span>
      </strong></span>
      ${!isComplete ? `
        <span style="color:#CCC">|</span>
        <span style="color:#888;font-style:italic">${12 - processedCount} months remaining</span>
      ` : ''}
    </div>`;
}
