const express = require('express');
const fs = require('fs');
const path = require('path');
const hrisMock = require('./hris-mock');
const { validateStateBody } = require('./state-validator');
const db = require('./db');
const { init } = require('./db/init');
const { requireAuth } = require('./middleware/jwt');

const app = express();
const PORT = parseInt(process.env.PORT) || 3000;
const HRIS_API_URL = process.env.HRIS_API_URL || '';      // e.g. https://hris.rcc.edu.ph/api
const HRIS_API_KEY = process.env.HRIS_API_KEY || '';      // bearer token for the HRIS API

app.use(express.json({ limit: '10mb' }));
app.use('/api/auth', require('./auth-router'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes that must be handled by the browser (SPA fallback).

// ── HRIS DATA ────────────────────────────────────────────────
function mapHrisEmployee(h) {
  return {
    first: h.first_name || h.firstName || h.first || '',
    last: h.last_name || h.lastName || h.last || '',
    email: (h.email || '').toLowerCase(),
    password: h.password || '',
    role: h.role || 'Employee',
    status: (h.active === false || h.status === 'Inactive') ? 'Inactive' : (h.status || 'Active'),
    department: h.department || '',
    classification: (h.contractType === 'Part-Time') ? 'Teaching' : (h.classification || 'Non-Teaching'),
    salary: h.salary || h.monthly_salary || h.monthlySalary || 0,
    hourlyRate: h.hourly_rate || h.hourlyRate || 0,
    hireDate: h.hire_date || h.hireDate || '',
    hoursWorked: h.hours_worked || h.hoursWorked || 0,
    absenceDays: h.absence_days || h.absenceDays || 0,
    employeeId: h.employeeId || h.employee_id || ''
  };
}

// Normalize an attendance record from either the real API or mock into a shape
// the client can consume: kept as one-per-day clock-in/out with the employee
// email attached so the client can match it to a local user.
function mapHrisAttendance(a) {
  return {
    employeeId: a.employee_id || a.employeeId || '',
    employeeEmail: (a.employee_email || a.email || '').toLowerCase(),
    date: a.date || (a.attendanceDate || ''),
    clockInAt: a.clock_in_at || a.clockInAt || '',
    clockOutAt: a.clock_out_at || a.clockOutAt || ''
  };
}

// Fetch employees/attendance/leaves from the live HRIS. Falls back to the
// bundled mock dataset when no endpoint is configured or the API is offline.
async function fetchHrisData() {
  if (HRIS_API_URL) {
    try {
      const headers = { Accept: 'application/json' };
      if (HRIS_API_KEY) headers.Authorization = 'Bearer ' + HRIS_API_KEY;
      const [empRes, attRes, leaveRes] = await Promise.all([
        fetch(`${HRIS_API_URL}/employees`, { headers }),
        fetch(`${HRIS_API_URL}/attendance`, { headers }),
        fetch(`${HRIS_API_URL}/leave-requests`, { headers })
      ]);
      if (empRes.ok) {
        const employees = await empRes.json().catch(() => []);
        const attendance = attRes.ok ? await attRes.json().catch(() => []) : [];
        const leaves = leaveRes.ok ? await leaveRes.json().catch(() => []) : [];
        const empList = (Array.isArray(employees) ? employees : (employees.employees || employees.data || []));
        const attList = (Array.isArray(attendance) ? attendance : (attendance.attendance || attendance.data || []));
        const leaveList = (Array.isArray(leaves) ? leaves : (leaves.leaveRecords || leaves.data || []));
        return {
          source: 'HRIS API',
          employees: empList.map(mapHrisEmployee),
          attendance: attList.map(mapHrisAttendance),
          leaveRecords: leaveList
        };
      }
    } catch (e) {
      console.warn('[HRIS] API unreachable, using mock data.');
    }
  }
  return {
    source: 'mock data',
    employees: hrisMock.employees.map(mapHrisEmployee),
    attendance: (hrisMock.attendance || []).map(mapHrisAttendance),
    leaveRecords: hrisMock.leaveRecords || []
  };
}

// ── HEALTH & DB STATUS ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'RCC-APS Payroll System API', database: 'MySQL', hris: HRIS_API_URL ? 'connected' : 'mock' });
});

app.get('/api/db/status', async (req, res) => {
  const st = await db.status();
  res.json({
    engine: 'MySQL',
    connected: st.connected,
    host: st.host,
    database: st.database,
    serverTime: st.serverTime,
    counts: st.counts || null,
    error: st.error || null
  });
});

app.get('/api/hris/status', (req, res) => {
  res.json({
    configured: !!HRIS_API_URL,
    url: HRIS_API_URL || null,
    message: HRIS_API_URL
      ? `Connected to HRIS API at ${HRIS_API_URL}`
      : 'HRIS API not configured. Using mock HRIS data.'
  });
});

app.get('/api/hris/sync', async (req, res) => {
  const result = await fetchHrisData();
  res.json({ source: result.source, employees: result.employees, attendance: result.attendance || [], leaveRecords: result.leaveRecords || [] });
});

// ── STATE (MySQL-backed, frontend-blob compatible) ───────────
app.get('/api/data', async (req, res) => {
  try {
    const state = await db.assembleState();
    res.json(state);
  } catch (e) {
    console.error('[DB] read failed:', e.message);
    res.status(500).json({ ok: false, error: 'Failed to read from MySQL.' });
  }
});

app.post('/api/data', requireAuth, async (req, res) => {
  const check = validateStateBody(req.body || {});
  if (!check.ok) {
    return res.status(400).json({ ok: false, error: check.error });
  }
  try {
    await db.persistState(req.body);
    res.json({ ok: true });
  } catch (e) {
    console.error('[DB] write failed:', e.message);
    return res.status(500).json({ ok: false, error: 'Failed to persist data to MySQL.' });
  }
});

// ── EMPLOYEES ────────────────────────────────────────────────
app.get('/api/employees', async (req, res) => {
  try {
    const state = await db.assembleState();
    res.json(state.users || []);
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Failed to read employees.' });
  }
});

// ── LEAVE ENDPOINTS ──────────────────────────────────────────
app.get('/api/leaves', async (req, res) => {
  try {
    const state = await db.assembleState();
    res.json({
      leaveTypes: state.leaveTypes || [],
      nextLeaveTypeId: state.nextLeaveTypeId || 1,
      leaveRecords: state.leaveRecords || []
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Failed to read leaves.' });
  }
});

app.post('/api/leave-types', requireAuth, async (req, res) => {
  try {
    const state = await db.assembleState();
    state.leaveTypes = req.body.leaveTypes || state.leaveTypes || [];
    state.nextLeaveTypeId = req.body.nextLeaveTypeId || state.nextLeaveTypeId || 1;
    await db.persistState(state);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Failed to save leave types.' });
  }
});

app.post('/api/leave-records', requireAuth, async (req, res) => {
  try {
    const state = await db.assembleState();
    state.leaveRecords = req.body.leaveRecords || [];
    await db.persistState(state);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Failed to save leave records.' });
  }
});

app.listen(PORT, async () => {
  try {
    const result = await init();
    if (result.seeded) {
      console.log('[MySQL] First-run auto-init complete — database created and seeded.');
    }
    const st = await db.status();
    if (st.connected) {
      console.log(`[MySQL] Connected to ${st.host}/${st.database} @ ${st.serverTime}`);
    } else {
      console.warn('[MySQL] WARNING: database unreachable — ' + st.error);
    }
  } catch (e) {
    console.warn('[MySQL] WARNING: init failed — ' + e.message);
  }
  console.log(`RCC-APS Payroll System running at http://localhost:${PORT}`);
});