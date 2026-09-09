import { useEffect, useState } from 'react';
import { fetchState } from '../../api/data';

export default function DeductionTables() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchState().then(setState).catch(() => { }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 32 }}>Loading deduction tables…</div>;
  if (!state) return <div style={{ color: '#C62828', padding: 32 }}>Failed to load data.</div>;

  const sss = state.sssTable || [];
  const phil = state.philData || {};
  const pag = state.pagData || {};
  const bir = state.birData || [];

  const peso2 = v => '₱' + (parseFloat(v) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
  const birDesc = r => (parseFloat(r.base) === 0 && parseFloat(r.rate) === 0)
    ? <span className="badge b-green">0% — Exempt</span>
    : <span>{(parseFloat(r.base) > 0 ? '₱' + r.base.toLocaleString('en-PH') + ' + ' : '') + r.rate + '% on excess'}</span>;

  return (
    <div>
      <div className="pg-title">Deduction Tables</div>
      <div className="pg-sub">View SSS, PhilHealth, Pag-IBIG, and BIR contribution rate tables.</div>

      <div className="card">
        <div className="card-head"><div className="card-title">ℹ️ Note</div></div>
        <div className="card-body" style={{ background: 'var(--gold-pale)', borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--maroon)' }}>As a System Admin, you can view deduction tables. Updates to rates must be made by the Finance Officer. Contact your Finance Officer to update contribution rates.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-head"><div className="card-title">🏛️ SSS Contribution</div></div>
          <div style={{ padding: 0, maxHeight: 300, overflowY: 'auto' }}>
            <table>
              <thead><tr><th>SALARY RANGE</th><th>EMPLOYEE</th><th>EMPLOYER</th></tr></thead>
              <tbody>
                {sss.map((r, i) => (
                  <tr key={i}>
                    <td><strong>{r.range}</strong></td>
                    <td>{peso2(r.emp)}</td>
                    <td>{peso2(r.er)}</td>
                  </tr>
                ))}
                {sss.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No SSS data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">🏥 PhilHealth</div></div>
          <div className="card-body">
            <div style={{ background: 'var(--gold-pale)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Current Rate</div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 32, fontWeight: 700, color: 'var(--maroon-dark)' }}>{(phil.rate || 0).toFixed(2)}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Split equally — {(phil.rate / 2).toFixed(2)}% employee, {(phil.rate / 2).toFixed(2)}% employer</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">🏠 Pag-IBIG Contribution</div></div>
          <div style={{ padding: 0 }}>
            <table>
              <thead><tr><th>MONTHLY COMPENSATION</th><th>EMPLOYEE RATE</th></tr></thead>
              <tbody>
                <tr><td>₱1,500 and below</td><td>{pag.rate1}%</td></tr>
                <tr><td>Above ₱1,500</td><td><strong>{pag.rate2}%</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">📋 BIR Withholding Tax (TRAIN Law)</div></div>
          <div style={{ padding: 0 }}>
            <table>
              <thead><tr><th>ANNUAL TAXABLE INCOME</th><th>TAX RATE</th></tr></thead>
              <tbody>
                {bir.map((r, i) => (
                  <tr key={i}>
                    <td>{r.range}</td>
                    <td>{birDesc(r)}</td>
                  </tr>
                ))}
                {bir.length === 0 && <tr><td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No BIR data.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
