import { useEffect, useState } from 'react';
import { fetchState, saveState } from '../../api/data';
import { syncHris } from '../../api/data';
import Modal, { useToast, BackLink, EmptyState } from '../../components/ui';

const timeOf = iso => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); } catch { return '—'; }
};
const num = v => parseFloat(v) || 0;
const peso = v => '₱' + num(v).toLocaleString('en-PH', { minimumFractionDigits: 2 });

export default function FinanceDeductions() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastNode, showToast] = useToast();
  const [view, setView] = useState('');


  const [workDays, setWorkDays] = useState(22);


  const [catModal, setCatModal] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', type: 'fixed', amount: '', desc: '', status: 'Active' });
  const [ltModal, setLtModal] = useState(false);
  const [ltForm, setLtForm] = useState({ name: '', isPaid: true });
  const [lrModal, setLrModal] = useState(false);
  const [lrForm, setLrForm] = useState({ empId: '', typeId: '', startDate: '', endDate: '', days: '' });
  const [agency, setAgency] = useState(null);
  const [agencyForm, setAgencyForm] = useState(null);
  const [err, setErr] = useState('');

  const load = () => fetchState().then(st => { setState(st); setWorkDays(st.workDays || 22); }).catch(() => showToast('Failed to load data.')) .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async next => { await saveState(next); setState(next); };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading deduction tables…</div>;
  if (!state) return <div style={{ color: '#C62828' }}>Failed to load data.</div>;

  const users = state.users || [];
  const nameOf = id => { const u = users.find(x => x.id === id); return u ? `${u.first} ${u.last}` : '—'; };
  const ltName = id => (state.leaveTypes || []).find(l => l.id === id)?.name || '—';
  const ltPaid = id => !!(state.leaveTypes || []).find(l => l.id === id)?.isPaid;


  const openAgency = (which) => {
    if (which === 'SSS') setAgencyForm((state.sssTable || []).map(r => ({ ...r, emp: String(r.emp), er: String(r.er) })));
    else if (which === 'PhilHealth') setAgencyForm({ ...state.philData });
    else if (which === 'PagIBIG') setAgencyForm({ ...state.pagData });
    else if (which === 'BIR') setAgencyForm((state.birData || []).map(r => ({ ...r, base: String(r.base), rate: String(r.rate) })));
    setErr('');
    setAgency(which);
  };

  const saveAgency = async () => {
    const next = { ...state };
    try {
      if (agency === 'SSS') next.sssTable = agencyForm.map(r => ({ range: r.range, min: num(r.min), max: num(r.max), emp: num(r.emp), er: num(r.er) }));
      if (agency === 'PhilHealth') { const f = agencyForm; next.philData = { rate: num(f.rate), min: num(f.min), max: num(f.max), floor: num(f.floor), ceiling: num(f.ceiling) }; }
      if (agency === 'PagIBIG') { const f = agencyForm; next.pagData = { rate1: num(f.rate1), rate2: num(f.rate2), empMax: num(f.empMax), erMax: num(f.erMax) }; }
      if (agency === 'BIR') next.birData = agencyForm.map(r => ({ range: r.range, min: num(r.min), max: num(r.max), base: num(r.base), rate: num(r.rate) }));
      await save(next);
      setAgency(null);
      showToast(`${agency} rates saved — applies on the next payroll cycle.`);
    } catch { setErr('Failed to save. Please try again.'); }
  };

  const saveWorkDays = async () => {
    const next = { ...state, workDays: Math.max(0, num(workDays)) };
    await save(next);
    showToast(`Working days set to ${next.workDays}.`);
  };


  const openCat = (c) => { setCatForm(c ? { name: c.name, type: c.type, amount: String(c.amount), desc: c.desc || '', status: c.status } : { name: '', type: 'fixed', amount: '', desc: '', status: 'Active' }); setErr(''); setCatModal(c ? c.id : null); };
  const saveCat = async () => {
    const n = catForm.name.trim();
    if (!n) { setErr('Please enter a category name.'); return; }
    const next = { ...state, deductionCategories: [...(state.deductionCategories || [])] };
    if (catModal !== null) {
      const c = next.deductionCategories.find(x => x.id === catModal);
      Object.assign(c, { name: n, type: catForm.type, amount: num(catForm.amount), desc: catForm.desc, status: catForm.status });
    } else {
      next.deductionCategories.push({ id: next.nextDedCatId, name: n, type: catForm.type, amount: num(catForm.amount), desc: catForm.desc, status: catForm.status });
      next.nextDedCatId = (next.nextDedCatId || 1) + 1;
    }
    await save(next);
    setCatModal(null);
    showToast(`Deduction category saved.`);
  };
  const removeCat = async (id) => {
    if (!window.confirm('Remove this deduction category?')) return;
    const next = { ...state, deductionCategories: (state.deductionCategories || []).filter(x => x.id !== id) };
    await save(next);
    showToast('Deduction category removed.');
  };


  const saveLeaveType = async () => {
    const n = ltForm.name.trim();
    if (!n) { setErr('Please enter a leave type name.'); return; }
    const next = { ...state, leaveTypes: [...(state.leaveTypes || [])] };
    if (ltModal) {
      const l = next.leaveTypes.find(x => x.id === ltModal);
      if (l) Object.assign(l, { name: n, isPaid: ltForm.isPaid });
    } else {
      next.leaveTypes.push({ id: next.nextLeaveTypeId, name: n, isPaid: ltForm.isPaid });
      next.nextLeaveTypeId = (next.nextLeaveTypeId || 1) + 1;
    }
    await save(next);
    setLtModal(false);
    showToast('Leave type saved.');
  };
  const openLt = (l) => { setLtForm(l ? { name: l.name, isPaid: !!l.isPaid } : { name: '', isPaid: true }); setErr(''); setLtModal(l ? l.id : true); };
  const removeLeaveType = async (id) => {
    if (!window.confirm('Remove this leave type?')) return;
    const next = { ...state, leaveTypes: (state.leaveTypes || []).filter(x => x.id !== id) };
    await save(next);
    showToast('Leave type removed.');
  };


  const saveLeaveRecord = async () => {
    if (!lrForm.empId) { setErr('Select an employee.'); return; }
    if (!lrForm.typeId) { setErr('Select a leave type.'); return; }
    if (!lrForm.startDate || !lrForm.endDate) { setErr('Select start and end dates.'); return; }
    if (lrForm.startDate > lrForm.endDate) { setErr('End date must be on or after the start date.'); return; }
    const next = { ...state, leaveRecords: [...(state.leaveRecords || [])] };
    if (lrModal) {
      const l = next.leaveRecords.find(x => x.id === lrModal);
      if (l) Object.assign(l, { empId: num(lrForm.empId), typeId: num(lrForm.typeId), startDate: lrForm.startDate, endDate: lrForm.endDate, days: num(lrForm.days) || 1 });
    } else {
      next.leaveRecords.push({ id: next.nextLeaveRecordId, empId: num(lrForm.empId), typeId: num(lrForm.typeId), startDate: lrForm.startDate, endDate: lrForm.endDate, days: num(lrForm.days) || 1 });
      next.nextLeaveRecordId = (next.nextLeaveRecordId || 1) + 1;
    }
    await save(next);
    setLrModal(false);
    showToast('Leave record saved.');
  };
  const openLr = (l) => { setLrForm(l ? { empId: l.empId, typeId: l.typeId, startDate: l.startDate, endDate: l.endDate, days: l.days } : { empId: '', typeId: '', startDate: '', endDate: '', days: '' }); setErr(''); setLrModal(l ? l.id : true); };
  const removeLeaveRecord = async (id) => {
    if (!window.confirm('Remove this leave record?')) return;
    const next = { ...state, leaveRecords: (state.leaveRecords || []).filter(x => x.id !== id) };
    await save(next);
    showToast('Leave record removed.');
  };

  const importHris = async () => {
    try {
      const res = await syncHris();
      const next = { ...state, attendance: res.attendance || state.attendance };
      if (res.leaveRecords && res.leaveRecords.length && state.leaveRecords) {
        const have = new Set(state.leaveRecords.map(r => r.empId + '_' + r.typeId + '_' + r.startDate + '_' + r.endDate));
        const fresh = (res.leaveRecords || []).filter(r => !have.has(r.empId + '_' + r.typeId + '_' + r.startDate + '_' + r.endDate));
        next.leaveRecords = [...state.leaveRecords, ...fresh.map((r, i) => ({ id: (state.nextLeaveRecordId || 1) + i, empId: r.empId, typeId: r.typeId, startDate: r.startDate, endDate: r.endDate, days: r.days || 1 }))];
        next.nextLeaveRecordId = (state.nextLeaveRecordId || 1) + fresh.length;
      }
      await save(next);
      showToast(`HRIS sync complete — ${res.attendance ? res.attendance.length : 0} attendance records imported.`);
    } catch { showToast('HRIS sync failed.', '⚠️'); }
  };


  const cards = [
    ['SSS', 'Social Security System', 'Republic Act No. 11199 • 60 salary brackets'],
    ['PhilHealth', 'Philippine Health Insurance Corp.', 'Republic Act No. 11223 • 5% premium rate'],
    ['PagIBIG', 'Home Development Mutual Fund', 'Republic Act No. 9679 • Max ₱100/month'],
    ['BIR', 'Bureau of Internal Revenue', 'TRAIN Law • RA 10963 • 6 tax brackets']
  ].map(([k, full, note]) => (
    <div key={k} className="card" onClick={() => setView(k)} style={{ cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }} onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
      <div className="card-body" style={{ textAlign: 'center', padding: '40px 32px' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: 'var(--maroon-dark)', marginBottom: 8 }}>{k === 'PagIBIG' ? 'Pag-IBIG Fund' : k}</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>{full}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>{note}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--maroon-dark)', color: '#fff', padding: '11px 28px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>View Table <span>→</span></div>
      </div>
    </div>
  ));

  const categoryList = state.deductionCategories || [];
  const leaveTypesList = state.leaveTypes || [];
  const leaveRecordsList = state.leaveRecords || [];
  const attendanceList = state.attendance || [];

  return (
    <div>
      {toastNode}

      {view === '' && (
        <>
          <div className="pg-title">Deduction Tables</div>
          <div className="pg-sub">Select a government agency to view and update its contribution rates. Changes apply to the next payroll processing cycle.</div>

          <div style={{ background: 'linear-gradient(135deg,var(--maroon-dark),var(--maroon))', borderRadius: 14, padding: '16px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28 }}>📋</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Government Contribution Rates — 2026</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>SSS • PhilHealth • Pag-IBIG • BIR TRAIN Law — Last verified: May 2026</div>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 12, fontWeight: 600 }}>✅ All rates up to date</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {cards}
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-head">
              <div>
                <div className="card-title">🧮 Payroll Basis — Working Days per Month</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Divisor used to price one absence day for monthly-paid (Non-Teaching) staff</div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
                <div className="fg" style={{ minWidth: 220, marginBottom: 0 }}>
                  <label className="fl">Working Days per Month</label>
                  <input className="fi" type="number" step="0.5" min="1" max="31" value={workDays} onChange={e => setWorkDays(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={saveWorkDays}>💾 Save</button>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Formula: Gross = Monthly Salary − (Absences ÷ {workDays} × Monthly Salary).
                The standard convention is <strong>22 working days per month</strong> — a fixed divisor keeps the daily absence value consistent across all months, since actual Mon–Fri days vary (20–23) and holidays remain paid for monthly-rate employees.
                Teaching staff are paid hourly and are not affected by this setting.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, background: '#EFF8FF', border: '1px solid #B3D9FF', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 20 }}>ℹ️</div>
            <div style={{ fontSize: 13, color: '#1A4A7A', lineHeight: 1.7 }}>
              <strong>Important Reminder:</strong> Government contribution rates are subject to change. Always verify current rates with the official SSS, PhilHealth, Pag-IBIG, and BIR portals before processing payroll. Quarterly audits are recommended.
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-head">
              <div>
                <div className="card-title">Other Deduction Categories</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Custom deductions applied on top of mandatory government contributions — Active categories are deducted from every payroll run and shown on payslips</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openCat(null)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>+ Add Category</button>
            </div>
            <div className="card-body">
              {categoryList.length === 0 ? (
                <EmptyState icon="📂" title="No custom deduction categories yet" sub="Add a new deduction category to get started." />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {categoryList.map(c => (
                    <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--maroon-dark)', fontSize: 14 }}>{c.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{c.desc || '—'}</div>
                        </div>
                        <span className={'badge ' + (c.status === 'Active' ? 'b-green' : 'b-gray')}>{c.status}</span>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 13 }}>
                        <span style={{ display: 'inline-block', background: 'var(--gold-pale)', border: '1px solid var(--gold)', borderRadius: 8, padding: '4px 12px', fontWeight: 700, color: 'var(--maroon-dark)' }}>
                          {c.type === 'percent' ? num(c.amount) + '% of gross' : peso(c.amount)}
                        </span>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openCat(c)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => removeCat(c.id)}>🗑️ Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-head">
              <div>
                <div className="card-title">📅 Leave Types Configuration</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Configure which leave types are paid or unpaid. Paid leaves do not reduce gross pay; unpaid leaves are deducted. New leave types from HRIS are auto-added as unpaid by default.</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openLt(null)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>+ Add Leave Type</button>
            </div>
            <div className="card-body">
              {leaveTypesList.length === 0 ? (
                <EmptyState icon="📅" title="No leave types configured" sub="Add leave types to configure paid/unpaid status." />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {leaveTypesList.map(l => (
                    <div key={l.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--maroon-dark)', fontSize: 14 }}>{l.name}</div>
                        <span className={'badge ' + (l.isPaid ? 'b-green' : 'b-red')} style={{ marginTop: 6 }}>{l.isPaid ? '💰 Paid' : '⛔ Unpaid'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openLt(l)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => removeLeaveType(l.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-head">
              <div>
                <div className="card-title">📋 Leave Records</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Assign leave (with dates) to employees. These appear automatically in the Payroll Calculator's Leave Breakdown and are added to absences. Records imported from the HRIS sync also appear here and are never duplicated.</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openLr(null)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>+ Add Leave Record</button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {leaveRecordsList.length === 0 ? (
                <EmptyState icon="📋" title="No leave records yet" sub="Add a leave record so its breakdown appears in the Payroll Calculator." />
              ) : (
                <table>
                  <thead><tr><th>Employee</th><th>Leave Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {leaveRecordsList.map(r => (
                      <tr key={r.id}>
                        <td><strong>{nameOf(r.empId)}</strong></td>
                        <td>{ltName(r.typeId)} <span className={'badge ' + (ltPaid(r.typeId) ? 'b-green' : 'b-red')}>({ltPaid(r.typeId) ? 'Paid' : 'Unpaid'})</span></td>
                        <td>{r.startDate} → {r.endDate}</td>
                        <td>{r.days} day{r.days > 1 ? 's' : ''}</td>
                        <td><span className="badge b-green">● On file</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openLr(r)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => removeLeaveRecord(r.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-head">
              <div>
                <div className="card-title">🕒 Attendance (clock-in / clock-out)</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Daily clock-in/out imported from the HRIS sync. Absence is auto-detected: a workday with no clock-in and no approved leave is counted as absent (unpaid, 8 hours = 1 day). Hours worked for Teaching staff is computed from these records.</div>
              </div>
              <button className="btn btn-outline" onClick={importHris} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>🔄 Import from HRIS</button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {attendanceList.length === 0 ? (
                <EmptyState icon="🕒" title="No attendance records yet" sub="Import clock-in/out from the HRIS to enable absence and hours auto-detection." action={<button className="btn btn-outline btn-sm" onClick={importHris}>🔄 Import Attendance from HRIS</button>} />
              ) : (
                <table>
                  <thead><tr><th>Employee</th><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Hours</th></tr></thead>
                  <tbody>
                    {attendanceList.map((a, i) => (
                      <tr key={i}>
                        <td><strong>{a.employeeEmail || nameOf(a.empId)}</strong></td>
                        <td>{a.date}</td>
                        <td>{timeOf(a.clockInAt)}</td>
                        <td>{timeOf(a.clockOutAt)}</td>
                        <td><strong>{num(a.hours)} hrs</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {view === 'SSS' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <BackLink onClick={() => setView('')}>Back to Deduction Tables</BackLink>
          </div>
          <div className="pg-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>🏛️ SSS Contribution Table</div>
          <div className="pg-sub">Republic Act No. 11199 • Effective Jan 2025 • 5% Employee + 10% Employer = 15% of MSC</div>
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-head">
              <div>
                <div className="card-title">Monthly Salary Credit Contribution Table</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>19 salary brackets — Employee + Employer shares</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => openAgency('SSS')}>✏️ Edit All Brackets</button>
            </div>
            <table>
              <thead><tr><th>#</th><th>Monthly Salary Credit Range</th><th>Employee Share</th><th>Employer Share</th><th>Total Contribution</th></tr></thead>
              <tbody>
                {(state.sssTable || []).map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td><strong>{r.range}</strong></td>
                    <td>{peso(r.emp)}</td>
                    <td>{peso(r.er)}</td>
                    <td><strong>{peso(num(r.emp) + num(r.er))}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '10px 16px', background: '#F9F7F4', borderTop: '1px solid #EEE8E0', fontSize: 12, color: 'var(--text-muted)' }}>
              <strong>Note (2026):</strong> Minimum MSC: ₱5,000. Maximum MSC: ₱35,000. Rate: 15% total (5% Employee + 10% Employer). Source: SSS Circular 2024-006, effective January 2025.
            </div>
          </div>
          <div style={{ marginTop: 16, background: '#EFF8FF', border: '1px solid #B3D9FF', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 12 }}>
            <div style={{ fontSize: 20 }}>ℹ️</div>
            <div style={{ fontSize: 13, color: '#1A4A7A', lineHeight: 1.7 }}>Always verify SSS contribution tables with the official SSS portal at <strong>www.sss.gov.ph</strong> before each payroll cycle.</div>
          </div>
        </>
      )}

      {view === 'PhilHealth' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <BackLink onClick={() => setView('')}>Back to Deduction Tables</BackLink>
          </div>
          <div className="pg-title">🏥 PhilHealth Premium Contribution</div>
          <div className="pg-sub">Republic Act No. 11223 • Universal Health Care Act • 2026 Premium Rate</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Current Premium Rate</div>
                <button className="btn btn-outline btn-sm" onClick={() => openAgency('PhilHealth')}>✏️ Edit Rates</button>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: 'var(--maroon-dark)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Total Rate</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: '#fff' }}>{num(state.philData.rate).toFixed(2)}%</div>
                  </div>
                  <div style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Employee Share</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: 'var(--maroon-dark)' }}>{num(state.philData.rate) / 2}%</div>
                  </div>
                  <div style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Employer Share</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: 'var(--maroon-dark)' }}>{num(state.philData.rate) / 2}%</div>
                  </div>
                </div>
                <table>
                  <thead><tr><th>Category</th><th>Amount</th></tr></thead>
                  <tbody>
                    <tr><td>Minimum Monthly Premium</td><td><strong>{peso(state.philData.min)}</strong></td></tr>
                    <tr><td>Maximum Monthly Premium</td><td><strong>{peso(state.philData.max)}</strong></td></tr>
                    <tr><td>Salary Floor (Min Base)</td><td><strong>{peso(state.philData.floor)}</strong></td></tr>
                    <tr><td>Salary Ceiling (Max Base)</td><td><strong>{peso(state.philData.ceiling)}</strong></td></tr>
                  </tbody>
                </table>
                <div style={{ padding: '10px 16px', background: '#F9F7F4', borderTop: '1px solid #EEE8E0', fontSize: 12, color: 'var(--text-muted)' }}>
                  <strong>Formula:</strong> Basic Monthly Salary × {num(state.philData.rate).toFixed(2)}% ÷ 2 = Employee Share
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><div className="card-title">Computation Example</div></div>
              <div className="card-body">
                <table>
                  <thead><tr><th>Monthly Salary</th><th>Employee Share</th></tr></thead>
                  <tbody>
                    {[15000, 25000, 40000, 100000].map(s => (
                      <tr key={s}>
                        <td>{peso(s)}</td>
                        <td><strong>{peso(Math.min(s * num(state.philData.rate) / 100 / 2, num(state.philData.max)))}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {view === 'PagIBIG' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <BackLink onClick={() => setView('')}>Back to Deduction Tables</BackLink>
          </div>
          <div className="pg-title">🏠 Pag-IBIG Fund (HDMF)</div>
          <div className="pg-sub">Republic Act No. 9679 • Home Development Mutual Fund • Maximum ₱100/month employee share</div>
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-head">
              <div className="card-title">Contribution Rate Table</div>
              <button className="btn btn-outline btn-sm" onClick={() => openAgency('PagIBIG')}>✏️ Edit Rates</button>
            </div>
            <table>
              <thead><tr><th>Monthly Compensation</th><th>Employee Rate</th><th>Max Employee Share</th></tr></thead>
              <tbody>
                <tr><td>₱1,500 and below</td><td>{state.pagData.rate1}%</td><td>{peso(Math.min(1500 * num(state.pagData.rate1) / 100, num(state.pagData.empMax)))}</td></tr>
                <tr><td>Above ₱1,500</td><td><strong>{state.pagData.rate2}%</strong></td><td><strong>{peso(state.pagData.empMax)}</strong></td></tr>
              </tbody>
            </table>
            <div style={{ padding: '12px 16px', background: '#F9F7F4', fontSize: 12, color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #EEE8E0' }}><span>Max Employee Contribution</span><span><strong>{peso(state.pagData.empMax)} / month</strong></span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #EEE8E0' }}><span>Max Employer Contribution</span><span><strong>{peso(state.pagData.erMax)} / month</strong></span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Employer Share</span><span>Mirrors the employee rate per RA 9679 — not deducted from payroll</span></div>
            </div>
          </div>
        </>
      )}

      {view === 'BIR' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <BackLink onClick={() => setView('')}>Back to Deduction Tables</BackLink>
          </div>
          <div className="pg-title">📋 BIR Withholding Tax</div>
          <div className="pg-sub">TRAIN Law • Republic Act No. 10963 • Annual Income Tax Schedule</div>
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-head">
              <div className="card-title">Annual Income Tax Bracket Table</div>
              <button className="btn btn-outline btn-sm" onClick={() => openAgency('BIR')}>✏️ Edit Brackets</button>
            </div>
            <table>
              <thead><tr><th>#</th><th>Annual Taxable Income</th><th>Base Tax</th><th>Rate on Excess</th><th>Excess Over</th></tr></thead>
              <tbody>
                {(state.birData || []).map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td><strong>{r.range}</strong></td>
                    <td>{num(r.base) === 0 && num(r.rate) === 0 ? <span className="badge b-green">0% — Exempt</span> : peso(r.base)}</td>
                    <td>{num(r.rate)}%</td>
                    <td>{num(r.base) > 0 ? peso(r.base) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '10px 16px', background: '#F9F7F4', borderTop: '1px solid #EEE8E0', fontSize: 12, color: 'var(--text-muted)' }}>
              <strong>Method:</strong> Annualize monthly salary × 12 → apply bracket → annual tax ÷ 12 = monthly BIR deduction.
            </div>
          </div>
          <div style={{ marginTop: 16, background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 12 }}>
            <div style={{ fontSize: 20 }}>⚠️</div>
            <div style={{ fontSize: 13, color: '#6D4C00', lineHeight: 1.7 }}>BIR tax tables are mandated by law. Only update when the BIR officially issues a new TRAIN Law amendment or Revenue Regulation. Verify at <strong>www.bir.gov.ph</strong>.</div>
          </div>
        </>
      )}

      {/* ---------- MODALS ---------- */}
      <Modal open={agency === 'SSS'} title="Edit SSS Rates" onClose={() => setAgency(null)} maxWidth={750} footer={null}>
        {agencyForm && (
          <>
            <div className="table-wrap" style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table>
                <thead><tr><th>Range</th><th>Employee (₱)</th><th>Employer (₱)</th></tr></thead>
                <tbody>
                  {agencyForm.map((r, i) => (
                    <tr key={i}>
                      <td><strong style={{ fontSize: 12 }}>{r.range}</strong></td>
                      <td><input className="fi" type="number" style={{ padding: '6px 8px', width: 110 }} value={r.emp} onChange={e => setAgencyForm(f => f.map((x, j) => j === i ? { ...x, emp: e.target.value } : x))} /></td>
                      <td><input className="fi" type="number" style={{ padding: '6px 8px', width: 110 }} value={r.er} onChange={e => setAgencyForm(f => f.map((x, j) => j === i ? { ...x, er: e.target.value } : x))} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={'modal-err' + (err ? ' show' : '')}>{err}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setAgency(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAgency}>💾 Save Rates</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={agency === 'PhilHealth'} title="Edit PhilHealth Rates" onClose={() => setAgency(null)} maxWidth={520} footer={null}>
        {agencyForm && (
          <>
            {[['rate', 'Premium Rate (%)'], ['min', 'Minimum Monthly Premium (₱)'], ['max', 'Maximum Monthly Premium (₱)'], ['floor', 'Salary Floor (₱)'], ['ceiling', 'Salary Ceiling (₱)']].map(([k, label]) => (
              <div className="fg" key={k}><label className="fl">{label}</label><input className="fi" type="number" value={agencyForm[k]} onChange={e => setAgencyForm(f => ({ ...f, [k]: e.target.value }))} /></div>
            ))}
            <div className={'modal-err' + (err ? ' show' : '')}>{err}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button className="btn btn-outline" onClick={() => setAgency(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAgency}>💾 Save Rates</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={agency === 'PagIBIG'} title="Edit Pag-IBIG Rates" onClose={() => setAgency(null)} maxWidth={520} footer={null}>
        {agencyForm && (
          <>
            {[['rate1', 'Rate ≤ ₱1,500 (%)'], ['rate2', 'Rate > ₱1,500 (%)'], ['empMax', 'Max Employee Share (₱)'], ['erMax', 'Max Employer Share (₱)']].map(([k, label]) => (
              <div className="fg" key={k}><label className="fl">{label}</label><input className="fi" type="number" value={agencyForm[k]} onChange={e => setAgencyForm(f => ({ ...f, [k]: e.target.value }))} /></div>
            ))}
            <div className={'modal-err' + (err ? ' show' : '')}>{err}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button className="btn btn-outline" onClick={() => setAgency(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAgency}>💾 Save Rates</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={agency === 'BIR'} title="Edit BIR Brackets" onClose={() => setAgency(null)} maxWidth={640} footer={null}>
        {agencyForm && (
          <>
            <div className="table-wrap" style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table>
                <thead><tr><th>Range</th><th>Base Tax (₱)</th><th>Rate on Excess (%)</th></tr></thead>
                <tbody>
                  {agencyForm.map((r, i) => (
                    <tr key={i}>
                      <td><strong style={{ fontSize: 12 }}>{r.range}</strong></td>
                      <td><input className="fi" type="number" style={{ padding: '6px 8px', width: 110 }} value={r.base} onChange={e => setAgencyForm(f => f.map((x, j) => j === i ? { ...x, base: e.target.value } : x))} /></td>
                      <td><input className="fi" type="number" style={{ padding: '6px 8px', width: 110 }} value={r.rate} onChange={e => setAgencyForm(f => f.map((x, j) => j === i ? { ...x, rate: e.target.value } : x))} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={'modal-err' + (err ? ' show' : '')}>{err}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setAgency(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAgency}>💾 Save Brackets</button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={catModal !== null} title={catModal === null ? 'Add Deduction Category' : 'Edit Deduction Category'} onClose={() => setCatModal(null)} maxWidth={500} footer={null}>
        <div className="fg"><label className="fl">Category Name <span style={{ color: '#C62828' }}>*</span></label><input className="fi" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter category name" /></div>
        <div className="fg"><label className="fl">Type <span style={{ color: '#C62828' }}>*</span></label>
          <select className="fi" value={catForm.type} onChange={e => setCatForm(f => ({ ...f, type: e.target.value }))}><option value="fixed">Fixed Amount (₱)</option><option value="percent">Percentage of Gross (%)</option></select>
        </div>
        <div className="fg"><label className="fl">{catForm.type === 'fixed' ? 'Default Amount (₱)' : 'Rate (%)'}</label><input className="fi" type="number" step="0.01" min={0} value={catForm.amount} onChange={e => setCatForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 500.00" /></div>
        <div className="fg"><label className="fl">Description <span style={{ color: '#888', fontWeight: 400 }}>(optional)</span></label><input className="fi" value={catForm.desc} onChange={e => setCatForm(f => ({ ...f, desc: e.target.value }))} placeholder="Brief description of this deduction" /></div>
        <div className="fg"><label className="fl">Status</label>
          <select className="fi" value={catForm.status} onChange={e => setCatForm(f => ({ ...f, status: e.target.value }))}><option>Active</option><option>Inactive</option></select>
        </div>
        <div className={'modal-err' + (err ? ' show' : '')}>{err}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button className="btn btn-outline" onClick={() => setCatModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveCat}>💾 Save Category</button>
        </div>
      </Modal>

      <Modal open={ltModal !== false} title={ltModal === true ? 'Add Leave Type' : 'Edit Leave Type'} onClose={() => setLtModal(false)} maxWidth={480} footer={null}>
        <div className="fg"><label className="fl">Leave Type Name <span style={{ color: '#C62828' }}>*</span></label><input className="fi" value={ltForm.name} onChange={e => setLtForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sick Leave, Personal Leave" /></div>
        <div className="fg"><label className="fl">Payment Status <span style={{ color: '#C62828' }}>*</span></label>
          <select className="fi" value={ltForm.isPaid ? 'true' : 'false'} onChange={e => setLtForm(f => ({ ...f, isPaid: e.target.value === 'true' }))}>
            <option value="true">Paid — Does not reduce gross pay</option>
            <option value="false">Unpaid — Deducted from gross pay</option>
          </select>
        </div>
        <div className={'modal-err' + (err ? ' show' : '')}>{err}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button className="btn btn-outline" onClick={() => setLtModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveLeaveType}>💾 Save Leave Type</button>
        </div>
      </Modal>

      <Modal open={lrModal !== false} title={lrModal === true ? 'Add Leave Record' : 'Edit Leave Record'} onClose={() => setLrModal(false)} maxWidth={520} footer={null}>
        <div className="fg"><label className="fl">Employee <span style={{ color: '#C62828' }}>*</span></label>
          <select className="fi" value={lrForm.empId} onChange={e => setLrForm(f => ({ ...f, empId: e.target.value }))}>
            <option value="">— Select employee —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.first} {u.last}</option>)}
          </select>
        </div>
        <div className="fg"><label className="fl">Leave Type <span style={{ color: '#C62828' }}>*</span></label>
          <select className="fi" value={lrForm.typeId} onChange={e => setLrForm(f => ({ ...f, typeId: e.target.value }))}>
            <option value="">— Select leave type —</option>
            {leaveTypesList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label className="fl">Start Date <span style={{ color: '#C62828' }}>*</span></label><input type="date" className="fi" value={lrForm.startDate} onChange={e => setLrForm(f => ({ ...f, startDate: e.target.value }))} /></div>
          <div><label className="fl">End Date <span style={{ color: '#C62828' }}>*</span></label><input type="date" className="fi" value={lrForm.endDate} onChange={e => setLrForm(f => ({ ...f, endDate: e.target.value }))} /></div>
        </div>
        <div className="fg" style={{ marginTop: 12 }}><label className="fl">Days <span style={{ color: '#C62828' }}>*</span></label><input className="fi" type="number" min="0.5" step="0.5" value={lrForm.days} onChange={e => setLrForm(f => ({ ...f, days: e.target.value }))} /></div>
        <div className={'modal-err' + (err ? ' show' : '')}>{err}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button className="btn btn-outline" onClick={() => setLrModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveLeaveRecord}>💾 Save Leave Record</button>
        </div>
      </Modal>
    </div>
  );
}