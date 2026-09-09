import { useEffect, useState } from 'react';
import { fetchState } from '../../api/data';
import { fmt, MONTHS } from '../../lib/payroll';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Analytics() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchState().then(setState).catch(() => { }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading analytics…</div>;
  if (!state) return <div style={{ color: '#C62828' }}>Failed to load data.</div>;

  const year = new Date().getFullYear();
  const records = state.payrollRecords || [];
  const yearRecs = records.filter(r => r.year === year);
  const curMonth = new Date().getMonth() + 1;

  const grossOf = r => (r.gross || 0) + (r.deMinimisSum || 0) + (r.thirteenth || 0);
  const govtOf = r => (r.sss || 0) + (r.phil || 0) + (r.pag || 0) + (r.bir || 0) + (r.thirteenTax || 0);

  const tGross = yearRecs.reduce((s, r) => s + grossOf(r), 0);
  const tGovt = yearRecs.reduce((s, r) => s + govtOf(r), 0);
  const curGovt = yearRecs.filter(r => r.month === curMonth).reduce((s, r) => s + govtOf(r), 0);

  const empOf = id => (state.users || []).find(u => u.id === id);
  const teachGross = yearRecs.filter(r => empOf(r.empId)?.classification === 'Teaching').reduce((s, r) => s + grossOf(r), 0);
  const nonTeachGross = yearRecs.filter(r => empOf(r.empId)?.classification !== 'Teaching').reduce((s, r) => s + grossOf(r), 0);

  const monthly = MONTH_SHORT.map((m, i) => {
    const recs = yearRecs.filter(r => r.month === i + 1);
    return { m, total: recs.reduce((s, r) => s + grossOf(r), 0), count: recs.length };
  });
  const maxBar = Math.max(...monthly.map(x => x.total), 1);
  const dec13 = yearRecs.filter(r => r.month === 12).reduce((s, r) => s + (r.thirteenth || 0), 0);

  const govtRows = [
    ['SSS', yearRecs.reduce((s, r) => s + (r.sss || 0), 0)],
    ['PhilHealth', yearRecs.reduce((s, r) => s + (r.phil || 0), 0)],
    ['Pag-IBIG', yearRecs.reduce((s, r) => s + (r.pag || 0), 0)],
    ['BIR', yearRecs.reduce((s, r) => s + (r.bir || 0) + (r.thirteenTax || 0), 0)]
  ];
  const monthGovtRows = [
    ['SSS', yearRecs.filter(r => r.month === curMonth).reduce((s, r) => s + (r.sss || 0), 0)],
    ['PhilHealth', yearRecs.filter(r => r.month === curMonth).reduce((s, r) => s + (r.phil || 0), 0)],
    ['Pag-IBIG', yearRecs.filter(r => r.month === curMonth).reduce((s, r) => s + (r.pag || 0), 0)],
    ['BIR', curGovt - yearRecs.filter(r => r.month === curMonth).reduce((s, r) => s + (r.sss || 0) + (r.phil || 0) + (r.pag || 0), 0)]
  ];

  const pct = n => (tGross ? (n / tGross * 100).toFixed(1) : '0.0');

  return (
    <div>
      <div className="pg-title">Analytics Dashboard</div>
      <div className="pg-sub">Payroll cost trends, personnel classification cost breakdown, and government deductions summary.</div>

      <div className="stats-grid s4">
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--gold-pale)' }}>💰</div><div><div className="stat-val">{fmt(tGross)}</div><div className="stat-lbl">Total Gross Payroll</div><div className="stat-note">{year} YTD</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: '#E8F5E9' }}>📤</div><div><div className="stat-val">{fmt(tGovt)}</div><div className="stat-lbl">Govt Deductions</div><div className="stat-note">SSS + Phil + Pag + BIR</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: '#E3F2FD' }}>🎓</div><div><div className="stat-val">{fmt(teachGross)}</div><div className="stat-lbl">Teaching Cost</div><div className="stat-note">{pct(teachGross)}% of total</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: '#FFF8E1' }}>🧰</div><div><div className="stat-val">{fmt(nonTeachGross)}</div><div className="stat-lbl">Non-Teaching Cost</div><div className="stat-note">{pct(nonTeachGross)}% of total</div></div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-head"><div className="card-title">📈 Payroll Cost Trend — {year}</div></div>
          <div className="card-body" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160 }}>
              {monthly.map((x, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{x.count ? '₱' + Math.round(x.total / 1000) + 'k' : ''}</div>
                  <div style={{ width: '80%', maxWidth: 34, height: Math.max(4, Math.round(x.total / maxBar * 130)), borderRadius: '6px 6px 2px 2px', background: x.count ? 'linear-gradient(180deg,#C9A84C,#6B1A1A)' : '#EDE8E0' }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--maroon)' }}>{x.m}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">🧮 Teaching vs Non-Teaching</div></div>
          <div className="card-body" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>🎓 Teaching <strong>{fmt(teachGross)}</strong></div>
            <div style={{ height: 10, background: '#F0EBE2', borderRadius: 6, overflow: 'hidden', marginBottom: 18 }}>
              <div style={{ width: Math.max(2, Math.round(teachGross / Math.max(tGross, 1) * 100)) + '%', height: '100%', background: 'linear-gradient(90deg,#1565C0,#4A90D9)', borderRadius: 6 }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>🧰 Non-Teaching <strong>{fmt(nonTeachGross)}</strong></div>
            <div style={{ height: 10, background: '#F0EBE2', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: Math.max(2, Math.round(nonTeachGross / Math.max(tGross, 1) * 100)) + '%', height: '100%', background: 'linear-gradient(90deg,#7D5A00,#C9A84C)', borderRadius: 6 }} />
            </div>
            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {yearRecs.length} payroll record{yearRecs.length !== 1 ? 's' : ''} processed for {year}.
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><div className="card-title">🎁 13th Month Pay Cost Impact — December {year}</div></div>
        <div className="card-body" style={{ padding: '20px 24px' }}>
          {dec13 > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Committed 13th Month Pay (older records)</div>
              <strong style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: 'var(--maroon-dark)' }}>{fmt(dec13)}</strong>
              <span className="badge b-gold">🎄 computed per RA 8515</span>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No December payroll has been confirmed yet — 13th Month impact will appear here once December payroll is processed.</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">🏛️ Government Deductions Summary</div></div>
        <div style={{ padding: 0 }}>
          <table>
            <thead>
              <tr><th>Deduction</th><th>Monthly ({MONTHS[curMonth - 1]})</th><th>YTD</th><th>Share of Total</th></tr>
            </thead>
            <tbody>
              {govtRows.map(([name, ytd], i) => (
                <tr key={name}>
                  <td><strong>{name}</strong></td>
                  <td>{fmt(monthGovtRows[i][1])}</td>
                  <td>{fmt(ytd)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 8, background: '#F0EBE2', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ width: Math.round((ytd / Math.max(tGovt, 1) * 100)) + '%', height: '100%', background: 'var(--maroon)', borderRadius: 6 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--maroon-dark)', width: 44 }}>{Math.round(ytd / Math.max(tGovt, 1) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              <tr>
                <td><strong>Total</strong></td>
                <td><strong>{fmt(curGovt)}</strong></td>
                <td><strong>{fmt(tGovt)}</strong></td>
                <td>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}