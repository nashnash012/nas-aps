import { useAuth } from '../hooks/useAuth';

const ROLE_BG = { admin: '#880E4F', finance: '#7D5A00', employee: '#8B2E2E' };
const ROLE_LABEL = { admin: 'System Admin', finance: 'Finance Officer', employee: 'Employee' };

export default function Navbar({ onMenu }) {
  const { user } = useAuth();
  const roleKey = user?.role === 'System Admin' || user?.role === 'admin' ? 'admin' : user?.role === 'Finance Officer' || user?.role === 'finance' ? 'finance' : 'employee';
  const initials = (user?.label || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="topbar">
      <button className="menu-btn" onClick={onMenu} aria-label="Open menu">☰</button>
      <div className="tb-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F0E8', border: '1px solid #E0D0B8', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#666' }}>
          📅 <span>{today}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="tb-avatar" style={{ background: ROLE_BG[roleKey] }}>{initials}</div>
          <div>
            <div className="tb-name">{user?.label}</div>
            <div className="tb-role">{ROLE_LABEL[roleKey]}</div>
          </div>
        </div>
      </div>
    </div>
  );
}