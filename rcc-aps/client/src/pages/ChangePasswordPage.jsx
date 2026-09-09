import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { changePassword } from '../api/auth';
import { useToast } from '../components/ui';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const [toastNode, showToast] = useToast();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [conf, setConf] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const isEmp = user?.role === 'employee' || user?.role === 'Employee';

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    if (!cur) { setErr('Please enter your current password.'); return; }
    if (next.length < 8) { setErr('Password must be at least 8 characters long.'); return; }
    if (next !== conf) { setErr('New password and confirm password do not match.'); return; }
    setLoading(true);
    try {
      await changePassword(cur, next);
      setCur(''); setNext(''); setConf('');
      showToast('Password changed successfully!');
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const body = (
    <div style={{ maxWidth: isEmp ? 480 : 520 }}>
      <div className="card" style={{ marginBottom: 0 }}>
        {isEmp && <div className="card-head"><div className="card-title">🔑 Update Password</div></div>}
        <div className="card-body">
          <div className="fg"><label className="fl">Current Password</label><input className="fi" type="password" value={cur} onChange={e => setCur(e.target.value)} placeholder="Enter current password" /></div>
          <div className="fg"><label className="fl">New Password</label><input className="fi" type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="Enter new password" /></div>
          <div className="fg"><label className="fl">Confirm New Password</label><input className="fi" type="password" value={conf} onChange={e => setConf(e.target.value)} placeholder="Re-enter new password" /></div>
          <div style={{ background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#6D4C00', marginBottom: 12 }}>
            ⚠️ Password must be at least 8 characters long.
          </div>
          <div className={'modal-err' + (err ? ' show' : '')}>{err}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={save} disabled={loading}>🔑 {loading ? 'Updating…' : 'Update Password'}</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isEmp) return (
    <div>{toastNode}<div className="pg-title">Change Password</div><div className="pg-sub">Keep your account secure by updating your password regularly.</div>{body}</div>
  );

  return (
    <div>
      {toastNode}
      <div className="pg-title">Change Password</div>
      <div className="pg-sub">Update your account password for security.</div>
      {body}
    </div>
  );
}