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
let monthlyAtt = {}; // per-employee attendance: { id: { hours, absences } }
let cashAdvances = (_savedDemo && _savedDemo.cashAdvances) || {}; // per-employee cash advance: { id: amount }
// Payroll runs confirmed from the calculator (persisted). { empId, period, month, year, gross, sss, phil, pag, bir, cash, thirteenth, net, date }
let payrollRecords = (_savedDemo && _savedDemo.payrollRecords) || [];
// 13th-month payout tracking: { empId_year: { date } }
let bonusPayouts = (_savedDemo && _savedDemo.bonusPayouts) || {};

// ── PAYSLIP DATA ─────────────────────────────────────────────
const payslips = [
  {period:'April 2026',   gross:28500, sss:1425.00, phil:712.50, pag:100, bir:814.38, net:25448.12, status:'Pending'},
  {period:'March 2026',   gross:28500, sss:1425.00, phil:712.50, pag:100, bir:814.38, net:25448.12, status:'Released'},
  {period:'February 2026',gross:28500, sss:1425.00, phil:712.50, pag:100, bir:814.38, net:25448.12, status:'Released'},
  {period:'January 2026', gross:28500, sss:1425.00, phil:712.50, pag:100, bir:814.38, net:25448.12, status:'Released'},
  {period:'December 2025',gross:28500, sss:1425.00, phil:712.50, pag:100, bir:814.38, net:25448.12, status:'Released'},
];

// ── PAYROLL RECORDS (per employee per month) ─────────────────
// Employee classification helpers
const EMP_CLASS = { Teaching: {badge:'b-blue'}, 'Non-Teaching': {badge:'b-gold'} };
function empGrossPay(emp, hours, absences) {
  if (emp.classification === 'Teaching') {
    const h = (hours != null && hours !== '') ? parseFloat(hours) : (emp.hoursWorked || 0);
    const r = parseFloat(emp.hourlyRate) || 0;
    return parseFloat((h * r).toFixed(2));
  }
  const base = parseFloat(emp.salary) || 0;
  const a = (absences != null && absences !== '') ? parseFloat(absences) : (emp.absenceDays || 0);
  return parseFloat((base - (a / 22) * base).toFixed(2));
}
function empHrsOrAbs(emp) {
  return emp.classification === 'Teaching'
    ? { label:'Hours Worked', unit:'hrs',  value: emp.hoursWorked || 0 }
    : { label:'Absences',     unit:'days', value: emp.absenceDays || 0 };
}
function getEmpCashAdvance(id) { return parseFloat(cashAdvances[id]) || 0; }

// RA 10963 (TRAIN) / CREATE Act: 13th month pay + other bonuses are exempt
// from income tax only up to ₱90,000 per year; the excess is taxable income.
const BONUS_EXEMPTION_LIMIT = 90000;
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

