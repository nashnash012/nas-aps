const express = require('express');
const fs = require('fs');
const path = require('path');
const hrisMock = require('./hris-mock');

const app = express();
const PORT = process.env.PORT || 3000;
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
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
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

async function fetchHrisEmployees() {
  if (HRIS_API_URL) {
    try {
      const headers = { Accept: 'application/json' };
      if (HRIS_API_KEY) headers.Authorization = 'Bearer ' + HRIS_API_KEY;
      const res = await fetch(`${HRIS_API_URL}/employees`, { headers });
      if (res.ok) {
        const body = await res.json();
        const list = Array.isArray(body) ? body : (body.employees || body.data || []);
        if (list.length) return { source: 'HRIS API', employees: list.map(mapHrisEmployee) };
      }
    } catch (e) {
      console.warn('[HRIS] API unreachable, using mock data.');
    }
  }
  return { source: 'mock data', employees: hrisMock.employees.map(mapHrisEmployee) };
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
  const result = await fetchHrisEmployees();
  res.json({ source: result.source, employees: result.employees });
});

app.get('/api/data', (req, res) => {
  res.json(readDB());
});

app.post('/api/data', (req, res) => {
  writeDB(req.body || {});
  res.json({ ok: true });
});

app.get('/api/employees', (req, res) => {
  const db = readDB();
  res.json(db.users || []);
});

app.listen(PORT, () => {
  console.log(`RCC-APS Payroll System running at http://localhost:${PORT}`);
});
