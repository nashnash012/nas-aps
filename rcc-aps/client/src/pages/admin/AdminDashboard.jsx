import { useEffect, useState } from 'react';
import { fetchState } from '../../api/data';

export default function AdminDashboard() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchState().then(setState).catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 32 }}>Loading dashboard…</div>;
  if (error) return <div style={{ color: '#C62828', padding: 32 }}>{error}</div>;

  const users = state.users || [];
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const inactiveUsers = totalUsers - activeUsers;
  const admins = users.filter(u => u.role === 'System Admin').length;
  const finance = users.filter(u => u.role === 'Finance Officer').length;
  const employees = users.filter(u => u.role === 'Employee').length;
  const recentUsers = users.slice(0, 5);
  const roleColor = { 'System Admin': '#880E4F', 'Finance Officer': '#7D5A00', 'Employee': '#1565C0' };
  const roleBadge = { 'System Admin': 'b-pink', 'Finance Officer': 'b-gold', 'Employee': 'b-blue' };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#6B1A1A,#4A0E0E)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: 12 }}>System Admin</div>
          <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Administration Dashboard</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>System is running normally. All services are active.</div>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#fff' }}>{totalUsers}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Total Users</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#fff' }}>{activeUsers}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Active</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 28, fontWeight: 700, color: '#fff' }}>{inactiveUsers}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Inactive</div>
          </div>
        </div>
      </div>

      <div className="stats-grid s4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#F0F4FF' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" fill="#4A90D9"/><path d="M2 20c0-4 3.6-7 7-7h0c3.4 0 7 3 7 7" stroke="#4A90D9" strokeWidth="2" strokeLinecap="round"/><circle cx="17" cy="9" r="3" fill="#85B8E8"/><path d="M14 20c0-3 2.7-5 5-5" stroke="#85B8E8" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div className="stat-val">{totalUsers}</div>
            <div className="stat-lbl">Total Users</div>
            <div className="stat-note">{admins} Admin · {finance} Finance · {employees} Emp</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E8F5E9' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div>
            <div className="stat-val">{activeUsers}</div>
            <div className="stat-lbl">Active Accounts</div>
            <div className="stat-note">All logged in this month</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#F5F5F5' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="4" height="16" rx="2" fill="#888"/><rect x="14" y="4" width="4" height="16" rx="2" fill="#888"/></svg>
          </div>
          <div>
            <div className="stat-val">{inactiveUsers}</div>
            <div className="stat-lbl">Inactive Accounts</div>
            <div className="stat-note">Access suspended</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FCE4EC' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="10" rx="2" stroke="#C62828" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#C62828" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div className="stat-val">{(state.payrollRecords || []).length}</div>
            <div className="stat-lbl">Payroll Runs</div>
            <div className="stat-note">All time</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div className="card" style={{ width: '100%' }}>
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" fill="#4A90D9"/><path d="M2 20c0-4 3.6-7 7-7h0c3.4 0 7 3 7 7" stroke="#4A90D9" strokeWidth="2" strokeLinecap="round"/><circle cx="17" cy="9" r="3" fill="#85B8E8"/></svg>
              <div className="card-title">Recent User Activity</div>
            </div>
          </div>
          <div style={{ padding: 0 }}>
            <table>
              <thead>
                <tr><th>USER</th><th>ROLE</th><th>STATUS</th></tr>
              </thead>
              <tbody>
                {recentUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: roleColor[u.role] || '#888', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {(u.first || '')[0]}{(u.last || '')[0] || ''}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{u.first} {u.last}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={'badge ' + (roleBadge[u.role] || 'b-gray')}>{u.role}</span></td>
                    <td><span className={'badge ' + (u.status === 'Active' ? 'b-green' : 'b-gray')}>{u.status === 'Active' ? '● Active' : '● Inactive'}</span></td>
                  </tr>
                ))}
                {recentUsers.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
