import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { fetchState } from '../../api/data';
import { fmt, MONTHS } from '../../lib/payroll';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchState().then(setState).catch(() => { }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#999' }}>Loading dashboard…</div>;
  if (!state) return <div style={{ color: '#C62828' }}>Failed to load data.</div>;

  const emp = (state.users || []).find(u => (u.email || '').toLowerCase() === (user?.email || '').toLowerCase())
    || (state.users || []).find(u => u.id === user?.id);
  if (!emp) return <div style={{ color: '#999' }}>No employee profile linked to this account.</div>;

  const myRecords = (state.payrollRecords || [])
    .filter(r => r.empId === emp.id)
    .sort((a, b) => b.year - a.year || b.month - a.month);

  const year = new Date().getFullYear();
  const allRecs = myRecords;
  const latestRec = allRecs.length ? allRecs[0] : null;
  const latestDed = latestRec ? (latestRec.sss || 0) + (latestRec.phil || 0) + (latestRec.pag || 0) + (latestRec.bir || 0) + (latestRec.thirteenTax || 0) + (latestRec.cash || 0) + (latestRec.customTotal || 0) : 0;

  let nextLabel = '—';
  if (latestRec) {
    let m = latestRec.month + 1, y = latestRec.year;
    if (m > 12) { m = 1; y += 1; }
    nextLabel = MONTHS[m - 1].slice(0, 3) + ' ' + y;
  }

  const base = emp.classification === 'Teaching'
    ? (emp.hourlyRate || 0)
    : (emp.salary || 0);

  const greetings = (() => {
    const h = new Date().getHours();
    if (h < 12) return '🌅 Good Morning';
    if (h < 17) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  })();

  return (
    <div>
      <div className="hero-banner" style={{ background: 'linear-gradient(135deg,#5A0F0F,#7B1E1E)' }}>
        <div className="hero-left">
          <div className="hero-tag">{greetings}</div>
          <div className="hero-name">Welcome back, {emp.first}! 👋</div>
          <div className="hero-sub">Here is your payroll summary for {MONTHS[new Date().getMonth()]} {year}.</div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><div className="hero-stat-val">{fmt(base)}</div><div className="hero-stat-lbl">Basic Pay</div></div>
          <div className="hero-stat"><div className="hero-stat-val">{latestRec ? fmt(latestRec.net) : '—'}</div><div className="hero-stat-lbl">Net Pay (Est.)</div></div>
          <div className="hero-stat"><div className="hero-stat-val">{nextLabel}</div><div className="hero-stat-lbl">Next Payout</div></div>
        </div>
      </div>

      <div className="stats-grid s4">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--gold-pale)' }}>💰</div>
          <div>
            <div className="stat-val">{latestRec ? fmt(latestRec.net) : '₱0.00'}</div>
            <div className="stat-lbl">Net Pay This Month</div>
            <div className="stat-note">Includes BIR deduction</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E3F2FD' }}>📄</div>
          <div>
            <div className="stat-val">{allRecs.length}</div>
            <div className="stat-lbl">Payslips Available</div>
            <div className="stat-note">Since Jan 2025</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E8F5E9' }}>📉</div>
          <div>
            <div className="stat-val">{fmt(latestDed)}</div>
            <div className="stat-lbl">Total Deductions</div>
            <div className="stat-note">SSS + PhilHealth + Pag-IBIG + BIR</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#F3E5F5' }}>📅</div>
          <div>
            <div className="stat-val">{nextLabel}</div>
            <div className="stat-lbl">Next Payroll</div>
            <div className="stat-note">{latestRec ? 'From latest record' : 'No payroll released yet'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">📄 Recent Payslips</div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/employee/payslip')}>View All</button>
          </div>
          <div style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Gross Pay</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allRecs.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>📭 No payslips yet.</td></tr>
                ) : allRecs.slice(0, 4).map(r => (
                  <tr key={r.empId + '-' + r.month + '-' + r.year}>
                    <td><strong>{MONTHS[r.month - 1]} {r.year}</strong>{r.month === 12 ? <span className="badge b-gold" style={{ marginLeft: 4, fontSize: 10 }}>🎁 13th</span> : ''}</td>
                    <td>{fmt(r.gross)}</td>
                    <td>{fmt((r.sss || 0) + (r.phil || 0) + (r.pag || 0) + (r.bir || 0) + (r.cash || 0) + (r.thirteenTax || 0))}</td>
                    <td><strong style={{ color: 'var(--maroon-dark)' }}>{fmt(r.net)}</strong></td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate('/employee/payslip')}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
