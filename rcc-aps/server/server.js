const express = require('express');
const fs = require('fs');
const path = require('path');
const hrisMock = require('./hris-mock');
const { validateStateBody } = require('./state-validator');

const app = express();
const PORT = parseInt(process.env.PORT) || 3000;
const DB_PATH = path.join(__dirname, 'db', 'db.json');
const HRIS_API_URL = process.env.HRIS_API_URL || '';      // e.g. https://hris.rcc.edu.ph/api
const HRIS_API_KEY = process.env.HRIS_API_KEY || '';      // bearer token for the HRIS API

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    return {};
  }
}

function writeDB(data) {
  // Atomic write: write to a temp file then rename, so a crash mid-write
  // can never leave db.json truncated/corrupted.
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, DB_PATH);
}

function mapHrisEmployee(h) {
  return {
    first: h.first_name || h.first || '',
    last: h.last_name || h.last || '',
    email: (h.email || '').toLowerCase(),
    password: h.password || '',
    role: h.role || 'Employee',
    status: h.status || 'Active',
    department: h.department || '',
    classification: h.classification || 'Non-Teaching',
    salary: h.salary || h.monthly_salary || 0,
    hourlyRate: h.hourly_rate || h.hourlyRate || 0,
    hireDate: h.hire_date || h.hireDate || '',
    hoursWorked: h.hours_worked || h.hoursWorked || 0,
    absenceDays: h.absence_days || h.absenceDays || 0
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

async function fetchHrisData() {
  const headers = { Accept: 'application/json' };
  if (HRIS_API_KEY) headers.Authorization = 'Bearer ' + HRIS_API_KEY;
  if (HRIS_API_URL) {
    try {
      const [empRes, attRes, leaveRes] = await Promise.all([
        fetch(`${HRIS_API_URL}/employees`, { headers }),
        fetch(`${HRIS_API_URL}/attendance`, { headers }),
        fetch(`${HRIS_API_URL}/leave-requests`, { headers })
      ]);
      if (empRes.ok) {
        const employees = (Array.isArray(await empRes.json().catch(()=>[])) ? await empRes.json() : []);
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'RCC-APS Payroll System API', hris: HRIS_API_URL ? 'connected' : 'mock' });
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

app.get('/api/data', (req, res) => {
  res.json(readDB());
});

app.post('/api/data', (req, res) => {
  const check = validateStateBody(req.body || {});
  if (!check.ok) {
    return res.status(400).json({ ok: false, error: check.error });
  }
  try {
    writeDB(req.body);
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Failed to persist data.' });
  }
  res.json({ ok: true });
});

app.get('/api/employees', (req, res) => {
  const db = readDB();
  res.json(db.users || []);
});

// ── LEAVE ENDPOINTS ────────────────────────────────────────────
app.get('/api/leaves', (req, res) => {
  const db = readDB();
  res.json({
    leaveTypes: db.leaveTypes || [],
    nextLeaveTypeId: db.nextLeaveTypeId || 1,
    leaveRecords: db.leaveRecords || []
  });
});

app.post('/api/leave-types', (req, res) => {
  try {
    const db = readDB();
    db.leaveTypes = req.body.leaveTypes || db.leaveTypes || [];
    db.nextLeaveTypeId = req.body.nextLeaveTypeId || db.nextLeaveTypeId || 1;
    writeDB(db);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Failed to save leave types.' });
  }
});

app.post('/api/leave-records', (req, res) => {
  try {
    const db = readDB();
    db.leaveRecords = req.body.leaveRecords || [];
    writeDB(db);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Failed to save leave records.' });
  }
});

app.listen(PORT, () => {
  console.log(`RCC-APS Payroll System running at http://localhost:${PORT}`);
});
