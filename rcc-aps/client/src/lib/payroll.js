// ── PAYROLL COMPUTATION (ported from public/js/payroll.js — math unchanged) ──
// All functions are pure — no DOM access. They operate on state objects passed in.
export { fmt, esc } from './utils.js';

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const HOURS_PER_DAY = 8;

// ── LEAVE HELPERS ─────────────────────────────────────────────
export function getLeaveBreakdown(empId, monthNum, year, leaveRecords, leaveTypes) {
  const empRecords = leaveRecords.filter(r => r.empId === empId);
  const breakdown = {};
  let totalUnpaidDays = 0;
  let totalPaidDays = 0;

  empRecords.forEach(record => {
    const start = new Date(record.startDate);
    const end = new Date(record.endDate);
    const recMonth = start.getMonth() + 1;
    const recYear = start.getFullYear();

    if (recMonth === monthNum && recYear === year) {
      const leaveType = leaveTypes.find(lt => lt.id === record.typeId);
      if (!leaveType) return;
      const days = record.days || Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      if (!breakdown[leaveType.name]) {
        breakdown[leaveType.name] = { name: leaveType.name, isPaid: leaveType.isPaid, days: 0 };
      }
      breakdown[leaveType.name].days += days;

      if (leaveType.isPaid) totalPaidDays += days;
      else totalUnpaidDays += days;
    }
  });

  return { breakdown: Object.values(breakdown), totalPaidDays, totalUnpaidDays };
}

export function getPeriodWorkingDays(monthNum, year) {
  const days = [];
  const last = new Date(year, monthNum, 0).getDate();
  for (let d = 1; d <= last; d++) {
    const dow = new Date(year, monthNum - 1, d).getDay();
    if (dow >= 1 && dow <= 5) days.push(d);
  }
  return days;
}

export function attendanceRecordHours(r) {
  if (r.hours != null) return parseFloat(r.hours) || 0;
  const a = new Date(r.clockInAt).getTime();
  const b = new Date(r.clockOutAt).getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  let diff = (b - a) / 3600000;
  if (diff < 0) diff += 24;
  return Math.max(0, Math.round(diff * 100) / 100);
}

function getAttendanceDaySet(empId, attendance) {
  const s = new Set();
  attendance.forEach(r => { if (r.empId === empId && r.date) s.add(r.date); });
  return s;
}

