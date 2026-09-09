import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DEMO = [
  { label: 'System Admin', email: 'admin@rcc.edu.ph', pass: 'admin123' },
  { label: 'Finance Officer', email: 'finance@rcc.edu.ph', pass: 'finance123' },
  { label: 'Employee', email: 'employee@rcc.edu.ph', pass: 'employee123' }
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      const dest = { adminPage: '/admin', financePage: '/finance', empPage: '/employee' }[data.user.page] || '/';
      navigate(dest);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="loginPage">
      <div className="login-left" style={{ width: '43%', background: 'linear-gradient(160deg,#7B1E1E 0%,#4A0E0E 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', top: -80, right: -80 }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', bottom: 100, left: -60 }} />

        <img className="lp-rcc" src="/RCC_LOGO.png" alt="RCC Logo" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', marginBottom: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: '3px solid rgba(201,168,76,0.5)' }} />

        <img src="/APS_LOGO.png" alt="APS Logo" style={{ height: 100, width: 'auto', marginBottom: 12 }} />

        <div style={{ width: 48, height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C,transparent)', marginBottom: 16 }} />

        <div className="lp-tagline" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.7, marginBottom: 36, maxWidth: 280 }}>
          A streamlined payroll management system built<br/>for accuracy, compliance, and transparency.
        </div>

        <div className="lp-feats" style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
          {[
            ['⚡', 'Auto Computation', 'SSS, PhilHealth, Pag-IBIG , BIR & Net Pay'],
            ['🔒', 'Role-Based Access', 'Admin, Finance Officer, Employee'],
            ['📄', 'Digital Payslips', 'View & download in PDF format']
          ].map(([icon, t, sub]) => (
            <div key={t} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, background: 'rgba(201,168,76,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>{t}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="login-right" style={{ flex: 1, background: '#F8F5F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative' }}>
        <div id="loginForm" style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Welcome Back</div>
          <div style={{ fontSize: 15, color: '#888', marginBottom: 36 }}>Sign in to access your RCC-APS dashboard.</div>

          <div className={'err-box' + (error ? ' show' : '')}>
            <span>⚠️&nbsp;</span>
            <span>{error}</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8 }}>Email Address</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid #E0D8D0', borderRadius: 10, overflow: 'hidden' }}>
                <span style={{ padding: '0 14px', fontSize: 16, color: '#aaa' }}>✉</span>
                <input style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 0', fontSize: 14, fontFamily: "'Source Sans 3',sans-serif", background: 'transparent', color: '#222' }} type="email" id="emailInp" placeholder="you@rcc.edu.ph" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8 }}>Password</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid #E0D8D0', borderRadius: 10, overflow: 'hidden' }}>
                <span style={{ padding: '0 14px', fontSize: 16, color: '#aaa' }}>🔑</span>
                <input style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 0', fontSize: 14, fontFamily: "'Source Sans 3',sans-serif", background: 'transparent', color: '#222' }} type={showPw ? 'text' : 'password'} id="passInp" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', padding: '0 14px', cursor: 'pointer', fontSize: 16, color: '#aaa' }}>{showPw ? '🙈' : '👁'}</button>
              </div>
            </div>

            <button type="submit" id="loginBtn" disabled={loading} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg,#6B1A1A,#4A0E0E)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, fontFamily: "'Source Sans 3',sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s', letterSpacing: '0.5px' }}>
              <span>{loading ? 'Signing in…' : 'Sign In'}</span>
              <span style={{ fontSize: 18 }}>→</span>
              <div className="spinner" style={{ display: loading ? 'block' : 'none' }} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: '#999' }}>
            Having trouble logging in? Contact your <a href="#" style={{ color: '#6B1A1A', fontWeight: 600, textDecoration: 'none' }}>System Administrator</a> for assistance.
          </div>

          <div style={{ marginTop: 20, background: '#fff', border: '1px solid #E0D8D0', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#997', marginBottom: 8 }}>Demo Accounts — Tap to fill</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DEMO.map(d => (
                <button key={d.email} type="button" onClick={() => { setEmail(d.email); setPassword(d.pass); setError(''); }}
                  style={{ background: '#F8F5F0', border: '1px solid #E0D8D0', color: '#6B1A1A', padding: '7px 12px', borderRadius: 8, fontSize: 12, fontFamily: "'Source Sans 3',sans-serif", cursor: 'pointer', fontWeight: 600 }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="login-foot" style={{ position: 'absolute', bottom: 24, fontSize: 11, color: '#BBB', textAlign: 'center' }}>
          RCC-APS v1.0 · Republic Central Colleges · College of Computer Studies · © 2026
        </div>
      </div>
    </div>
  );
}