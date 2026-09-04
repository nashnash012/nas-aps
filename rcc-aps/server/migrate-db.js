// Migration: db.json (JSON-file state) -> MySQL relational tables (rcc_aps).
// Usage: npm run migrate-db   (reads server/db/db.json, write to MySQL)
// Idempotent: re-running clears and re-imports the tables below.
'use strict';
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_PATH = path.join(__dirname, 'db', 'db.json');
const CFG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rcc_aps',
  multipleStatements: true
};

// Small helper to invert string keys that were arrays of "empId_year" records.
function toObj(records, keyOf) {
  const out = {};
  (records || []).forEach(r => { out[keyOf(r)] = r; });
  return out;
}

async function run() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error('db.json not found at ' + DB_PATH);
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const conn = await mysql.createConnection(CFG);

  try {
    await conn.beginTransaction();

    // ── USERS ─────────────────────────────────────────────
    await conn.query('DELETE FROM users');
    for (const u of (db.users || [])) {
      await conn.query(
        `INSERT INTO users
           (id, first, last, email, role, status, date, salary, classification,
            department, hireDate, hourlyRate, absenceDays, hoursWorked, endDate)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE first=VALUES(first)`,
        [u.id, u.first || '', u.last || '', (u.email || '').toLowerCase(),
         u.role || 'Employee', u.status || 'Active', u.date || '',
         u.salary || 0, u.classification || 'Non-Teaching', u.department || '',
         u.hireDate || '', u.hourlyRate || 0, u.absenceDays || 0,
         u.hoursWorked || 0, u.endDate || '']
      );
    }

    // ── AUTH ──────────────────────────────────────────────
    await conn.query('DELETE FROM auth');
    const authObj = db.auth || {};
    for (const k of Object.keys(authObj)) {
      const a = authObj[k];
      if (!a) continue;
      await conn.query(
        `INSERT INTO auth (id, email, pass, label, icon, page, role, status)
         VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE email=VALUES(email)`,
        [a.id != null ? a.id : parseInt(k, 10) || 0,
         (a.email || '').toLowerCase(), a.pass || '', a.label || '',
         a.icon || '', a.page || '', a.role || 'employee', a.status || 'Active']
      );
    }

    // ── PROFILES ──────────────────────────────────────────
    await conn.query('DELETE FROM profiles');
    const profObj = db.profiles || {};
    for (const k of Object.keys(profObj)) {
      const p = profObj[k];
      if (!p) continue;
      await conn.query(
        `INSERT INTO profiles (id, empPhone, empAddr) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE empPhone=VALUES(empPhone)`,
        [parseInt(k, 10) || 0, p.empPhone || '', p.empAddr || '']
      );
    }

    // ── CASH ADVANCES ─────────────────────────────────────
    await conn.query('DELETE FROM cash_advances');
    const cashObj = db.cashAdvances || {};
    for (const k of Object.keys(cashObj)) {
      await conn.query(
        `INSERT INTO cash_advances (id, amount) VALUES (?,?)
         ON DUPLICATE KEY UPDATE amount=VALUES(amount)`,
        [parseInt(k, 10) || 0, parseFloat(cashObj[k]) || 0]
      );
    }

    // ── BONUS TYPES ───────────────────────────────────────
    await conn.query('DELETE FROM bonus_types');
    for (const b of (db.bonusTypes || [])) {
      await conn.query(
        `INSERT INTO bonus_types (id, name, kind, value, \`desc\`, status, releaseDate, endDate)
         VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [b.id, b.name || '', b.kind || '', b.value || 0, b.desc || '',
         b.status || 'Active', b.releaseDate || '', b.endDate || '']
      );
    }

    // ── BONUS PAYOUTS ─────────────────────────────────────
    await conn.query('DELETE FROM bonus_payouts');
    const payObj = db.bonusPayouts || {};
    for (const key of Object.keys(payObj)) {
      // key format: "empId_year"
      const [empId, year] = key.split('_');
      const rec = payObj[key];
      await conn.query(
        `INSERT INTO bonus_payouts (empId, year, date) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE date=VALUES(date)`,
        [parseInt(empId, 10) || 0, parseInt(year, 10) || 0,
         (rec && rec.date) || '']
      );
    }

    // ── DEDUCTION CATEGORIES ──────────────────────────────
    await conn.query('DELETE FROM deduction_categories');
    for (const d of (db.deductionCategories || [])) {
      await conn.query(
        `INSERT INTO deduction_categories (id, name, type, amount, \`desc\`, status)
         VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [d.id, d.name || '', d.type || '', d.amount || 0, d.desc || '',
         d.status || 'Active']
      );
    }

    // ── PAYROLL RECORDS ───────────────────────────────────
    await conn.query('DELETE FROM payroll_records');
    for (const p of (db.payrollRecords || [])) {
      await conn.query(
        `INSERT INTO payroll_records
           (empId, name, month, monthName, year, period, gross, deMinimisSum,
            thirteenth, thirteenTaxable, thirteenExempt, thirteenTax, net,
            sss, phil, pag, bir, cash, bonuses, date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [p.empId, p.name || '', p.month || 0, p.monthName || '', p.year || 0,
         p.period || '', p.gross || 0, p.deMinimisSum || 0, p.thirteenth || 0,
         p.thirteenTaxable || 0, p.thirteenExempt || 0, p.thirteenTax || 0,
         p.net || 0, p.sss || 0, p.phil || 0, p.pag || 0, p.bir || 0,
         p.cash || 0, JSON.stringify(p.bonuses || []), p.date || '']
      );
    }

    // ── SSS TABLE ─────────────────────────────────────────
    await conn.query('DELETE FROM sss_table');
    for (const s of (db.sssTable || [])) {
      await conn.query(
        `INSERT INTO sss_table (\`range\`, emp, er, min, max)
         VALUES (?,?,?,?,?)`,
        [s.range || '', s.emp || 0, s.er || 0,
         s.min != null ? s.min : null, s.max != null ? s.max : null]
      );
    }

    // ── PHIL CONFIG ───────────────────────────────────────
    await conn.query('DELETE FROM phil_data WHERE id = 1');
    const ph = db.philData || {};
    await conn.query(
      `INSERT INTO phil_data (id, rate, min, max, floor, ceiling)
       VALUES (1,?,?,?,?,?)`,
      [ph.rate != null ? ph.rate : 5, ph.min != null ? ph.min : 500,
       ph.max != null ? ph.max : 5000, ph.floor != null ? ph.floor : 10000,
       ph.ceiling != null ? ph.ceiling : 100000]
    );

    // ── PAG-IBIG CONFIG ───────────────────────────────────
    await conn.query('DELETE FROM pag_data WHERE id = 1');
    const pg = db.pagData || {};
    await conn.query(
      `INSERT INTO pag_data (id, rate1, rate2, empMax, erMax)
       VALUES (1,?,?,?,?)`,
      [pg.rate1 != null ? pg.rate1 : 1, pg.rate2 != null ? pg.rate2 : 2,
       pg.empMax != null ? pg.empMax : 100, pg.erMax != null ? pg.erMax : 100]
    );

    // ── BIR TABLE ─────────────────────────────────────────
    await conn.query('DELETE FROM bir_table');
    for (const b of (db.birData || [])) {
      await conn.query(
        `INSERT INTO bir_table (\`range\`, base, rate, min, max)
         VALUES (?,?,?,?,?)`,
        [b.range || '', b.base || 0, b.rate || 0,
         b.min != null ? b.min : null, b.max != null ? b.max : null]
      );
    }

    // ── APP CONFIG (key-value) ────────────────────────────
    await conn.query('DELETE FROM app_config');
    const cfg = {
      nextUserId: db.nextUserId || 1,
      nextBonusId: db.nextBonusId || 1,
      nextDedCatId: db.nextDedCatId || 1,
      nextLeaveTypeId: db.nextLeaveTypeId || 1,
      nextLeaveRecordId: db.nextLeaveRecordId || 1,
      bonusExemptionLimit: db.bonusExemptionLimit || 90000,
      workDays: db.workDays || 22,
      dedMeta: JSON.stringify(db.dedMeta || {}),
      savedAt: db.savedAt || new Date().toISOString()
    };
    for (const k of Object.keys(cfg)) {
      await conn.query('INSERT INTO app_config (cfg_key, cfg_value) VALUES (?,?)',
        [k, String(cfg[k])]);
    }

    // ── LEAVE TYPES ───────────────────────────────────────
    await conn.query('DELETE FROM leave_types');
    for (const l of (db.leaveTypes || [])) {
      await conn.query(
        `INSERT INTO leave_types (id, name, isPaid) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [l.id, l.name || '', l.isPaid ? 1 : 0]
      );
    }

    // ── LEAVE RECORDS ─────────────────────────────────────
    await conn.query('DELETE FROM leave_records');
    for (const l of (db.leaveRecords || [])) {
      await conn.query(
        `INSERT INTO leave_records (id, empId, typeId, startDate, endDate, days)
         VALUES (?,?,?,?,?,?)`,
        [l.id, l.empId, l.typeId, l.startDate || '', l.endDate || '',
         l.days || 0]
      );
    }

    // ── ATTENDANCE ────────────────────────────────────────
    await conn.query('DELETE FROM attendance');
    for (const a of (db.attendance || [])) {
      await conn.query(
        `INSERT INTO attendance
           (empId, employeeId, employeeEmail, date, clockInAt, clockOutAt, hours)
         VALUES (?,?,?,?,?,?,?)`,
        [a.empId || 0, a.employeeId || '', (a.employeeEmail || '').toLowerCase(),
         a.date || '', a.clockInAt || '', a.clockOutAt || '', a.hours || 0]
      );
    }

    await conn.commit();
    console.log('Migration OK:');
    console.log('  users            :', (db.users || []).length);
    console.log('  auth             :', Object.keys(db.auth || {}).length);
    console.log('  payrollRecords   :', (db.payrollRecords || []).length);
    console.log('  attendance       :', (db.attendance || []).length);
    console.log('  sssTable         :', (db.sssTable || []).length);
    console.log('  birTable         :', (db.birData || []).length);
    console.log('  leaveRecords     :', (db.leaveRecords || []).length);
    console.log('  config           :', Object.keys(cfg).length, 'keys');
    console.log('Database:', CFG.database, '@', CFG.host);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.end();
  }
}

run().catch(err => {
  console.error('Migration FAILED:', err.message);
  process.exit(1);
});