function getLeaveCoveredDaySet(empId, monthNum, year, leaveRecords) {
  const s = new Set();
  leaveRecords.filter(r => r.empId === empId).forEach(rec => {
    const start = new Date(rec.startDate + 'T00:00:00');
    const end = new Date(rec.endDate + 'T00:00:00');
    const days = rec.days || Math.floor((end - start) / 86400000) + 1;
    for (let i = 0; i < days; i++) {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      if ((day.getMonth() + 1) === monthNum && day.getFullYear() === year) {
        s.add(day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0'));
      }
    }
  });
  return s;
}

export function getDetectedAbsences(empId, monthNum, year, attendance, leaveRecords) {
  const attDays = getAttendanceDaySet(empId, attendance);
  const leaveDays = getLeaveCoveredDaySet(empId, monthNum, year, leaveRecords);
  const workingDays = getPeriodWorkingDays(monthNum, year);
  let count = 0;
  workingDays.forEach(d => {
    const key = year + '-' + String(monthNum).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    if (!attDays.has(key) && !leaveDays.has(key)) count++;
  });
  return count;
}

export function getAttendanceHours(empId, monthNum, year, attendance) {
  const recs = attendance.filter(r =>
    r.empId === empId &&
    parseInt(String(r.date).slice(0, 4), 10) === year &&
    parseInt(String(r.date).slice(5, 7), 10) === monthNum
  );
  return recs.reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
}

// Total unpaid days for the payroll = unpaid leave days + detected absences.
export function totalUnpaidDays(empId, monthNum, year, state) {
  const { totalUnpaidDays: unpaid } = getLeaveBreakdown(empId, monthNum, year, (state && state.leaveRecords) || [], (state && state.leaveTypes) || []);
  return unpaid + getDetectedAbsences(empId, monthNum, year, (state && state.attendance) || [], (state && state.leaveRecords) || []);
}

// ── EMPLOYEE PAY ──────────────────────────────────────────────
export const EMP_CLASS = { Teaching: { badge: 'b-blue' }, 'Non-Teaching': { badge: 'b-gold' } };

export function empGrossPay(emp, hours, absences, workDays) {
  if (emp.classification === 'Teaching') {
    const h = Math.max(0, (hours != null && hours !== '') ? parseFloat(hours) : (emp.hoursWorked || 0));
    const r = Math.max(0, parseFloat(emp.hourlyRate) || 0);
    return parseFloat((h * r).toFixed(2));
  }
  const base = Math.max(0, parseFloat(emp.salary) || 0);
  const a = Math.max(0, (absences != null && absences !== '') ? parseFloat(absences) : (emp.absenceDays || 0));
  return parseFloat((base - (a / workDays) * base).toFixed(2));
}

export function empHrsOrAbs(emp) {
  return emp.classification === 'Teaching'
    ? { label: 'Hours Worked', unit: 'hrs', value: emp.hoursWorked || 0 }
    : { label: 'Absences', unit: 'days', value: emp.absenceDays || 0 };
}

// ── BONUS / 13TH MONTH (imported from bonus.js logic) ─────────
export function parseDate(str) {
  if (!str) return new Date(NaN);
  const d = new Date(str + 'T00:00:00');
  return isNaN(d) ? new Date(NaN) : d;
}

export function monthsEmployed(emp, year) {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const hire = parseDate(emp.hireDate);
  if (isNaN(hire)) return 12;
  const sep = parseDate(emp.endDate);
  const start = hire > yearStart ? hire : yearStart;
  const end = (!isNaN(sep) && sep < yearEnd) ? sep : yearEnd;
  if (start > end) return 0;
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  return Math.max(0, Math.min(12, months));
}

export function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

export function avgMonthlyPay(emp) {
  return emp.classification === 'Teaching' ? computeGrossFor(emp) : (parseFloat(emp.salary) || 0);
}

function computeGrossFor(emp) {
  const h = Math.max(0, parseFloat(emp.hoursWorked) || 0);
  const r = Math.max(0, parseFloat(emp.hourlyRate) || 0);
  return parseFloat((h * r).toFixed(2));
}

export function doleBasicSalaryEarned(emp, year, monthlyPay) {
  const hire = parseDate(emp.hireDate);
  if (isNaN(hire)) return 0;
  const sep = parseDate(emp.endDate);
  const monthly = (monthlyPay != null && !isNaN(monthlyPay))
    ? parseFloat(monthlyPay)
    : avgMonthlyPay(emp);
  let total = 0;
  for (let m = 0; m < 12; m++) {
    const mStart = new Date(year, m, 1);
    const mEnd = new Date(year, m + 1, 0);
    if (hire > mEnd) continue;
    if (!isNaN(sep) && sep <= mStart) continue;
    const s = hire > mStart ? hire : mStart;
    const e = (!isNaN(sep) && sep < mEnd) ? sep : mEnd;
    const workedDays = Math.max(0, (e.getDate() - s.getDate()) + 1);
    const frac = Math.min(1, workedDays / daysInMonth(year, m));
    total += monthly * frac;
  }
  return total;
}

export function thirteenthEligibility(emp, year) {
  const earned = doleBasicSalaryEarned(emp, year);
  if (earned <= 0) return { eligible: false, type: 'none', months: 0, badge: 'b-gray', label: 'No service this year' };
  const months = monthsEmployed(emp, year);
  if (months >= 12) return { eligible: true, type: 'full', months: 12, badge: 'b-green', label: 'Full year' };
  return { eligible: true, type: 'prorated', months: months, badge: 'b-yellow', label: 'Prorated ' + months + ' mo.' };
}

export function computeThirteenth(emp, year, monthlyPay) {
  const earned = doleBasicSalaryEarned(emp, year, monthlyPay);
  return parseFloat((earned / 12).toFixed(2));
}

// Split bonuses into de minimis and taxable
export function splitBonuses(bonuses) {
  const deMinimisSum = bonuses.filter(b => b.deMinimis).reduce((s, b) => s + b.amount, 0);
  const taxableSum = bonuses.filter(b => !b.deMinimis).reduce((s, b) => s + b.amount, 0);
  return { deMinimisSum: parseFloat(deMinimisSum.toFixed(2)), taxableSum: parseFloat(taxableSum.toFixed(2)) };
}

// Active configurable bonus types applied to earnings
export function activeBonusTypes(emp, baseGross, periodEnd, bonusTypes, bonusExemptionLimit) {
  const isDecemberPeriod = !!periodEnd && periodEnd.getMonth() === 11;
  return bonusTypes
    .filter(b => {
      if (b.status !== 'Active' || b.id === 1 || isIgnoredCustomBonus(b)) return false;
      if (b.kind === 'months' && !isDecemberPeriod) return false;
      if (b.releaseDate && periodEnd) {
        const rd = parseDate(b.releaseDate);
        const now = new Date();
        if (!isNaN(rd) && (rd > periodEnd || rd > now)) return false;
      }
      if (b.endDate && periodEnd) {
        const ed = parseDate(b.endDate);
        if (!isNaN(ed) && periodEnd > ed) return false;
      }
      return true;
    })
    .map(b => {
      let amount = 0;
      if (b.kind === 'fixed') amount = b.value;
      else if (b.kind === 'percent') amount = baseGross * (b.value / 100);
      else if (b.kind === 'months') amount = avgMonthlyPay(emp) * b.value;
      return { name: b.name, amount: parseFloat(amount.toFixed(2)), deMinimis: !!b.deMinimis };
    })
    .filter(b => b.amount > 0);
}

export function normalizeBonusName(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
export function isReservedBonusName(s) {
  const n = normalizeBonusName(s);
  return n.includes('13thmonth') || n.includes('thirteenthmonth');
}
function isIgnoredCustomBonus(b) {
  return b.id !== 1 && isReservedBonusName(b.name);
}
export function isThirteenthActive(bonusTypes) {
  const b = bonusTypes.find(x => x.id === 1);
  return !!(b && b.status === 'Active');
}

// RA 10963 split of taxable bonus
export function splitBonusTaxable(thirteenth, otherBonuses, bonusExemptionLimit) {
  const t13 = parseFloat(thirteenth) || 0;
  const ob = parseFloat(otherBonuses) || 0;
  const total = t13 + ob;
  const taxableTotal = Math.max(0, total - bonusExemptionLimit);
  const taxable13 = Math.min(t13, taxableTotal);
  const taxableBonus = taxableTotal - taxable13;
  return {
    total, taxableTotal,
    taxable13, taxableBonus,
    exempt13: t13 - taxable13,
    exemptBonus: ob - taxableBonus,
    exemptTotal: Math.min(total, bonusExemptionLimit)
  };
}

// ── STATUTORY DEDUCTIONS ──────────────────────────────────────
export function periodEndDate(periodStr) {
  const parts = String(periodStr || '').trim().split(/\s+/);
  const m = MONTHS.indexOf(parts[0]);
  const y = parseInt(parts[1]);
  if (m < 0 || isNaN(y)) return null;
  return new Date(y, m + 1, 0);
}

export function openMax(r) { return r.max === null || r.max === undefined || r.max === ''; }

export function annualBIR(annual, birData) {
  for (const row of birData) {
    const min = parseFloat(row.min) || 0;
    const max = openMax(row) ? Infinity : (parseFloat(row.max) || Infinity);
    if (annual > min && annual <= max) {
      return parseFloat(((parseFloat(row.base) || 0) + (annual - min) * ((parseFloat(row.rate) || 0)) / 100).toFixed(2));
    }
  }
  return 0;
}

export function taxableMonthlyOf(gross, d) {
  return Math.max(0, (parseFloat(gross) || 0) - (parseFloat(d?.sss) || 0) - (parseFloat(d?.phil) || 0) - (parseFloat(d?.pag) || 0));
}

export function bonusAnnualTax(taxableMonthly, taxableBonus, birData) {
  const base = Math.max(0, parseFloat(taxableMonthly) || 0) * 12;
  const b = parseFloat(taxableBonus) || 0;
  if (b <= 0) return 0;
  return Math.max(0, annualBIR(base + b, birData) - annualBIR(base, birData));
}

export function thirteenthTaxSplit(d, monthlyGross, taxable13, birData) {
  const annualTax = bonusAnnualTax(taxableMonthlyOf(monthlyGross, d), taxable13, birData);
  return { annualTax, baseBir: parseFloat((d.bir || 0).toFixed(2)) };
}

export function philMonthlyTotal(s, philData) {
  return Math.min(philData.max, Math.max(philData.min, s * philData.rate / 100));
}

// Core deduction computation — SAME math as original
export function computeDeductions(gross, cashAdv, extraAnnual, customOverrides, tables) {
  const { sssTable, philData, pagData, birData, deductionCategories } = tables;
  const salary = Math.max(0, parseFloat(gross) || 0);

  function getSSS(s) {
    for (const row of sssTable) {
      const min = parseFloat(row.min) || 0;
      const max = openMax(row) ? Infinity : (parseFloat(row.max) || Infinity);
      if (s >= min && s < max) return parseFloat(row.emp) || 0;
    }
    return sssTable.length ? (parseFloat(sssTable[sssTable.length - 1].emp) || 0) : 0;
  }

  function getPhil(s) {
    const base = Math.min(philData.ceiling || Infinity, Math.max(philData.floor || 0, s));
    return parseFloat((philMonthlyTotal(base, philData) / 2).toFixed(2));
  }

  function getPag(s) {
    const r = s <= 1500 ? pagData.rate1 : pagData.rate2;
    return parseFloat(Math.min(s * r / 100, pagData.empMax).toFixed(2));
  }

  function getBIR(s, sss, phil, pag) {
    const taxable = Math.max(0, s - sss - phil - pag);
    const annual = taxable * 12 + (parseFloat(extraAnnual) || 0);
    return parseFloat((annualBIR(annual, birData) / 12).toFixed(2));
  }

  const sss = getSSS(salary);
  const phil = getPhil(salary);
  const pag = getPag(salary);
  const bir = getBIR(salary, sss, phil, pag);
  const cash = parseFloat(cashAdv) || 0;
  const custom = activeCustomDeductions(salary, customOverrides, deductionCategories);
  const customTotal = parseFloat(custom.reduce((s, x) => s + x.amount, 0).toFixed(2));
  const net = parseFloat((salary - sss - phil - pag - bir - cash - customTotal).toFixed(2));
  return { sss, phil, pag, bir, cash, custom, customTotal, gross: salary, net };
}

export function activeCustomDeductions(gross, customOverrides, deductionCategories) {
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

// ── FULL PAYROLL COMPUTATION (used by calculator) ─────────────
// state: { users, sssTable, philData, pagData, birData, deductionCategories, bonusTypes, bonusExemptionLimit, workDays, leaveRecords, leaveTypes, attendance }
export function computePayrollFor(emp, options, state) {
  const { payPeriod, hours, absences, salaryInput, hourlyInput, cash, include13th, customOverrides } = options;
  const [monthName, yearStr] = payPeriod.split(' ');
  const year = parseInt(yearStr) || new Date().getFullYear();
  const isDec = /^december/i.test(monthName);
  const monthNum = MONTHS.indexOf(monthName) + 1;
  const workDays = state.workDays || 22;
  const bonusExemptionLimit = state.bonusExemptionLimit || 90000;

  const isTeaching = emp.classification === 'Teaching';
  let gross = 0, meta = '';
  let teachingUnpaidDays = 0, teachingDeduct = 0;

  if (isTeaching) {
    const h = Math.max(0, parseFloat(hours) || 0);
    const r = Math.max(0, parseFloat(hourlyInput) || 0);
    teachingUnpaidDays = totalUnpaidDaysAll(emp.id, monthNum, year, state);
    teachingDeduct = teachingUnpaidDays * HOURS_PER_DAY * r;
    gross = parseFloat((h * r - teachingDeduct).toFixed(2));
  } else {
    const base = Math.max(0, parseFloat(salaryInput) || 0);
    const a = Math.max(0, parseFloat(absences) || 0);
    gross = parseFloat((base - (a / workDays) * base).toFixed(2));
  }

  const periodEnd = periodEndDate(payPeriod);
  const bonuses = activeBonusTypes(emp, gross, periodEnd, state.bonusTypes || [], bonusExemptionLimit);
  const { deMinimisSum, taxableSum } = splitBonuses(bonuses);
  const grossTaxable = gross + taxableSum;

  const use13th = isDec && include13th && isThirteenthActive(state.bonusTypes || []);
  const el13 = thirteenthEligibility(emp, year);
  const thirteenth = use13th && el13.eligible ? computeThirteenth(emp, year, gross) : 0;
  const thirteenSplit = splitBonusTaxable(thirteenth, taxableSum, bonusExemptionLimit);
  const cashAmt = Math.max(0, parseFloat(cash) || 0);

  const d = computeDeductions(grossTaxable, cashAmt, 0, customOverrides, state);
  const tTax = thirteenthTaxSplit(d, grossTaxable, thirteenSplit.taxable13, state.birData || []);
  const thirteenTaxAmt = tTax.annualTax;

  const grossTotal = grossTaxable + deMinimisSum + thirteenth;
  const net = parseFloat((d.net + deMinimisSum + thirteenth - thirteenTaxAmt).toFixed(2));

  return {
    empId: emp.id,
    name: `${emp.first} ${emp.last}`,
    month: monthNum,
    monthName,
    year,
    period: payPeriod,
    gross: grossTaxable,
    deMinimisSum,
    thirteenth,
    thirteenTaxable: thirteenSplit.taxable13,
    thirteenExempt: thirteenSplit.exempt13,
    thirteenTax: thirteenTaxAmt,
    net,
    sss: d.sss,
    phil: d.phil,
    pag: d.pag,
    bir: d.bir,
    cash: cashAmt,
    bonuses,
    customDeds: d.custom,
    customTotal: d.customTotal,
    details: { gross, grossTotal, meta, bonuses, deMinimisSum, taxableSum, thirteenSplit, thirteenTaxAmt, d, isDec, teachingUnpaidDays, teachingDeduct }
  };
}

function totalUnpaidDaysAll(empId, monthNum, year, state) {
  const { totalUnpaidDays } = getLeaveBreakdown(empId, monthNum, year, state.leaveRecords || [], state.leaveTypes || []);
  return totalUnpaidDays + getDetectedAbsences(empId, monthNum, year, state.attendance || [], state.leaveRecords || []);
}

// Convenience wrapper used by pages: compute payroll for one employee with
// simple inputs and the full module-level state (identical math to the
// original computePayroll, driven by state instead of DOM globals).
export function computeOne(emp, options, state) {
  return computePayrollFor(emp, options, state);
}

// ── PAYROLL RECORDS HELPERS ───────────────────────────────────
export function getPayrollRecords(payrollRecords, monthNum, yearNum) {
  return payrollRecords
    .filter(r => r.month === monthNum && r.year === yearNum)
    .map(rec => ({
      empId: rec.empId,
      name: rec.name,
      month: rec.month,
      year: rec.year,
      gross: parseFloat(rec.gross) + (parseFloat(rec.deMinimisSum) || 0) + (parseFloat(rec.thirteenth) || 0),
      bonuses: Array.isArray(rec.bonuses) ? rec.bonuses : [],
      sss: rec.sss,
      phil: rec.phil,
      pag: rec.pag,
      bir: rec.bir,
      thirteenTax: parseFloat(rec.thirteenTax) || 0,
      net: rec.net,
      status: 'Released'
    }));
}

export function reportMonthsFor(payrollRecords, year) {
  return [...new Set(
    payrollRecords.filter(r => r.year === year).map(r => r.month)
  )].sort((a, b) => a - b);
}

export function payslipRecordsFor(payrollRecords, userId, year) {
  return payrollRecords
    .filter(r => r.empId === userId && r.year === year)
    .sort((a, b) => a.month - b.month)
    .map(rec => ({
      monthNum: rec.month,
      month: MONTHS[rec.month - 1] || '',
      year: rec.year,
      period: `${MONTHS[rec.month - 1]} ${rec.year}`,
      gross: parseFloat(rec.gross) + (parseFloat(rec.deMinimisSum) || 0) + (parseFloat(rec.thirteenth) || 0),
      deMinimis: parseFloat(rec.deMinimisSum) || 0,
      bonuses: Array.isArray(rec.bonuses) ? rec.bonuses : [],
      thirteenth: parseFloat(rec.thirteenth) || 0,
      exempt13: parseFloat(rec.thirteenExempt) || 0,
      taxable13: parseFloat(rec.thirteenTaxable) || 0,
      thirteenTax: parseFloat(rec.thirteenTax) || 0,
      sss: rec.sss,
      phil: rec.phil,
      pag: rec.pag,
      bir: rec.bir,
      cash: parseFloat(rec.cash) || 0,
      customDeds: Array.isArray(rec.customDeds) ? rec.customDeds : [],
      customTotal: (Array.isArray(rec.customDeds) ? rec.customDeds : []).reduce((s, x) => s + (parseFloat(x.amount) || 0), 0),
      net: rec.net,
      status: 'Released'
    }));
}

export function payslipYearsFor(payrollRecords, userId) {
  return [...new Set(
    payrollRecords.filter(r => r.empId === userId).map(r => r.year)
  )].sort((a, b) => a - b);
}
