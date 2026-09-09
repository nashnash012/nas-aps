import { useEffect, useState } from 'react';
import { fetchState } from '../../api/data';
import { fmt } from '../../lib/utils';
import { MONTHS } from '../../lib/payroll';

export default function FinanceDashboard() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchState().then(setState).catch(() => { }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading dashboard…</div>;
  if (!state) return <div style={{ color: '#C62828', padding: 20 }}>Failed to load data.</div>;

  const employees = (state.users || []).filter(u => u.salary > 0 && u.status === 'Active');
  const teachingCount = employees.filter(u => u.classification === 'Teaching').length;
  const nonTeachingCount = employees.filter(u => u.classification !== 'Teaching').length;
  const records = state.payrollRecords || [];
  const months = [...new Set(records.map(r => r.month))].sort((a, b) => a - b);
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentRecords = records.filter(r => r.month === currentMonthNum && r.year === currentYear);
  const currentMonthLabel = MONTHS[currentMonthNum - 1] + ' ' + currentYear;
  const totalGross = currentRecords.reduce((s, r) => s + (r.gross || 0) + (r.deMinimisSum || 0) + (r.thirteenth || 0), 0);
  const totalDed = currentRecords.reduce((s, r) => s + (r.sss || 0) + (r.phil || 0) + (r.pag || 0) + (r.bir || 0) + (r.cash || 0) + (r.thirteenTax || 0), 0);
  const totalNet = currentRecords.reduce((s, r) => s + (r.net || 0), 0);
  const pendingCount = records.filter(r => !r.confirmed).length;
  const recentRecords = [...records].sort((a, b) => (b.year - a.year) || (b.month - a.month)).slice(0, 5);

  return (
    <div>
      <div className="hero-banner">
        <div className="hero-left">
          <div className="hero-tag">💼 Finance Officer</div>
          <div className="hero-name">Finance Dashboard 👋</div>
          <div className="hero-sub">{currentMonthLabel} payroll overview and processing status.</div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-val">{employees.length}</div>
            <div className="hero-stat-lbl">Total Employees</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val">{teachingCount}</div>
            <div className="hero-stat-lbl">Teaching</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val">{nonTeachingCount}</div>
            <div className="hero-stat-lbl">Non-Teaching</div>
          </div>
        </div>
      </div>

      <div className="stats-grid s4">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--gold-pale)' }}>💰</div>
          <div>
            <div className="stat-val">{fmt(totalGross)}</div>
            <div className="stat-lbl">Total Gross Pay</div>
            <div className="stat-note">{currentMonthLabel}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FDEDEC' }}>📤</div>
          <div>
            <div className="stat-val">{fmt(totalDed)}</div>
            <div className="stat-lbl">Total Deductions</div>
            <div className="stat-note">All employees</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E8F5E9' }}>✅</div>
          <div>
            <div className="stat-val">{fmt(totalNet)}</div>
            <div className="stat-lbl">Total Net Pay</div>
            <div className="stat-note">{currentMonthLabel}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FFF8E1' }}>⏳</div>
          <div>
            <div className="stat-val">{pendingCount}</div>
            <div className="stat-lbl">Pending</div>
            <div className="stat-note">Needs processing</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">📋 Recent Payroll Activity</div>
        </div>
        <div style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Gross</th>
                <th>Deductions</th>
                <th>Net</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No recent payroll activity.</td></tr>
              ) : recentRecords.map((r, i) => {
                const emp = (state.users || []).find(u => u.id === r.empId);
                const gross = (r.gross || 0) + (r.deMinimisSum || 0) + (r.thirteenth || 0);
                const ded = (r.sss || 0) + (r.phil || 0) + (r.pag || 0) + (r.bir || 0) + (r.cash || 0) + (r.thirteenTax || 0);
                return (
                  <tr key={r.empId + '_' + r.month + '_' + r.year}>
                    <td data-label="Employee"><strong>{emp ? emp.first + ' ' + emp.last : r.name}</strong></td>
                    <td data-label="Gross">{fmt(gross)}</td>
                    <td data-label="Deductions">{fmt(ded)}</td>
                    <td data-label="Net"><strong style={{ color: 'var(--maroon-dark)' }}>{fmt(r.net)}</strong></td>
                    <td data-label="Status"><span className="badge b-green">Released</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
