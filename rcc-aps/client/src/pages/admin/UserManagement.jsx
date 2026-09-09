import { useEffect, useState } from 'react';
import { fetchState, saveState } from '../../api/data';
import Modal, { useToast } from '../../components/ui';

const ROLE_PAGE = { 'System Admin': 'adminPage', 'Finance Officer': 'financePage', 'Employee': 'empPage' };
const ROLE_ICON = { 'System Admin': '🔧', 'Finance Officer': '💼', 'Employee': '👤' };
const ROLE_KEY = { 'System Admin': 'admin', 'Finance Officer': 'finance', 'Employee': 'employee' };
const roleBadge = { 'System Admin': 'b-pink', 'Finance Officer': 'b-gold', 'Employee': 'b-blue' };
const roleColor = { 'System Admin': '#880E4F', 'Finance Officer': '#7D5A00', 'Employee': '#1565C0' };

const emptyForm = {
  first: '', last: '', email: '', role: 'Employee', status: 'Active',
  pass: '', classification: 'Non-Teaching', department: '', salary: '',
  hourlyRate: '', hireDate: '', hrsAbs: ''
};

export default function UserManagement() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastNode, showToast] = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErr, setFormErr] = useState('');
  const [viewUser, setViewUser] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => fetchState().then(setState).catch(() => showToast('Failed to load data.', '❌'))
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setFormErr(''); setModalOpen(true); };
  const openEdit = (id) => {
    const u = state.users.find(x => x.id === id);
    setEditingId(id);
    setForm({
      first: u.first, last: u.last, email: u.email, role: u.role, status: u.status,
      pass: '', classification: u.classification || 'Non-Teaching', department: u.department || '',
      salary: u.salary || '', hourlyRate: u.hourlyRate || '', hireDate: u.hireDate || '',
      hrsAbs: u.hoursWorked || u.absenceDays || ''
    });
    setFormErr('');
    setViewUser(null);
    setModalOpen(true);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    const first = form.first.trim(), last = form.last.trim();
    const email = form.email.trim();
    const salary = Math.max(0, parseFloat(form.salary) || 0);
    const hourlyRate = Math.max(0, parseFloat(form.hourlyRate) || 0);
    const hrsAbs = Math.max(0, parseFloat(form.hrsAbs) || 0);
    const hireDate = form.hireDate;

    if (!first || !last) { setFormErr('Please enter first and last name.'); return; }
    if (!email || !email.includes('@')) { setFormErr('Please enter a valid email address.'); return; }
    if (editingId === null && !form.pass.trim()) { setFormErr('Please set an initial password.'); return; }
    if (!salary || salary <= 0) { setFormErr('Please enter a valid monthly basic salary (benefits basis).'); return; }
    if (form.classification === 'Teaching' && (!hourlyRate || hourlyRate <= 0)) { setFormErr('Teaching personnel require a valid hourly rate.'); return; }
    if (!hireDate) { setFormErr('Please set the date of hire (required for 13th Month Pay proration).'); return; }
    const hd = new Date(hireDate + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (isNaN(hd)) { setFormErr('Please enter a valid date of hire.'); return; }
    if (hd > today) { setFormErr('Date of hire cannot be in the future.'); return; }
    const dup = state.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== editingId);
    if (dup) { setFormErr('This email is already in use.'); return; }

    const next = { ...state, users: [...state.users], auth: { ...(state.auth || {}) } };
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (editingId !== null) {
      const u = next.users.find(x => x.id === editingId);
      Object.assign(u, { first, last, email, role: form.role, status: form.status, salary, classification: form.classification, department: form.department, hourlyRate, hireDate });
      if (form.classification === 'Teaching') u.hoursWorked = hrsAbs; else u.absenceDays = hrsAbs;
      ensureAuth(next, u, form.pass.trim());
      showToast(`${first} ${last} updated successfully.`);
    } else {
      const nu = { id: next.nextUserId, first, last, email, role: form.role, status: form.status, date: todayStr, salary, classification: form.classification, department: form.department, hireDate };
      if (form.classification === 'Teaching') nu.hourlyRate = hourlyRate, nu.hoursWorked = hrsAbs; else nu.absenceDays = hrsAbs;
      next.users.push(nu);
      next.nextUserId = (next.nextUserId || 1) + 1;
      ensureAuth(next, nu, form.pass.trim());
      showToast(`${first} ${last} added successfully.`);
    }
    await saveState(next);
    setModalOpen(false);
    load();
  };

  const deactivate = async (id) => {
    const u = state.users.find(x => x.id === id);
    if (!window.confirm(`Deactivate ${u.first} ${u.last}? Their access will be suspended.`)) return;
    const next = { ...state, users: state.users.map(x => x.id === id ? { ...x, status: 'Inactive' } : x) };
    if (next.auth && next.auth[id]) next.auth = { ...next.auth, [id]: { ...next.auth[id], status: 'Inactive' } };
    await saveState(next);
    showToast(`${u.first} ${u.last} deactivated.`);
    load();
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 32 }}>Loading users…</div>;

  const allUsers = state.users || [];
  const filteredUsers = allUsers.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || (u.first + ' ' + u.last).toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchStatus = !statusFilter || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });
  const active = allUsers.filter(u => u.status === 'Active').length;
  const inactive = allUsers.length - active;
  const adminCount = allUsers.filter(u => u.role === 'System Admin').length;
  const financeCount = allUsers.filter(u => u.role === 'Finance Officer').length;
  const employeeCount = allUsers.filter(u => u.role === 'Employee').length;

  return (
    <div>
      {toastNode}
      <div className="pg-title">User Management</div>
      <div className="pg-sub">Create, edit, deactivate, and manage all system user accounts.</div>

      <div className="stats-grid s4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FFF0F0' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="4" fill="#C62828"/><path d="M2 20c0-3.3 2.7-6 6-6h0" stroke="#C62828" strokeWidth="2" strokeLinecap="round"/><circle cx="16" cy="16" r="5" fill="none" stroke="#C62828" strokeWidth="2"/><path d="M14 16h4M16 14v4" stroke="#C62828" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div className="stat-val">{adminCount}</div>
            <div className="stat-lbl">System Admins</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FFF8E8' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" fill="#C9A84C" opacity="0.2"/><rect x="2" y="7" width="20" height="14" rx="2" stroke="#C9A84C" strokeWidth="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#C9A84C" strokeWidth="2"/><path d="M12 12v4M10 14h4" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div className="stat-val">{financeCount}</div>
            <div className="stat-lbl">Finance Officers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EBF5FF' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" fill="#4A90D9"/><path d="M2 20c0-4 3.6-7 7-7h0c3.4 0 7 3 7 7" stroke="#4A90D9" strokeWidth="2" strokeLinecap="round"/><circle cx="17" cy="9" r="3" fill="#85B8E8"/><path d="M14 20c0-3 2.7-5 5-5" stroke="#85B8E8" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div className="stat-val">{employeeCount}</div>
            <div className="stat-lbl">Employees</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#F5F5F5' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="4" height="16" rx="2" fill="#888"/><rect x="14" y="4" width="4" height="16" rx="2" fill="#888"/></svg>
          </div>
          <div>
            <div className="stat-val">{inactive}</div>
            <div className="stat-lbl">Inactive</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">👥 All Users</div>
          <div className="toolbar">
            <div className="search-wrap"><span className="search-icon">🔍</span><input className="search-inp" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <select className="fi" style={{ width: 150 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option>System Admin</option>
              <option>Finance Officer</option>
              <option>Employee</option>
            </select>
            <select className="fi" style={{ width: 130 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <button className="btn btn-primary" onClick={openAdd}>➕ Add User</button>
          </div>
        </div>
        <div style={{ padding: 0 }}>
          <table>
            <thead>
              <tr><th>USER</th><th>EMAIL</th><th>ROLE</th><th>STATUS</th><th>DATE ADDED</th><th>ACTIONS</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: roleColor[u.role], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {(u.first || '')[0]}{(u.last || '')[0] || ''}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{u.first} {u.last}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                  <td><span className={'badge ' + (roleBadge[u.role] || 'b-gray')}>{u.role}</span></td>
                  <td><span className={'badge ' + (u.status === 'Active' ? 'b-green' : 'b-gray')}>{u.status === 'Active' ? '● Active' : '● Inactive'}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.date || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setViewUser(u)} className="btn btn-outline btn-sm">View</button>
                      <button onClick={() => openEdit(u.id)} className="btn btn-outline btn-sm">Edit</button>
                      {u.status === 'Active' && <button onClick={() => deactivate(u.id)} className="btn btn-outline btn-sm" style={{ color: '#C62828', borderColor: '#EF9A9A' }}>Deactivate</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan="6">
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-title">No users found</div>
                    <div>Adjust your search or filters.</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} title={editingId === null ? 'Add New User' : 'Edit User'} onClose={() => setModalOpen(false)}
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn btn-outline">Cancel</button>
          <button onClick={save} className="btn btn-primary">{editingId === null ? 'Add User' : 'Save Changes'}</button>
        </>} maxWidth="680px">
        {formErr && <div style={{ background: '#FFF0F0', border: '1px solid #F5C6C6', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#8B1A1A', marginBottom: 16 }}>{formErr}</div>}
        <div className="fg-row" style={{ marginBottom: 18 }}>
          <div><label className="fl">First Name</label><input className="fi" value={form.first} onChange={e => set('first', e.target.value)} /></div>
          <div><label className="fl">Last Name</label><input className="fi" value={form.last} onChange={e => set('last', e.target.value)} /></div>
        </div>
        <div className="fg"><label className="fl">Email</label><input className="fi" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@rcc.edu.ph" /></div>
        <div className="fg-row" style={{ marginBottom: 18 }}>
          <div><label className="fl">Role</label>
            <select className="fi" value={form.role} onChange={e => set('role', e.target.value)}>
              <option>Employee</option><option>Finance Officer</option><option>System Admin</option>
            </select>
          </div>
          <div><label className="fl">Status</label>
            <select className="fi" value={form.status} onChange={e => set('status', e.target.value)}>
              <option>Active</option><option>Inactive</option>
            </select>
          </div>
        </div>
        {editingId === null && (
          <div className="fg"><label className="fl">Initial Password</label><input type="text" className="fi" value={form.pass} onChange={e => set('pass', e.target.value)} /></div>
        )}
        <div className="fg-row" style={{ marginBottom: 18 }}>
          <div><label className="fl">Classification</label>
            <select className="fi" value={form.classification} onChange={e => set('classification', e.target.value)}>
              <option>Non-Teaching</option><option>Teaching</option>
            </select>
          </div>
          <div><label className="fl">Department</label><input className="fi" value={form.department} onChange={e => set('department', e.target.value)} /></div>
        </div>
        <div className="fg-row" style={{ marginBottom: 18 }}>
          <div><label className="fl">Monthly Basic Salary (₱)</label><input type="number" className="fi" value={form.salary} onChange={e => set('salary', e.target.value)} /></div>
          <div><label className="fl">Date of Hire</label><input type="date" className="fi" value={form.hireDate} onChange={e => set('hireDate', e.target.value)} /></div>
        </div>
        {form.classification === 'Teaching' && (
          <div className="fg"><label className="fl">Hourly Rate (₱)</label><input type="number" className="fi" value={form.hourlyRate} onChange={e => set('hourlyRate', e.target.value)} /></div>
        )}
        <div className="fg">
          <label className="fl">{form.classification === 'Teaching' ? 'Default Hours Worked (/month)' : 'Default Absences (days/month)'}</label>
          <input type="number" className="fi" value={form.hrsAbs} onChange={e => set('hrsAbs', e.target.value)} placeholder={form.classification === 'Teaching' ? 'e.g. 150' : 'e.g. 0'} />
        </div>
      </Modal>

      <Modal open={!!viewUser} title="User Details" onClose={() => setViewUser(null)}
        footer={<>
          <button onClick={() => { setViewUser(null); openEdit(viewUser?.id); }} className="btn btn-primary btn-sm">Edit</button>
          <button onClick={() => setViewUser(null)} className="btn btn-outline btn-sm">Close</button>
        </>} maxWidth="560px">
        {viewUser && <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: roleColor[viewUser.role], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
              {viewUser.first[0]}{viewUser.last[0]}
            </div>
            <div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, fontWeight: 700, color: 'var(--maroon-dark)' }}>{viewUser.first} {viewUser.last}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>#USR-00{viewUser.id} · Added {viewUser.date}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--gold-pale)' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Email</div><div style={{ fontWeight: 600 }}>{viewUser.email}</div></div>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--gold-pale)' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Role</div><div><span className={'badge ' + roleBadge[viewUser.role]}>{viewUser.role}</span></div></div>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--gold-pale)' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Status</div><div><span className={'badge ' + (viewUser.status === 'Active' ? 'b-green' : 'b-gray')}>{viewUser.status}</span></div></div>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--gold-pale)' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Classification</div><div><span className={'badge ' + (viewUser.classification === 'Teaching' ? 'b-blue' : 'b-gold')}>{viewUser.classification || 'Non-Teaching'}</span></div></div>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--gold-pale)' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Department</div><div style={{ fontWeight: 600 }}>{viewUser.department || '—'}</div></div>
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--gold-pale)' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Monthly Base</div><div style={{ fontWeight: 600 }}>₱{(viewUser.salary || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div></div>
            {viewUser.classification === 'Teaching'
              ? <div style={{ padding: 10, borderRadius: 8, background: 'var(--gold-pale)' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Hourly Rate</div><div style={{ fontWeight: 600 }}>₱{(viewUser.hourlyRate || 0).toFixed(2)}</div></div>
              : <div style={{ padding: 10, borderRadius: 8, background: 'var(--gold-pale)' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Date Hired</div><div style={{ fontWeight: 600 }}>{viewUser.hireDate || '—'}</div></div>}
            {viewUser.classification === 'Teaching'
              ? <div style={{ padding: 10, borderRadius: 8, background: 'var(--gold-pale)' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Hours Worked</div><div style={{ fontWeight: 600 }}>{(viewUser.hoursWorked || 0)} hrs</div></div>
              : <div style={{ padding: 10, borderRadius: 8, background: 'var(--gold-pale)' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Absence Days</div><div style={{ fontWeight: 600 }}>{(viewUser.absenceDays || 0)} days</div></div>}
            <div style={{ padding: 10, borderRadius: 8, background: 'var(--gold-pale)' }}><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Hire Date</div><div style={{ fontWeight: 600 }}>{viewUser.hireDate || '—'}</div></div>
          </div>
        </>}
      </Modal>
    </div>
  );
}

function ensureAuth(state, u, pass) {
  let entry = Object.values(state.auth || {}).find(a => a.id === u.id);
  if (!entry) { entry = { id: u.id }; state.auth['u' + u.id] = entry; }
  entry.email = u.email.toLowerCase();
  if (pass) entry.pass = pass;
  entry.label = u.role;
  entry.icon = ROLE_ICON[u.role] || '👤';
  entry.page = ROLE_PAGE[u.role] || 'empPage';
  entry.role = ROLE_KEY[u.role] || 'employee';
  entry.status = u.status || 'Active';
  return entry;
}
