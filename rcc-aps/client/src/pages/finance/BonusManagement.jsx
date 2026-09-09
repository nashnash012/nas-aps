import { useEffect, useMemo, useState } from 'react';
import { fetchState, saveState } from '../../api/data';
import { fmt, EMP_CLASS, monthsEmployed, avgMonthlyPay, thirteenthEligibility, computeThirteenth, parseDate, normalizeBonusName, isReservedBonusName } from '../../lib/payroll';
import Modal, { useToast } from '../../components/ui';

const kindLabel = { months: 'Months of Pay', fixed: 'Fixed Amount', percent: '% of Gross' };

const emptyType = { name: '', kind: 'fixed', value: '', desc: '', deMinimis: false, releaseDate: '', endDate: '' };

export default function BonusManagement() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastNode, showToast] = useToast();
  const [year, setYear] = useState(new Date().getFullYear());
  const [typeModal, setTypeModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [typeForm, setTypeForm] = useState(emptyType);
  const [typeErr, setTypeErr] = useState('');
  const [exemptLimit, setExemptLimit] = useState('');

  const load = () => fetchState().then(setState).catch(() => showToast('Failed to load data.', '❌')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const bonusTypes = state?.bonusTypes || [];
  const defaultLimit = state?.bonusExemptionLimit || 90000;
  useEffect(() => { if (exemptLimit === '') setExemptLimit(String(defaultLimit)); }, [defaultLimit, exemptLimit]);

  const roster = useMemo(() => (state?.users || []).filter(u => u.salary > 0), [state]);

  const save = async (next) => { await saveState(next); load(); };

  const toggleType = (id) => {
    const b = bonusTypes.find(x => x.id === id);
    const nextStatus = b.status === 'Active' ? 'Inactive' : 'Active';
    const next = { ...state, bonusTypes: bonusTypes.map(x => x.id === id ? { ...x, status: nextStatus } : x) };
    save(next);
    showToast(`"${b.name}" ${nextStatus === 'Active' ? 'activated' : 'disabled'}.`);
  };

  const openAdd = () => { setEditId(null); setTypeForm(emptyType); setTypeErr(''); setTypeModal(true); };
  const openEdit = (id) => {
    const b = bonusTypes.find(x => x.id === id);
    setEditId(id);
    setTypeForm({ name: b.name, kind: b.kind || 'fixed', value: b.value, desc: b.desc || '', deMinimis: !!b.deMinimis, releaseDate: b.releaseDate || '', endDate: b.endDate || '' });
    setTypeErr('');
    setTypeModal(true);
  };

  const saveType = async () => {
    const { name, kind, value, desc, deMinimis, releaseDate, endDate } = typeForm;
    const n = name.trim();
    const v = parseFloat(value) || 0;
    const isStatutory = editId === 1;
    if (!n) { setTypeErr('Please enter a bonus name.'); return; }
    if (!v || v <= 0) { setTypeErr('Please enter a valid multiplier or amount.'); return; }
    if (releaseDate && isNaN(parseDate(releaseDate))) { setTypeErr('Please enter a valid give date (or leave blank).'); return; }
    if (endDate && isNaN(parseDate(endDate))) { setTypeErr('Please enter a valid end date (or leave blank).'); return; }
    if (releaseDate && endDate && parseDate(endDate) < parseDate(releaseDate)) { setTypeErr('End Date must be on or after the Give Date.'); return; }
    if (!isStatutory && isReservedBonusName(n)) { setTypeErr('"13th Month Pay"-style names are reserved for the statutory bonus (RA 8515).'); return; }
    if (bonusTypes.some(b => b.id !== editId && normalizeBonusName(b.name) === normalizeBonusName(n))) { setTypeErr(`"${n}" already exists. Bonus names must be unique.`); return; }

    const next = { ...state, bonusTypes: [...bonusTypes] };
    if (editId !== null) {
      const b = next.bonusTypes.find(x => x.id === editId);
      Object.assign(b, { name: n, kind, value: v, desc, deMinimis, releaseDate, endDate });
      showToast(`"${n}" updated successfully!`);
    } else {
      next.bonusTypes.push({ id: next.nextBonusId, name: n, kind, value: v, desc, status: 'Active', deMinimis, releaseDate, endDate });
      next.nextBonusId = (next.nextBonusId || 1) + 1;
      showToast(`"${n}" added successfully!`);
    }
    setTypeModal(false);
    await save(next);
  };

  const removeType = async (id) => {
    const b = bonusTypes.find(x => x.id === id);
    if (b.id === 1) { showToast('"13th Month Pay" is a statutory bonus (RA 8515) and cannot be removed. Toggle it to disable.', '⚠️'); return; }
    if (!window.confirm(`Remove "${b.name}"?`)) return;
    const next = { ...state, bonusTypes: bonusTypes.filter(x => x.id !== id) };
    await save(next);
    showToast(`"${b.name}" removed.`);
  };

  const saveLimit = async () => {
    const v = Math.max(0, parseFloat(exemptLimit) || 0);
    const next = { ...state, bonusExemptionLimit: v };
    await save(next);
    setExemptLimit(String(v));
    showToast(`Bonus exemption limit set to ${fmt(v)} / year.`);
  };

  const markPaid = async (id, yr) => {
    const emp = roster.find(u => u.id === id);
    const next = { ...state, bonusPayouts: { ...(state.bonusPayouts || {}), [id + '_' + yr]: { date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } } };
    await save(next);
    showToast(`13th Month Pay for ${emp.first} ${emp.last} (${yr}) marked as paid.`);
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 20 }}>Loading bonus management…</div>;
  if (!state) return <div style={{ color: '#C62828', padding: 20 }}>Failed to load data.</div>;

  const total13 = roster.filter(u => thirteenthEligibility(u, year).eligible).reduce((s, u) => s + computeThirteenth(u, year), 0);
  const eligibleCount = roster.filter(u => thirteenthEligibility(u, year).eligible).length;
  const years = [...new Set([new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1])];

  return (
    <div>
      {toastNode}

      <div className="pg-title">Bonus Table Management</div>
      <div className="pg-sub">Compute the statutory 13th Month Pay per RA 8515 / DOLE — 1/12 of the total basic salary earned in the calendar year, prorated by actual service days — and configure additional bonus types.</div>

      <div className="stats-grid s3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--gold-pale)' }}>🎁</div>
          <div>
            <div className="stat-val">{fmt(total13)}</div>
            <div className="stat-lbl">Total 13th Month Pay</div>
            <div className="stat-note">Calendar Year {year}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E8F5E9' }}>👥</div>
          <div>
            <div className="stat-val">{eligibleCount}</div>
            <div className="stat-lbl">Eligible Employees</div>
            <div className="stat-note">Any service rendered in the year</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E3F2FD' }}>⚙️</div>
          <div>
            <div className="stat-val">{bonusTypes.filter(b => b.status === 'Active').length}</div>
            <div className="stat-lbl">Bonus Types</div>
            <div className="stat-note">Configurable</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <div className="card-title">🎁 13th Month Pay Computation (RA 8515) — {year}</div>
          <div className="toolbar">
            <select className="fi" style={{ width: 110 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Classification</th>
                <th>Date Hired</th>
                <th>Status</th>
                <th>Months in Year</th>
                <th>Avg Monthly Pay</th>
                <th>Proration</th>
                <th>13th Month Pay</th>
                <th>Payout Status</th>
              </tr>
            </thead>
            <tbody>
              {roster.map(u => {
                const m = monthsEmployed(u, year);
                const el = thirteenthEligibility(u, year);
                const val = el.eligible ? computeThirteenth(u, year) : 0;
                const paid = state.bonusPayouts?.[u.id + '_' + year];
                return (
                  <tr key={u.id}>
                    <td data-label="Employee"><strong>{u.first} {u.last}</strong></td>
                    <td data-label="Classification"><span className={'badge ' + (EMP_CLASS[u.classification]?.badge || 'b-gray')}>{u.classification}</span></td>
                    <td data-label="Date Hired">{u.hireDate || '—'}{u.endDate ? <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>until {u.endDate}</span> : ''}</td>
                    <td data-label="Status"><span className={'badge ' + (u.status === 'Active' ? 'b-green' : 'b-gray')}>{u.status === 'Active' ? 'Active' : 'Resigned'}</span></td>
                    <td data-label="Months">{m} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 12</span></td>
                    <td data-label="Avg Monthly Pay">{fmt(avgMonthlyPay(u))}</td>
                    <td data-label="Proration"><span className={'badge ' + el.badge}>{el.label}</span></td>
                    <td data-label="13th Month Pay">{el.eligible ? <strong style={{ color: 'var(--maroon-dark)' }}>{fmt(val)}</strong> : <span style={{ color: '#CCC' }}>—</span>}</td>
                    <td data-label="Payout Status">{el.eligible ? (paid ? <span className="badge b-green">✓ Paid {paid.date}</span> : <button onClick={() => markPaid(u.id, year)} className="btn btn-outline btn-sm">Mark Paid</button>) : <span style={{ color: '#CCC' }}>—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', background: 'var(--bg)', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
          <strong>Formula (RA 8515 / DOLE):</strong> 13th Month Pay = Total Basic Salary Earned During the Calendar Year ÷ 12. Prorated by actual days of service for employees hired or separated mid-year. Everyone who rendered service during the year is entitled — no minimum-length rule. Payment on or before <strong>December 24</strong>. Not subject to SSS, PhilHealth, or Pag-IBIG. <strong>Tax-exempt only up to the configured annual limit</strong> (default {fmt(defaultLimit)}/year, RA 10963 / CREATE Act); any excess is taxable income subject to BIR withholding.
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <div className="card-title">⚖️ Government Compliance Settings — 13th Month Exemption Limit (RA 10963 / CREATE)</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
            <div className="fg" style={{ minWidth: 240, marginBottom: 0 }}>
              <label className="fl">Annual Exemption Limit (₱/year)</label>
              <input className="fi" type="number" step="1000" min="0" value={exemptLimit} onChange={e => setExemptLimit(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={saveLimit}>💾 Save Limit</button>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            13th Month Pay + other taxable bonuses are income-tax exempt only up to this annual ceiling. Any excess is taxable income subject to BIR withholding.
            Update this whenever the government amends the exemption amount so the system stays compliant.
            All existing tables below are also editable and persist across sessions.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">⚙️ Configurable Bonus Types</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Define additional bonus structures that can be applied to future payroll cycles. Mark a bonus as <strong>🌿 De Minimis</strong> (BIR RR 11-2018) to make it tax-exempt, excluded from the ₱90,000 exemption pool, and exempt from SSS/PhilHealth/Pag-IBIG.</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>+ Add Bonus Type</button>
        </div>
        <div className="card-body">
          {bonusTypes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, background: '#FAFAFA', border: '2px dashed #DDD', borderRadius: 14 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
              <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>No bonus types configured</div>
              <button className="btn btn-outline btn-sm" onClick={openAdd}>+ Add First Bonus Type</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {bonusTypes.map(b => (
                <div key={b.id} className="card" style={{ margin: 0 }}>
                  <div className="card-body" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--maroon-dark)' }}>{b.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{b.desc || '—'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input type="checkbox" style={{ width: 16, height: 16, accentColor: 'var(--maroon)' }} checked={b.status === 'Active'} onChange={() => toggleType(b.id)} />
                        </label>
                        <span className={'badge ' + (b.status === 'Active' ? 'b-green' : 'b-gray')}>{b.status === 'Active' ? 'Paid' : 'TBD'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'inline-block', background: 'var(--gold-pale)', border: '1px solid var(--gold)', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700, color: 'var(--maroon-dark)', marginBottom: 12 }}>
                      {b.kind === 'months' ? b.value + ' mo.' : b.kind === 'fixed' ? '₱' + (b.value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : b.value + '%'}
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>{kindLabel[b.kind]}</span>
                    </div>
                    {(b.releaseDate || b.endDate) && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                        {b.releaseDate && <span>📅 Release: {b.releaseDate}</span>}
                        {b.releaseDate && b.endDate && <span> · </span>}
                        {b.endDate && <span>📅 End: {b.endDate}</span>}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button onClick={() => openEdit(b.id)} className="btn btn-outline btn-sm">✏️ Edit</button>
                      {b.id !== 1 && <button onClick={() => removeType(b.id)} className="btn btn-danger btn-sm">🗑️ Remove</button>}
                      {b.deMinimis && <span className="badge b-green">🌿 De Minimis</span>}
                      {b.id !== 1 && isReservedBonusName(b.name) && <span className="badge b-yellow">⚠️ Ignored — reserved</span>}
                      {b.id !== 1 && b.kind === 'months' && !isReservedBonusName(b.name) && <span className="badge b-gold">🎄 December only</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={typeModal}
        title={editId === 1 ? 'Edit Statutory 13th Month Pay' : editId !== null ? 'Edit Bonus Type' : 'Add Bonus Type'}
        onClose={() => setTypeModal(false)}
        footer={
          <>
            <button onClick={() => setTypeModal(false)} className="btn btn-outline">Cancel</button>
            <button onClick={saveType} className="btn btn-primary">{editId !== null ? 'Save Changes' : 'Add Bonus'}</button>
          </>
        }
      >
        {typeErr && <div style={{ background: '#FFF0F0', border: '1px solid #F5C6C6', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#8B1A1A', marginBottom: 12 }}>{typeErr}</div>}
        <div className="fg"><label className="fl">Name</label><input className="fi" disabled={editId === 1} value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="fg-row">
          <div className="fg"><label className="fl">Kind</label>
            <select className="fi" disabled={editId === 1} value={typeForm.kind} onChange={e => setTypeForm(f => ({ ...f, kind: e.target.value }))}>
              <option value="fixed">Fixed Amount</option><option value="percent">% of Gross</option><option value="months">Months of Pay</option>
            </select>
          </div>
          <div className="fg"><label className="fl">{typeForm.kind === 'months' ? 'Value (months)' : typeForm.kind === 'percent' ? 'Value (%)' : 'Value (₱)'}</label><input type="number" className="fi" value={typeForm.value} onChange={e => setTypeForm(f => ({ ...f, value: e.target.value }))} /></div>
        </div>
        <div className="fg"><label className="fl">Description</label><input className="fi" value={typeForm.desc} onChange={e => setTypeForm(f => ({ ...f, desc: e.target.value }))} /></div>
        <div className="fg-row">
          <div className="fg"><label className="fl">Give Date</label><input type="date" className="fi" disabled={editId === 1} value={typeForm.releaseDate} onChange={e => setTypeForm(f => ({ ...f, releaseDate: e.target.value }))} /></div>
          <div className="fg"><label className="fl">End Date</label><input type="date" className="fi" disabled={editId === 1} value={typeForm.endDate} onChange={e => setTypeForm(f => ({ ...f, endDate: e.target.value }))} /></div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" style={{ width: 16, height: 16, accentColor: 'var(--maroon)' }} checked={typeForm.deMinimis} onChange={e => setTypeForm(f => ({ ...f, deMinimis: e.target.checked }))} />
          De Minimis (tax-exempt, not in ₱90k pool)
        </label>
      </Modal>
    </div>
  );
}
