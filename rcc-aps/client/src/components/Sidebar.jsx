import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV = {
  employee: [
    {
      label: 'Main Menu',
      items: [
        { to: '/employee', icon: '🏠', label: 'Dashboard', end: true },
        { to: '/employee/payslip', icon: '📄', label: 'My Payslip' },
        { to: '/employee/profile', icon: '👤', label: 'My Profile' },
        { to: '/employee/password', icon: '🔑', label: 'Change Password' }
      ]
    }
  ],
  finance: [
    {
      label: 'Main Menu',
      items: [
        { to: '/finance', icon: '🏠', label: 'Dashboard', end: true },
        { to: '/finance/analytics', icon: '📊', label: 'Analytics' },
        { to: '/finance/payroll', icon: '💰', label: 'Payroll Calculation' },
        { to: '/finance/bonus', icon: '🎁', label: 'Bonus Management' },
        { to: '/finance/reports', icon: '📋', label: 'Reports' },
        { to: '/finance/deductions', icon: '⚙️', label: 'Deduction Tables' }
      ]
    },
    {
      label: 'My Employee Info',
      items: [
        { to: '/finance/payslip', icon: '📄', label: 'My Payslip' },
        { to: '/finance/profile', icon: '👤', label: 'My Profile' },
        { to: '/finance/password', icon: '🔑', label: 'Change Password' }
      ]
    }
  ],
  admin: [
    {
      label: 'Main Menu',
      items: [
        { to: '/admin', icon: '🏠', label: 'Dashboard', end: true },
        { to: '/admin/users', icon: '👥', label: 'User Management' },
        { to: '/admin/deductions', icon: '⚙️', label: 'Deduction Tables' }
      ]
    },
    {
      label: 'My Employee Info',
      items: [
        { to: '/admin/payslip', icon: '📄', label: 'My Payslip' },
        { to: '/admin/profile', icon: '👤', label: 'My Profile' },
        { to: '/admin/password', icon: '🔑', label: 'Change Password' }
      ]
    }
  ]
};

export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleKey = user?.role === 'System Admin' || user?.role === 'admin' ? 'admin' : user?.role === 'Finance Officer' || user?.role === 'finance' ? 'finance' : 'employee';
  const sections = NAV[roleKey] || NAV.employee;
  const initials = (user?.label || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sb-logo" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <img src="/RCC_LOGO.png" alt="RCC Logo" style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(201,168,76,0.5)', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }} />
        <div className="sb-logo-text">
          <div className="sys">RCC-APS</div>
          <div className="sub">Payroll System</div>
        </div>
      </div>

      {sections.map(sec => (
        <div className="nav-sec" key={sec.label}>
          <div className="nav-lbl">{sec.label}</div>
          {sec.items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}

      <div className="sb-footer">
        <button className="logout-btn" onClick={handleLogout}><span style={{ fontSize: 16 }}>🚪</span> Log Out</button>
      </div>
    </aside>
  );
}