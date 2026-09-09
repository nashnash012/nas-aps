import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchState, saveState } from '../api/data';
import { useToast } from '../components/ui';

const ROLE_LABEL = { admin: 'System Admin', finance: 'Finance Officer', employee: 'Employee' };

export default function ProfilePage() {
  const { user } = useAuth();
  const [toastNode, showToast] = useToast();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const isEmp = user?.role === 'employee' || user?.role === 'Employee';
  const roleKey = user?.role === 'admin' || user?.role === 'System Admin' ? 'admin' : user?.role === 'finance' || user?.role === 'Finance Officer' ? 'finance' : 'employee';

  useEffect(() => {
    fetchState().then(st => {
      setState(st);
      const emp = (st.users || []).find(u => (u.email || '').toLowerCase() === (user?.email || '').toLowerCase()) || (st.users || []).find(u => u.id === user?.id);
      if (emp) setForm({
        first: emp.first, last: emp.last, email: emp.email, department: emp.department || '',
        phone: emp.phone || (isEmp ? '09171234567' : '(+63) 918-555-3076'),
        address: emp.address || (isEmp ? '123 Mabini St., Angeles City, Pampanga' : 'Brgy. Sto. Rosario, Angeles City, Pampanga'),
        emergencyContact: emp.emergencyContact || '—',
        emergencyPhone: emp.emergencyPhone || '—'
      });
    }).finally(() => setLoading(false));
  }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const deriveForm = (emp) => ({
    first: emp.first, last: emp.last, email: emp.email, department: emp.department || '',
    phone: emp.phone || (isEmp ? '09171234567' : '(+63) 918-555-3076'),
    address: emp.address || (isEmp ? '123 Mabini St., Angeles City, Pampanga' : 'Brgy. Sto. Rosario, Angeles City, Pampanga'),
    emergencyContact: emp.emergencyContact || '—',
    emergencyPhone: emp.emergencyPhone || '—'
  });

  const cancel = () => setForm(deriveForm(emp));

  const save = async () => {
    const emp = (state.users || []).find(u => (u.email || '').toLowerCase() === (user?.email || '').toLowerCase()) || (state.users || []).find(u => u.id === user?.id);
    if (!emp) return;
    const next = { ...state, users: state.users.map(u => u.id === emp.id ? { ...u, phone: form.phone, address: form.address, emergencyContact: form.emergencyContact, emergencyPhone: form.emergencyPhone, department: form.department || u.department } : u) };
    await saveState(next);
    setState(next);
    showToast('Profile updated successfully!');
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading profile…</div>;
  const emp = (state.users || []).find(u => (u.email || '').toLowerCase() === (user?.email || '').toLowerCase()) || (state.users || []).find(u => u.id === user?.id);
  if (!form || !emp) return <div style={{ color: 'var(--text-muted)' }}>No employee profile linked to this account.</div>;
  const initials = ((emp.first || '')[0] + ((emp.last || '')[0] || '')).toUpperCase();

  if (isEmp) {
    return (
      <div>
        {toastNode}
        <div className="pg-title">My Profile</div>
        <div className="pg-sub">View and update your personal contact information.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--maroon)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, margin: '0 auto 16px', border: '3px solid var(--gold)' }}>{initials}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: 'var(--maroon-dark)' }}>{emp.first} {emp.last}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{ROLE_LABEL[roleKey]}</div>
              <div style={{ marginTop: 12 }}><span className="badge b-green">● Active</span></div>
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>Employee ID<br /><strong style={{ color: 'var(--text)' }}>#USR-00{emp.id}</strong></div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><div className="card-title">✏️ Edit Contact Information</div></div>
            <div className="card-body">
              <div className="fg-row">
                <div className="fg"><label className="fl">First Name</label><input className="fi" value={form.first} disabled style={{ background: 'var(--bg)', color: 'var(--text-muted)' }} /></div>
                <div className="fg"><label className="fl">Last Name</label><input className="fi" value={form.last} disabled style={{ background: 'var(--bg)', color: 'var(--text-muted)' }} /></div>
              </div>
              <div className="fg"><label className="fl">Email Address</label><input className="fi" value={form.email} disabled style={{ background: 'var(--bg)', color: 'var(--text-muted)' }} /></div>
              <div className="fg-row">
                <div className="fg"><label className="fl">Phone Number</label><input className="fi" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="09XXXXXXXXX" /></div>
                <div className="fg"><label className="fl">Department</label><input className="fi" value={form.department} disabled style={{ background: 'var(--bg)', color: 'var(--text-muted)' }} /></div>
              </div>
              <div className="fg"><label className="fl">Home Address</label><input className="fi" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Enter your home address" /></div>
              <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={save}>💾 Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {toastNode}
      <div className="pg-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>👥 Manage Personal Details</div>
      <div className="pg-sub">Edit your contact and personal information</div>
      <div className="card" style={{ maxWidth: 600, marginTop: 16 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--maroon-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{emp.first} {emp.last}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ROLE_LABEL[roleKey]}</div>
              <button className="btn btn-outline btn-sm" style={{ marginTop: 6, padding: '4px 12px', fontSize: 11 }} onClick={() => showToast('📷', 'Photo upload coming soon.')}>Change photo</button>
            </div>
          </div>
          <div className="fg-row">
            <div className="fg"><label className="fl">First Name</label><input className="fi" value={form.first} onChange={e => set('first', e.target.value)} /></div>
            <div className="fg"><label className="fl">Last Name</label><input className="fi" value={form.last} onChange={e => set('last', e.target.value)} /></div>
          </div>
          <div className="fg"><label className="fl">Email</label><input className="fi" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div className="fg"><label className="fl">Phone</label><input className="fi" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div className="fg"><label className="fl">Address</label><input className="fi" value={form.address} onChange={e => set('address', e.target.value)} /></div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
          <div className="fg-row">
            <div className="fg"><label className="fl">Emergency Contact</label><input className="fi" value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} /></div>
            <div className="fg"><label className="fl">Emergency Phone</label><input className="fi" value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button className="btn btn-outline" onClick={cancel}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>💾 Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}