// BIR annual withholding (TRAIN Law brackets)
function annualBIR(annual) {
  if      (annual <= 250000)              return 0;
  else if (annual <= 400000)              return (annual - 250000) * 0.15;
  else if (annual <= 800000)              return 22500  + (annual - 400000)  * 0.20;
  else if (annual <= 2000000)             return 102500 + (annual - 800000)  * 0.25;
  else if (annual <= 8000000)             return 402500 + (annual - 2000000) * 0.30;
  else                                     return 2202500 + (annual - 8000000) * 0.35;
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

// Helper: compute deductions
function computeDeductions(gross, cashAdv, extraAnnual) {
  const salary = Math.max(0, parseFloat(gross) || 0);
  // SSS — 2025 schedule (RA 11199, Circular 2024-006): Employee share is read
  // from the editable sssTable brackets (MSC ₱5,000–₱35,000, 5% employee share)
  function num(txt) { return parseFloat(String(txt).replace(/[^\d.]/g, '')) || 0; }
  function getSSS(s) {
    for (const row of sssTable) {
      const r = row.range;
      if (r.indexOf('Below') === 0) {
        if (s < num(r)) return row.emp;
      } else if (r.indexOf('–') > -1) {
        const parts = r.split('–');
        if (s >= num(parts[0]) && s < num(parts[1])) return row.emp;
      } else {
        if (s >= num(r)) return row.emp;
      }
    }
    return sssTable[sssTable.length - 1].emp;
  }
  // PhilHealth — 5% of basic (2.5% employee share), total premium min ₱500 max ₱5,000
  function getPhil(s) {
    const total = Math.min(philData.max, Math.max(philData.min, s * philData.rate / 100));
    return parseFloat((total / 2).toFixed(2));
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
  const net  = parseFloat((salary - sss - phil - pag - bir - cash).toFixed(2));
  return { sss, phil, pag, bir, cash, gross: salary, net };
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
    ? list.map(u=>`<div class="combobox-item" onclick="selectCalcEmp(${u.id})">${u.first} ${u.last} — ${u.classification}${u.department?' · '+u.department:''}</div>`).join('')
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
  if (inp) inp.value = `${emp.first} ${emp.last} — ${emp.classification}${emp.department?' · '+emp.department:''}`;
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
  updateCalc13thState();
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
  document.getElementById('calcMetaName').textContent = `${emp.first} ${emp.last}`;
  document.getElementById('calcMetaClass').textContent = emp.classification;
  document.getElementById('calcMetaDept').textContent = emp.department || '—';
  meta.style.display = 'block';
  document.getElementById('calcGrossFieldLabel').textContent = isTeaching ? 'Hourly Rate (₱)' : 'Monthly Base Salary (₱)';
  document.getElementById('calcAttLabel').textContent = isTeaching ? 'Hours Worked' : 'Absences (days, ÷22)';
  salEl.value = isTeaching ? (emp.hourlyRate||'') : (emp.salary||'');
  attEl.value = isTeaching ? (emp.hoursWorked||'') : (emp.absenceDays||0);
  cashEl.value = getEmpCashAdvance(emp.id) || '';
  empty.style.display = 'none';
  res.style.display = 'block';
  computePayroll();
}

// Holds the last computed payroll so "Confirm & Generate Payslip" can store it
let lastCalc = null;

// Active configurable bonus types (excl. statutory 13th month, id=1) applied to earnings
function activeBonusTypes(emp, baseGross) {
  return bonusTypes
    .filter(b => b.status === 'Active' && b.id !== 1)
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
    const h = parseFloat(attEl.value) || 0;
    const r = parseFloat(rateEl.value) || 0;
    gross = parseFloat((h * r).toFixed(2));
    meta = `${h} hrs × ₱${r.toLocaleString('en-PH',{minimumFractionDigits:2})} = ${fmt(gross)}`;
  } else {
    const base = parseFloat(rateEl.value) || 0;
    const a = parseFloat(attEl.value) || 0;
    gross = parseFloat((base - (a/22)*base).toFixed(2));
    meta = `₱${base.toLocaleString('en-PH',{minimumFractionDigits:2})} − (${a}/22) = ${fmt(gross)}`;
  }

  // Active bonus types (excl. the statutory 13th month, id=1) are added to gross.
  // De minimis benefits (BIR RR 11-2018) are tax-exempt & excluded from the ₱90k pool and contributions.
  const bonuses = activeBonusTypes(emp, gross);
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
  const cash = parseFloat(cashEl.value) || 0;
  cashAdvances[emp.id] = cash;
  saveDemo();
  // Taxable 13th month excess is a one-time annual amount added to the BIR annualization
  const d = computeDeductions(grossTaxable, cash, 0);
  const tTax = thirteenthTaxSplit(d, grossTaxable, thirteenSplit.taxable13);
  // Annual BIR tax caused by the taxable 13th month excess (₱0 when fully exempt ≤₱90,000)
  const thirteenTaxAmt = tTax.annualTax;
  let note13 = '';
  if (isDec && use13th && !el13.eligible) {
    note13 = '<div style="font-size:12px;color:#C62828;margin-top:8px;background:#FFEBEE;border:1px solid #F5C6C6;border-radius:8px;padding:8px 10px">⚠️ '+emp.first+' <strong>rendered no service</strong> in '+year+', so no basic salary was earned — no 13th Month Pay under RA 8515 / DOLE.</div>';
  } else if (!isDec) {
    note13 = '<div style="font-size:12px;color:var(--text-muted);margin-top:8px;background:#F5F0EA;border:1px solid var(--border);border-radius:8px;padding:8px 10px">💡 13th Month Pay applies only to the <strong>December</strong> payroll run per RA 8515 / DOLE. Select December as the pay period to include it.</div>';
  } else if (thirteenSplit.taxable13 > 0) {
    note13 = '<div style="font-size:12px;color:#C62828;margin-top:8px;background:#FFEBEE;border:1px solid #F5C6C6;border-radius:8px;padding:8px 10px">⚠️ 13th Month Pay + taxable bonuses exceed the <strong>₱90,000 annual exemption</strong> (RA 10963 / CREATE Act). Exempt: <strong>'+fmt(thirteenSplit.exempt13)+'</strong> · Taxable excess: <strong>'+fmt(thirteenSplit.taxable13)+'</strong><br>🧾 <strong>13th Month Excess Tax: '+fmt(thirteenTaxAmt)+'</strong> — this is withheld in full from your December 13th Month Pay.</div>';
  }

  const grossTotal = grossTaxable + deMinimisSum + thirteenth;
  const net = parseFloat((d.net + deMinimisSum + thirteenth - tTax.annualTax).toFixed(2));
  lastCalc = {
    empId: emp.id, name:`${emp.first} ${emp.last}`, month:MONTHS.indexOf(monthName)+1, monthName, year, period,
    gross: grossTaxable, deMinimisSum, thirteenth, thirteenTaxable: thirteenSplit.taxable13, thirteenExempt: thirteenSplit.exempt13, thirteenTax: tTax.annualTax, net, sss:d.sss, phil:d.phil, pag:d.pag, bir:d.bir, cash, bonuses
  };

  document.getElementById('calcEarnings').innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F0EA;font-size:13.5px"><span style="color:var(--text-muted)">${emp.classification==='Teaching'?'Hours Worked × Rate':'Monthly Base Salary'}</span><span style="font-weight:600">${meta}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F0EA;font-size:13.5px"><span style="color:var(--text-muted)">${emp.classification==='Teaching'?'Hourly Earnings':'Base Salary'}</span><span style="font-weight:600">${fmt(gross)}</span></div>
    ${bonuses.map(b=>'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F0EA;font-size:13.5px"><span style="color:var(--text-muted)">🎁 '+b.name+' <span style="font-size:11px;color:'+(b.deMinimis?'#2E7D32':'var(--text-muted)')+'">— '+(b.deMinimis?'de minimis (tax-exempt)':'taxable bonus')+'</span></span><span style="font-weight:600">+'+fmt(b.amount)+'</span></div>').join('')}
    ${thirteenth>0 ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F0EA;font-size:13.5px"><span style="color:var(--text-muted)">🎁 13th Month Pay (RA 8515) <span style="font-size:11px;color:#2E7D32">— exempt up to ₱90,000/yr</span></span><span style="font-weight:700;color:var(--maroon-dark)">+'+fmt(thirteenSplit.exempt13)+'</span></div>' : ''}
    ${thirteenth>0 && thirteenSplit.taxable13>0 ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F0EA;font-size:13.5px"><span style="color:var(--text-muted)">⚠️ 13th Month excess <span style="font-size:11px;color:#C62828">— taxable (over ₱90,000)</span></span><span style="font-weight:600;color:#C62828">+'+fmt(thirteenSplit.taxable13)+'</span></div>' : ''}
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
  document.getElementById('rTotDed').textContent = fmt(d.sss + d.phil + d.pag + d.bir + d.cash + tTax.annualTax);
  document.getElementById('rNetPay').textContent = fmt(net);
}

function confirmPayroll() {
  if (!lastCalc || !users.find(u=>u.id===lastCalc.empId)) { showToast('⚠️','Select an employee and compute the payroll first.'); return; }
  const rec = Object.assign({}, lastCalc, {
    date: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
  });
  const existing = payrollRecords.find(r=>r.empId===rec.empId && r.month===rec.month && r.year===rec.year);
  if (existing) Object.assign(existing, rec);
  else payrollRecords.push(rec);
  saveDemo();
  renderPayrollSummary();
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
    const bonuses = activeBonusTypes(emp, base);
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
    return `<tr>
      <td><strong>${emp.first} ${emp.last}</strong></td>
      <td><span class="badge ${EMP_CLASS[emp.classification].badge}">${emp.classification}</span></td>
      <td>${emp.classification==='Teaching' ? h.value+' hrs' : h.value+' days'}</td>
      <td>${fmt(grossTotal)}${thirteenth>0?' <span class="badge b-gold" style="font-size:9px">🎁 13th</span>':''}${taxableSum>0?` <span class="badge b-gold" style="font-size:9px">+bonus</span>`:''}${deMinimisSum>0?` <span class="badge b-green" style="font-size:9px">+de minimis</span>`:''}</td>
      <td>${fmt(d.sss)}</td>
      <td>${fmt(d.phil)}</td>
      <td>${fmt(d.pag)}</td>
      <td>${fmt(d.bir)}</td>
      <td>${thirteenCell}</td>
      <td>${d.cash>0 ? '<span style="color:#C62828;font-weight:600">'+fmt(d.cash)+'</span>' : '—'}</td>
      <td><strong style="color:var(--maroon-dark)">${fmt(net)}</strong></td>
      <td>${status}</td>
    </tr>`;
  }).join('');
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Build payroll records for all employees for a given period (uses confirmed runs when available)
function getPayrollRecords(monthNum, yearNum) {
  const monthName = MONTHS[monthNum - 1] || '';
  const isDec = monthName === 'December';
  const stored = payrollRecords.filter(r=>r.month===monthNum && r.year===yearNum);
  const employees = users.filter(u => u.role === 'Employee' || u.role === 'Finance Officer' || u.role === 'System Admin');
  return employees.map(emp => {
    const rec = stored.find(r=>r.empId===emp.id);
    if (rec) {
      const cash = parseFloat(rec.cash) || 0;
      const thirteenth = parseFloat(rec.thirteenth) || 0;
      const deMinimisSum = parseFloat(rec.deMinimisSum) || 0;
      const d = computeDeductions(rec.gross, cash, 0);
      const thirteenTax = rec.thirteenTax != null
        ? parseFloat(rec.thirteenTax)
        : bonusAnnualTax(taxableMonthlyOf(rec.gross, d), splitBonusTaxable(thirteenth, 0).taxable13);
      return { name:`${emp.first} ${emp.last}`, month:monthNum, year:yearNum, gross:rec.gross + deMinimisSum + thirteenth, sss:d.sss, phil:d.phil, pag:d.pag, bir:d.bir, thirteenTax, net:parseFloat((d.net + deMinimisSum + thirteenth - thirteenTax).toFixed(2)), status:'Released' };
    }
    const base = empGrossPay(emp);
    const bonuses = activeBonusTypes(emp, base);
    const { deMinimisSum, taxableSum } = splitBonuses(bonuses);
    const grossTaxable = base + taxableSum;
    const thirteenth = isDec && isThirteenthActive() && thirteenthEligibility(emp, yearNum).eligible ? computeThirteenth(emp, yearNum) : 0;
    const taxable13 = splitBonusTaxable(thirteenth, taxableSum).taxable13;
    const d = computeDeductions(grossTaxable, getEmpCashAdvance(emp.id), 0);
    const thirteenTax = bonusAnnualTax(taxableMonthlyOf(grossTaxable, d), taxable13);
    return {
      name:   `${emp.first} ${emp.last}`,
      month:  monthNum,
      year:   yearNum,
      gross:  grossTaxable + deMinimisSum + thirteenth,
      sss:    d.sss,
      phil:   d.phil,
      pag:    d.pag,
      bir:    d.bir,
      thirteenTax,
      net:    parseFloat((d.net + deMinimisSum + thirteenth - thirteenTax).toFixed(2)),
      status: 'Released'
    };
  });
}

function initReportView() {
  document.getElementById('reportSelector').style.display = 'block';
  document.getElementById('reportOutput').style.display   = 'none';
  document.getElementById('rptYear').value = '';
  const monthEl = document.getElementById('rptMonth');
  if (monthEl) { monthEl.value=''; monthEl.disabled=true; monthEl.style.opacity='0.4'; }
  document.getElementById('reportSelector').scrollIntoView({behavior:'smooth'});
}

function renderMonthButtons() {
  const year = parseInt(document.getElementById('rptYear').value);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fullMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  // Determine which months have data — for demo, Jan-May 2026 have data
  const hasData = {
    2024: [1,2,3,4,5,6,7,8,9,10,11,12],
    2025: [1,2,3,4,5,6,7,8,9,10,11,12],
    2026: [1,2,3,4,5],  // Jan-May 2026
  };
  const dataMonths = hasData[year] || [];
  const container = document.getElementById('monthButtons');
  // Full Year button
  const yearBtn = `<button
    onclick="showYearReport(${year})"
    style="padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;
      border:2px solid #27AE60;background:#27AE60;color:#fff;transition:all 0.2s">
    📅 Full Year ${year}
  </button>
  <div style="width:1px;background:#DDD;margin:0 4px"></div>`;

  const monthBtns = months.map((m, i) => {
    const monthNum = i + 1;
    const active = dataMonths.includes(monthNum);
    return `<button
      onclick="showMonthReport(${monthNum}, ${year}, '${fullMonths[i]}')"
      style="padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;cursor:${active?'pointer':'not-allowed'};
        border:2px solid ${active?'var(--maroon-dark)':'#DDD'};
        background:${active?'var(--maroon-dark)':'#F5F5F5'};
        color:${active?'#fff':'#BBB'};
        transition:all 0.2s;
        opacity:${active?1:0.5}"
      ${!active?'disabled':''}>
      ${m}
    </button>`;
  }).join('');

  container.innerHTML = yearBtn + monthBtns;
}

function showMonthReport(monthNum, year, monthName) {
  const out = document.getElementById('reportOutput');
  out.style.display = 'block';
  out.scrollIntoView({behavior:'smooth'});
  document.getElementById('reportTitle').textContent = `Payroll Summary Report — ${monthName} ${year}`;
  document.getElementById('rptHead').innerHTML = `<tr>
    <th>EMPLOYEE</th><th>TYPE</th><th>GROSS PAY</th><th>SSS</th>
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
  const rows = records.filter(r => employees.some(u => `${u.first} ${u.last}` === r.name));
  let tGross=0, tSSS=0, tPhil=0, tPag=0, tBIR=0, tNet=0;
  document.getElementById('rptBody').innerHTML = rows.map(r => {
    const emp = employees.find(u => `${u.first} ${u.last}` === r.name);
    const birTotal = r.bir + (r.thirteenTax || 0);
    tGross+=r.gross; tSSS+=r.sss; tPhil+=r.phil;
    tPag+=r.pag; tBIR+=birTotal; tNet+=r.net;
    return `<tr>
      <td><strong>${r.name}</strong></td>
      <td><span class="badge ${EMP_CLASS[emp?.classification]?.badge||'b-gray'}">${emp?.classification||'Non-Teaching'}</span></td>
      <td>${fmt(r.gross)}</td>
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

// keep for compatibility
function showReport(type) {
  initReportView();
}

function UNUSED_showReport_old(type) {
  const out    = document.getElementById('reportOutput');
  const monthVal = 4;
  const yearVal  = 2026;
  const isYearOnly = false;

  out.style.display = 'block';
  out.scrollIntoView({behavior:'smooth'});

  if (isYearOnly) {
    // ── YEAR MODE: Show Jan–Dec summary ──────────────────────
    document.getElementById('reportTitle').textContent = `Payroll Summary Report — ${yearVal}`;
    document.getElementById('rptHead').innerHTML = `<tr>
      <th>EMPLOYEE</th>
      <th>JAN</th><th>FEB</th><th>MAR</th><th>APR</th>
      <th>MAY</th><th>JUN</th><th>JUL</th><th>AUG</th>
      <th>SEP</th><th>OCT</th><th>NOV</th><th>DEC</th>
      <th>ANNUAL NET</th>
    </tr>`;

    const employees = users.filter(u => u.role === 'Employee' || u.role === 'Finance Officer');
    let grandTotal = 0;

    document.getElementById('rptBody').innerHTML = employees.map(emp => {
      const d = computeDeductions(emp.salary);
      const annualNet = d.net * 12;
      grandTotal += annualNet;
      const monthlyNet = fmt(d.net);
      const cells = Array(12).fill(`<td>${monthlyNet}</td>`).join('');
      return `<tr>
        <td><strong>${emp.first} ${emp.last}</strong><br/><span style="font-size:11px;color:#999">${emp.role}</span></td>
        ${cells}
        <td><strong style="color:var(--maroon-dark)">${fmt(annualNet)}</strong></td>
      </tr>`;
    }).join('');

    document.getElementById('rptTotals').innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:13px">
        <span><strong>Year:</strong> ${yearVal}</span>
        <span>|</span>
        <span><strong>Total Employees:</strong> ${employees.length}</span>
        <span>|</span>
        <span><strong>Total Annual Net Pay:</strong> <strong style="color:var(--maroon-dark)">${fmt(grandTotal)}</strong></span>
      </div>`;

  } else {
    // ── MONTH MODE: Show specific month ──────────────────────
    const monthName = MONTHS[monthVal - 1];
    document.getElementById('reportTitle').textContent = `Payroll Summary Report — ${monthName} ${yearVal}`;
    document.getElementById('rptHead').innerHTML = `<tr>
      <th>EMPLOYEE</th><th>GROSS PAY</th><th>SSS</th>
      <th>PHILHEALTH</th><th>PAG-IBIG</th><th>BIR</th>
      <th>NET PAY</th><th>STATUS</th>
    </tr>`;

    const records = getPayrollRecords(monthVal, yearVal);
    let tGross=0, tSSS=0, tPhil=0, tPag=0, tBIR=0, tNet=0;

    document.getElementById('rptBody').innerHTML = records.map(r => {
      tGross += r.gross; tSSS += r.sss; tPhil += r.phil;
      tPag   += r.pag;  tBIR  += r.bir; tNet  += r.net;
      return `<tr>
        <td><strong>${r.name}</strong></td>
        <td>${fmt(r.gross)}</td>
        <td>${fmt(r.sss)}</td>
        <td>${fmt(r.phil)}</td>
        <td>${fmt(r.pag)}</td>
        <td>${fmt(r.bir)}</td>
        <td><strong style="color:var(--maroon-dark)">${fmt(r.net)}</strong></td>
        <td><span class="badge b-green">✅ ${r.status}</span></td>
      </tr>`;
    }).join('');

    document.getElementById('rptTotals').innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:13px">
        <span><strong>Total Gross:</strong> ${fmt(tGross)}</span>
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
}
function showYearReport(year) {
  const out = document.getElementById('reportOutput');
  out.style.display = 'block';
  out.scrollIntoView({behavior:'smooth'});

  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Months with actual data per year
  const hasData = {
    2024: [1,2,3,4,5,6,7,8,9,10,11,12],
    2025: [1,2,3,4,5,6,7,8,9,10,11,12],
    2026: [1,2,3,4,5],
  };
  const dataMonths = hasData[year] || [];

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

  if (!employees.length) {
    document.getElementById('rptBody').innerHTML = '';
    document.getElementById('rptEmpty').style.display = 'block';
    document.getElementById('rptTotals').innerHTML = '';
    return;
  }
  document.getElementById('rptEmpty').style.display = 'none';

  let grandYTD = 0;
  document.getElementById('rptBody').innerHTML = employees.map(emp => {
    const base = empGrossPay(emp);
    const bonuses = activeBonusTypes(emp, base);
    const { deMinimisSum, taxableSum } = splitBonuses(bonuses);
    const gross = base + taxableSum;
    const d = computeDeductions(gross);
    const thirteenth = isThirteenthActive() && thirteenthEligibility(emp, year).eligible ? computeThirteenth(emp, year) : 0;
    const taxable13 = splitBonusTaxable(thirteenth, taxableSum).taxable13;
    const decNet = d.net + deMinimisSum + thirteenth - bonusAnnualTax(taxableMonthlyOf(gross, d), taxable13);
    const decProcessed = dataMonths.includes(12);
    const ytdNet = parseFloat((d.net * (dataMonths.length - (decProcessed?1:0)) + (decProcessed?decNet:0)).toFixed(2));  // Only sum processed months
    grandYTD += ytdNet;
    const monthlyCells = MONTHS_SHORT.map((m, i) => {
      const monthNum = i + 1;
      const processed = dataMonths.includes(monthNum);
      return processed
        ? `<td style="font-size:12px">${monthNum === 12 ? fmt(decNet) : fmt(d.net)}</td>`
        : `<td style="font-size:12px;color:#CCC">—</td>`;
    }).join('');
    return `<tr>
      <td>
        <strong>${emp.first} ${emp.last}</strong><br/>
        <span style="font-size:11px;color:#999">${emp.role}</span>
      </td>
      ${monthlyCells}
      <td><strong style="color:var(--maroon-dark)">${fmt(ytdNet)}</strong></td>
    </tr>`;
  }).join('');

  const processedCount = dataMonths.length;
  const totalMonths = 12;
  const isComplete = processedCount === totalMonths;
  const netLabel = isComplete ? 'Annual Net Pay' : `Total Net Pay (Jan–${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][processedCount-1]} ${year})`;
  document.getElementById('rptTotals').innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:13px;align-items:center">
      <span><strong>Year:</strong> ${year}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Months Processed:</strong>
        <span style="color:var(--maroon-dark)">${processedCount}</span>
        <span style="color:#AAA"> / ${totalMonths}</span>
      </span>
      <span style="color:#CCC">|</span>
      <span><strong>Total Employees:</strong> ${employees.length}</span>
      <span style="color:#CCC">|</span>
      <span><strong>${netLabel}:
        <span style="color:var(--maroon-dark)">${fmt(grandYTD)}</span>
      </strong></span>
      ${!isComplete ? `
        <span style="color:#CCC">|</span>
        <span style="color:#888;font-style:italic">${totalMonths - processedCount} months remaining</span>
      ` : ''}
    </div>`;
}
