import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchState } from '../../api/data';
import { fmt, MONTHS } from '../../lib/payroll';
import { BackLink } from '../../components/ui';

const CUR_YEAR = new Date().getFullYear();

export default function PayslipViewer() {
  const { user } = useAuth();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodKey, setPeriodKey] = useState('');
  const [viewing, setViewing] = useState(null);
  const [selYear, setSelYear] = useState(CUR_YEAR);

  useEffect(() => {
    fetchState().then(setState).catch(() => { }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#999' }}>Loading payslips…</div>;
  if (!state) return <div style={{ color: '#C62828' }}>Failed to load data.</div>;

  const emp = (state.users || []).find(u => (u.email || '').toLowerCase() === (user?.email || '').toLowerCase())
    || (state.users || []).find(u => u.id === user?.id);
  if (!emp) return <div style={{ color: '#999' }}>No employee profile linked to this account.</div>;

  const myRecords = (state.payrollRecords || [])
    .filter(r => r.empId === emp.id)
    .sort((a, b) => b.year - a.year || b.month - a.month);

  const years = [...new Set(myRecords.map(r => r.year))].sort((a, b) => b - a);

  const filtered = myRecords.filter(r => r.year === selYear);
  const selected = viewing || (myRecords.find(r => r.month + '-' + r.year === periodKey) || myRecords[0]);
  const bonusExemptionLimit = state.bonusExemptionLimit || 90000;

  if (viewing) {
    return <PayslipDetail rec={viewing} emp={emp} onBack={() => setViewing(null)} bonusExemptionLimit={bonusExemptionLimit} />;
  }

  return (
    <div>
      <div className="pg-title">My Payslips</div>
      <div className="pg-sub">View and download your payslip records.</div>
      <div className="card">
        <div className="card-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📄</span>
            <div className="card-title">Payslip Records</div>
          </div>
          <select className="fi" style={{ width: 110 }} value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
            {years.length === 0 && <option value={CUR_YEAR}>{CUR_YEAR}</option>}
          </select>
        </div>
        <div style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Gross Pay</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No payslips for {selYear}.</td></tr>
              ) : filtered.map(r => {
                const ded = (r.sss || 0) + (r.phil || 0) + (r.pag || 0) + (r.bir || 0) + (r.cash || 0) + (r.thirteenTax || 0) + (r.customDeds || []).reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
                return (
                  <tr key={r.month + '-' + r.year}>
                    <td><strong>{MONTHS[r.month - 1]} {r.year}</strong>{r.month === 12 ? <span className="badge b-gold" style={{ marginLeft: 4, fontSize: 10 }}>🎁 13th</span> : ''}</td>
                    <td>{fmt(r.gross)}</td>
                    <td>{fmt(ded)}</td>
                    <td><strong style={{ color: 'var(--maroon-dark)' }}>{fmt(r.net)}</strong></td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => setViewing(r)}>View</button>
                    </td>
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

function PayslipDetail({ rec, emp, onBack, bonusExemptionLimit }) {
  if (!rec) return null;

  const period = MONTHS[rec.month - 1] + ' ' + rec.year;
  const isDec = rec.month === 12;

  const grossTaxable = parseFloat(rec.gross) || 0;
  const deMinimis = parseFloat(rec.deMinimisSum) || 0;
  const recBonuses = Array.isArray(rec.bonuses) ? rec.bonuses : [];
  const thirteenth = parseFloat(rec.thirteenth) || 0;
  const exempt13 = parseFloat(rec.thirteenExempt) || 0;
  const taxable13 = parseFloat(rec.thirteenTaxable) || 0;
  const thirteenTax = parseFloat(rec.thirteenTax) || 0;
  const sss = parseFloat(rec.sss) || 0;
  const phil = parseFloat(rec.phil) || 0;
  const pag = parseFloat(rec.pag) || 0;
  const bir = parseFloat(rec.bir) || 0;
  const cash = parseFloat(rec.cash) || 0;
  const customDeds = Array.isArray(rec.customDeds) ? rec.customDeds : [];
  const customTotal = customDeds.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
  const totalDed = sss + phil + pag + bir + cash + thirteenTax + customTotal;
  const totalGross = grossTaxable + deMinimis + thirteenth;
  const earningLabel = emp.classification === 'Teaching'
    ? `${emp.hoursWorked || 0} hrs × ₱${(parseFloat(emp.hourlyRate) || 0).toFixed(2)}`
    : 'Monthly Base Salary';

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <BackLink onClick={onBack}>Back to Payslips</BackLink>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '40px 48px' }}>

            <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 24, borderBottom: '2px solid var(--maroon-dark)' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: 'var(--maroon-dark)' }}>Republic Central Colleges</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Automated Payroll System — Official Payslip</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Period: {period}{isDec ? ' ' : ''}
                {isDec && <span className="badge b-gold" style={{ marginLeft: 4 }}>🎁 incl. 13th Month</span>}
              </div>
            </div>

            {/* Employee Info */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--maroon-dark)', marginBottom: 12 }}>Employee Information</div>
              {[
                ['Name', emp.first + ' ' + emp.last],
                ['Employee ID', '#USR-00' + emp.id],
                ['Position', emp.role],
                ['Classification', emp.classification || 'Non-Teaching'],
                ['Department', emp.department || '—']
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0EBE3', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Earnings */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--maroon-dark)', marginBottom: 12 }}>Earnings</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0EBE3', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{earningLabel}</span>
                <span style={{ fontWeight: 600 }}>{fmt(grossTaxable)}</span>
              </div>
              {recBonuses.length ? recBonuses.map(b => (
                <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0EBE3', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>🎁 {b.name} <span style={{ fontSize: 10, color: b.deMinimis ? '#2E7D32' : 'var(--text-muted)' }}>— {b.deMinimis ? 'de minimis (tax-exempt)' : 'taxable bonus'}</span></span>
                  <span style={{ fontWeight: 600 }}>+{fmt(b.amount)}</span>
                </div>
              )) : (deMinimis > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0EBE3', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>De Minimis Benefits</span>
                  <span style={{ fontWeight: 600 }}>{fmt(deMinimis)}</span>
                </div>
              ) : null)}
              {exempt13 > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0EBE3', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>🎁 13th Month Pay (RA 8515) <span style={{ fontSize: 10, color: '#2E7D32' }}>— exempt (≤{fmt(bonusExemptionLimit)}/yr)</span></span>
                  <span style={{ fontWeight: 700, color: 'var(--maroon-dark)' }}>{fmt(exempt13)}</span>
                </div>
              )}
              {taxable13 > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0EBE3', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>⚠️ 13th Month excess <span style={{ fontSize: 10, color: '#C62828' }}>— taxable (over {fmt(bonusExemptionLimit)})</span></span>
                  <span style={{ fontWeight: 700, color: '#C62828' }}>{fmt(taxable13)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, fontWeight: 700, color: 'var(--maroon-dark)' }}>
                <span>Total Earnings</span><span>{fmt(totalGross)}</span>
              </div>
            </div>

            {/* Deductions */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--maroon-dark)', marginBottom: 12 }}>Deductions</div>
              {[
                ['SSS Contribution', sss],
                ['PhilHealth Premium', phil],
                ['Pag-IBIG Contribution', pag],
                ['BIR Withholding Tax', bir],
                ['Cash Advance', cash]
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0EBE3', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                  <span>{fmt(v)}</span>
                </div>
              ))}
              {customDeds.map(x => (
                <div key={x.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0EBE3', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>📌 {x.name}</span>
                  <span>{fmt(x.amount)}</span>
                </div>
              ))}
              {thirteenTax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0EBE3', fontSize: 13, background: '#FFF8E1' }}>
                  <span style={{ color: '#8D6E63' }}>🧾 13th Month Excess Tax <span style={{ fontSize: 10, color: '#8D6E63' }}>(over {fmt(bonusExemptionLimit)} exemption)</span></span>
                  <span style={{ fontWeight: 700, color: '#C62828' }}>{fmt(thirteenTax)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, fontWeight: 700, color: '#C62828' }}>
                <span>Total Deductions</span><span>{fmt(totalDed)}</span>
              </div>
            </div>

            {/* NET PAY */}
            <div style={{ background: 'linear-gradient(135deg,var(--maroon-dark),var(--maroon))', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontWeight: 700, color: '#fff', letterSpacing: 1 }}>NET PAY</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: '#fff' }}>{fmt(rec.net)}</span>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 24, paddingTop: 20, borderTop: '1px solid #F0EBE3' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid var(--maroon-dark)', paddingTop: 8, fontSize: 11, fontWeight: 700, color: 'var(--maroon-dark)' }}>Prepared by</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Payroll Officer</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid var(--maroon-dark)', paddingTop: 8, fontSize: 11, fontWeight: 700, color: 'var(--maroon-dark)' }}>Audited by</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Finance Officer</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid var(--maroon-dark)', paddingTop: 8, fontSize: 11, fontWeight: 700, color: 'var(--maroon-dark)' }}>Received by</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Employee</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: 11, color: '#AAA', marginTop: 16 }}>This is a computer-generated payslip. No signature required.</div>
          </div>

          <div style={{ padding: '0 48px 32px', display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-primary" style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => window.print()}>
              📥 Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
