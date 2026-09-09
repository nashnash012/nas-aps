import { useEffect, useState } from 'react';
import { fetchState } from '../../api/data';
import { fmt, MONTHS, EMP_CLASS } from '../../lib/payroll';
import { BackLink } from '../../components/ui';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toCsv(headers, rows) {
  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('landing');
  const [monthNum, setMonthNum] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchState().then(setState).catch(() => { }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading reports…</div>;
  if (!state) return <div style={{ color: '#C62828', padding: 20 }}>Failed to load data.</div>;

  const records = state.payrollRecords || [];
  const employees = (state.users || []).filter(u => u.salary > 0);
  const availableYears = [...new Set(records.map(r => r.year))].sort((a, b) => a - b);
  if (availableYears.length && !availableYears.includes(year)) setYear(availableYears[availableYears.length - 1]);

  return (
    <div>
      {view === 'landing' && (
        <>
          <div className="pg-title">Reports</div>
          <div className="pg-sub">Generate and export payroll and contribution reports.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 24 }}>
            <div className="card" style={{ margin: 0, cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => setView('payroll')}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div className="card-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ width: 64, height: 64, margin: '0 auto 14px', background: '#FFF5F5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="4" y="20" width="6" height="8" rx="1.5" fill="#C62828"/>
                    <rect x="13" y="14" width="6" height="14" rx="1.5" fill="#E57373"/>
                    <rect x="22" y="8" width="6" height="20" rx="1.5" fill="#C62828"/>
                    <path d="M4 18l7-7 7 4 8-9" stroke="#C62828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--maroon-dark)', marginBottom: 6 }}>Payroll Monthly Summary</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total gross, deductions, and net pay per period</div>
              </div>
            </div>
            <div className="card" style={{ margin: 0, cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => setView('gov')}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div className="card-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ width: 64, height: 64, margin: '0 auto 14px', background: '#FFF8E1', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="12" r="8" fill="#C9A84C"/>
                    <path d="M4 26c0-5 5.4-9 12-9s12 4 12 9" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="24" cy="10" r="4" fill="#8B2E2E"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--maroon-dark)', marginBottom: 6 }}>Government Contribution Report</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>SSS, PhilHealth, Pag-IBIG, and BIR remittances per period</div>
              </div>
            </div>
          </div>
        </>
      )}

      {view === 'payroll' && (
        <PayrollReport
          state={state} records={records} employees={employees}
          monthNum={monthNum} setMonthNum={setMonthNum}
          year={year} setYear={setYear} availableYears={availableYears}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'gov' && (
        <GovReport
          state={state} records={records} employees={employees}
          monthNum={monthNum} setMonthNum={setMonthNum}
          year={year} setYear={setYear} availableYears={availableYears}
          onBack={() => setView('landing')}
        />
      )}
    </div>
  );
}

function PayrollReport({ state, records, employees, monthNum, setMonthNum, year, setYear, availableYears, onBack }) {
  const activeEmps = employees.filter(u => u.status === 'Active');
  const monthRecords = records.filter(r => r.month === monthNum && r.year === year);
  const validRecords = monthRecords.filter(r => activeEmps.some(u => u.id === r.empId));

  let tGross = 0, tDed = 0, tNet = 0, tEmployer = 0;
  validRecords.forEach(r => {
    const gross = (r.gross || 0) + (r.deMinimisSum || 0) + (r.thirteenth || 0);
    const ded = (r.sss || 0) + (r.phil || 0) + (r.pag || 0) + (r.bir || 0) + (r.cash || 0) + (r.thirteenTax || 0);
    const employer = (r.sssEr || 0) + (r.philEr || 0) + (r.pagEr || 0);
    tGross += gross; tDed += ded; tNet += (r.net || 0); tEmployer += employer;
  });

  const exportPayrollCsv = () => {
    const headers = ['Employee', 'Classification', 'Gross Pay', 'Deductions', 'Net Pay', 'Employer Contributions', 'Status'];
    const rows = validRecords.map(r => {
      const emp = activeEmps.find(u => u.id === r.empId);
      const gross = (r.gross || 0) + (r.deMinimisSum || 0) + (r.thirteenth || 0);
      const ded = (r.sss || 0) + (r.phil || 0) + (r.pag || 0) + (r.bir || 0) + (r.cash || 0) + (r.thirteenTax || 0);
      const employer = (r.sssEr || 0) + (r.philEr || 0) + (r.pagEr || 0);
      return [emp ? emp.first + ' ' + emp.last : r.name, emp?.classification || '', gross.toFixed(2), ded.toFixed(2), (r.net || 0).toFixed(2), employer.toFixed(2), 'Released'];
    });
    downloadCsv(`payroll-summary-${MONTHS_SHORT[monthNum - 1]}-${year}.csv`, toCsv(headers, rows));
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <BackLink onClick={onBack}>Back to Reports</BackLink>
      </div>
      <div className="pg-title">Payroll Summary Report</div>
      <div className="pg-sub">Select a year and month to generate the payroll report.</div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="20" width="6" height="8" rx="1.5" fill="#C62828"/>
              <rect x="13" y="14" width="6" height="14" rx="1.5" fill="#E57373"/>
              <rect x="22" y="8" width="6" height="20" rx="1.5" fill="#C62828"/>
            </svg>
            <div className="card-title">Select Period</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Year:</label>
              <select className="fi" style={{ width: 110 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
                {(availableYears.length ? availableYears : [year]).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Month:</label>
              <select className="fi" style={{ width: 160 }} value={monthNum} onChange={e => setMonthNum(parseInt(e.target.value))}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {validRecords.length > 0 ? (
        <div className="card">
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="20" width="6" height="8" rx="1.5" fill="#C62828"/>
                <rect x="13" y="14" width="6" height="14" rx="1.5" fill="#E57373"/>
                <rect x="22" y="8" width="6" height="20" rx="1.5" fill="#C62828"/>
              </svg>
              <div className="card-title">Payroll Summary Report — {MONTHS[monthNum - 1]} {year}</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={exportPayrollCsv}>📥 Export CSV</button>
          </div>
          <div style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Classification</th>
                  <th>Gross Pay</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Employer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {validRecords.map(r => {
                  const emp = activeEmps.find(u => u.id === r.empId);
                  const gross = (r.gross || 0) + (r.deMinimisSum || 0) + (r.thirteenth || 0);
                  const ded = (r.sss || 0) + (r.phil || 0) + (r.pag || 0) + (r.bir || 0) + (r.cash || 0) + (r.thirteenTax || 0);
                  const employer = (r.sssEr || 0) + (r.philEr || 0) + (r.pagEr || 0);
                  return (
                    <tr key={r.empId}>
                      <td data-label="Employee"><strong>{emp ? emp.first + ' ' + emp.last : r.name}</strong></td>
                      <td data-label="Classification"><span className={'badge ' + (EMP_CLASS[emp?.classification]?.badge || 'b-gray')}>{emp?.classification || 'Non-Teaching'}</span></td>
                      <td data-label="Gross Pay">{fmt(gross)}</td>
                      <td data-label="Deductions">{fmt(ded)}</td>
                      <td data-label="Net Pay"><strong style={{ color: 'var(--maroon-dark)' }}>{fmt(r.net)}</strong></td>
                      <td data-label="Employer">{fmt(employer)}</td>
                      <td data-label="Status"><span className="badge b-green">Released</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="card-body" style={{ borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <span><strong>Total Gross:</strong> {fmt(tGross)}</span>
            <span><strong>Total Deductions:</strong> {fmt(tDed)}</span>
            <span><strong>Total Employer:</strong> {fmt(tEmployer)}</span>
            <span><strong style={{ color: 'var(--maroon-dark)' }}>Total Net Pay:</strong> <strong style={{ color: 'var(--maroon-dark)' }}>{fmt(tNet)}</strong></span>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No records found</div>
            <div style={{ fontSize: 13 }}>No payroll records available for this period.</div>
          </div>
        </div>
      )}
    </>
  );
}

function GovReport({ state, records, employees, monthNum, setMonthNum, year, setYear, availableYears, onBack }) {
  const [agency, setAgency] = useState('SSS');
  const activeEmps = employees.filter(u => u.status === 'Active');
  const monthRecords = records.filter(r => r.month === monthNum && r.year === year);
  const validRecords = monthRecords.filter(r => activeEmps.some(u => u.id === r.empId));

  const agencies = [
    { key: 'SSS', label: 'SSS', icon: '🏢' },
    { key: 'PhilHealth', label: 'PhilHealth', icon: '🏥' },
    { key: 'Pag-IBIG', label: 'Pag-IBIG', icon: '🏠' },
    { key: 'BIR', label: 'BIR', icon: '🏛️' },
  ];

  const getAgencyData = (emp, rec) => {
    switch (agency) {
      case 'SSS': return { employee: rec.sss || 0, employer: rec.sssEr || 0 };
      case 'PhilHealth': return { employee: rec.phil || 0, employer: rec.philEr || 0 };
      case 'Pag-IBIG': return { employee: rec.pag || 0, employer: rec.pagEr || 0 };
      case 'BIR': return { employee: rec.bir || 0, employer: 0 };
      default: return { employee: 0, employer: 0 };
    }
  };

  let totalEmpShare = 0, totalErShare = 0;
  validRecords.forEach(r => {
    const d = getAgencyData(null, r);
    totalEmpShare += d.employee;
    totalErShare += d.employer;
  });

  const exportGovCsv = () => {
    const headers = ['Employee', 'Classification', `${agency} Employee Share`, `${agency} Employer Share`, 'Total'];
    const rows = validRecords.map(r => {
      const emp = activeEmps.find(u => u.id === r.empId);
      const d = getAgencyData(emp, r);
      return [emp ? emp.first + ' ' + emp.last : r.name, emp?.classification || '', d.employee.toFixed(2), d.employer.toFixed(2), (d.employee + d.employer).toFixed(2)];
    });
    downloadCsv(`gov-contribution-${agency.toLowerCase()}-${MONTHS_SHORT[monthNum - 1]}-${year}.csv`, toCsv(headers, rows));
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <BackLink onClick={onBack}>Back to Reports</BackLink>
      </div>
      <div className="pg-title">Government Contribution Report</div>
      <div className="pg-sub">Select a year and month to generate the contribution remittance report.</div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="12" r="8" fill="#C9A84C"/></svg>
            <div className="card-title">Select Period</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Year:</label>
              <select className="fi" style={{ width: 110 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
                {(availableYears.length ? availableYears : [year]).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Month:</label>
              <select className="fi" style={{ width: 160 }} value={monthNum} onChange={e => setMonthNum(parseInt(e.target.value))}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head" style={{ padding: '0 16px' }}>
          {agencies.map(a => (
            <button key={a.key}
              onClick={() => setAgency(a.key)}
              className={'btn btn-sm ' + (agency === a.key ? 'btn-primary' : 'btn-outline')}
              style={{ borderRadius: 0, border: 'none', borderBottom: agency === a.key ? '2px solid var(--maroon)' : '2px solid transparent', background: 'transparent', fontWeight: agency === a.key ? 700 : 500, color: agency === a.key ? 'var(--maroon-dark)' : 'var(--text-muted)', padding: '12px 20px' }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        {validRecords.length > 0 ? (
          <>
            <div className="card-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="12" r="8" fill="#C9A84C"/></svg>
                <div className="card-title">{agency} Contribution Report — {MONTHS[monthNum - 1]} {year}</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={exportGovCsv}>📥 Export CSV</button>
            </div>
            <div style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Classification</th>
                    <th>Employee Share</th>
                    {agency !== 'BIR' && <th>Employer Share</th>}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {validRecords.map(r => {
                    const emp = activeEmps.find(u => u.id === r.empId);
                    const d = getAgencyData(emp, r);
                    return (
                      <tr key={r.empId}>
                        <td data-label="Employee"><strong>{emp ? emp.first + ' ' + emp.last : r.name}</strong></td>
                        <td data-label="Classification"><span className={'badge ' + (EMP_CLASS[emp?.classification]?.badge || 'b-gray')}>{emp?.classification || 'Non-Teaching'}</span></td>
                        <td data-label="Employee Share">{fmt(d.employee)}</td>
                        {agency !== 'BIR' && <td data-label="Employer Share">{fmt(d.employer)}</td>}
                        <td data-label="Total"><strong style={{ color: 'var(--maroon-dark)' }}>{fmt(d.employee + d.employer)}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="card-body" style={{ borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <span><strong>Total {agency} (Employee):</strong> {fmt(totalEmpShare)}</span>
              {agency !== 'BIR' && <span><strong>Total {agency} (Employer):</strong> {fmt(totalErShare)}</span>}
              <span><strong style={{ color: 'var(--maroon-dark)' }}>Total {agency}:</strong> <strong style={{ color: 'var(--maroon-dark)' }}>{fmt(totalEmpShare + totalErShare)}</strong></span>
            </div>
          </>
        ) : (
          <div className="card-body" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No records found</div>
            <div style={{ fontSize: 13 }}>No confirmed payroll records available for this period.</div>
          </div>
        )}
      </div>
    </>
  );
}
