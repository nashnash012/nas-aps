import { useEffect, useMemo, useState } from 'react';
import { fetchState, saveState } from '../../api/data';
import { MONTHS, fmt, EMP_CLASS, computeOne, getAttendanceHours, totalUnpaidDays, getLeaveBreakdown, getDetectedAbsences, isThirteenthActive, HOURS_PER_DAY } from '../../lib/payroll';

export default function PayrollCalculator() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const [payPeriod, setPayPeriod] = useState('December 2026');
  const [empId, setEmpId] = useState('');
  const [input, setInput] = useState('');      // hours or absences
  const [salary, setSalary] = useState('');    // base salary or hourly rate
  const [cash, setCash] = useState('0');
  const [include13, setInclude13] = useState(true);
  const [overrides, setOverrides] = useState({});
  const [result, setResult] = useState(null);

  const load = () => fetchState().then(setState).catch(() => setToast('Failed to load data.')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2500); return () => clearTimeout(t); }, [toast]);

  useEffect(() => {
    if (!state) return;
    const ov = {};
    (state.deductionCategories || []).filter(c => c.status === 'Active').forEach(c => {
      ov[c.id] = c.type === 'fixed' ? String(parseFloat(c.amount) || 0) : '';
    });
    setOverrides(ov);
  }, [state]);

  const employees = useMemo(() =>
    (state?.users || []).filter(u => u.status === 'Active' && (u.role === 'Employee' || u.role === 'Finance Officer' || u.role === 'System Admin')),
  [state]);

  const emp = employees.find(u => u.id === Number(empId));

  const [monthName, yearStr] = payPeriod.split(' ');
  const year = parseInt(yearStr) || new Date().getFullYear();
  const monthNum = MONTHS.indexOf(monthName) + 1;
  const isDec = /^december/i.test(monthName);

  const prefillEmp = (u, period) => {
    const [mn, ys] = period.split(' ');
    const yr = parseInt(ys) || new Date().getFullYear();
    const m = MONTHS.indexOf(mn) + 1;
    if (u.classification === 'Teaching') {
      const attH = getAttendanceHours(u.id, m, yr, state.attendance || []);
      setInput(attH > 0 ? attH : (u.hoursWorked || ''));
    } else {
      setInput(totalUnpaidDays(u.id, m, yr, state));
    }
    setSalary(u.classification === 'Teaching' ? (u.hourlyRate || '') : (u.salary || ''));
    const ca = state.cashAdvances ? state.cashAdvances[u.id] : null;
    setCash(ca != null ? String(ca) : '0');
  };

  const selectEmp = (id) => {
    const u = employees.find(x => x.id === Number(id));
    setEmpId(id);
    setResult(null);
    if (u) prefillEmp(u, payPeriod);
  };

  const onPeriodChange = (v) => {
    setPayPeriod(v);
    setResult(null);
    const u = employees.find(x => x.id === Number(empId));
    if (u) prefillEmp(u, v);
  };

  const thirteenthActive = isThirteenthActive(state.bonusTypes || []);
  const canUse13 = isDec && thirteenthActive;
  const effectiveInclude13 = canUse13 ? include13 : false;

  const resolveOverrides = (ov) => {
    const out = {};
    Object.keys(ov).forEach(k => { const v = ov[k]; if (v !== '' && v != null) out[k] = Math.max(0, parseFloat(v) || 0); });
    return out;
  };

  const compute = () => {
    if (!emp) { setToast('Select an employee first.'); return; }
    const options = { payPeriod, hours: input, absences: input, salaryInput: salary, hourlyInput: salary, cash, include13th: effectiveInclude13, customOverrides: resolveOverrides(overrides) };
    const r = computeOne(emp, options, state);
    setResult(r);
  };

  const confirm = async () => {
    if (!result) { setToast('Compute the payroll first.'); return; }
    const rec = { ...result, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
    const next = { ...state, payrollRecords: [...(state.payrollRecords || [])] };
    const idx = next.payrollRecords.findIndex(x => x.empId === rec.empId && x.month === rec.month && x.year === rec.year);
    let overwritten = false;
    if (idx >= 0) { next.payrollRecords[idx] = rec; overwritten = true; }
    else next.payrollRecords.push(rec);
    if ((parseFloat(rec.cash) || 0) > 0) {
      next.cashAdvances = { ...(next.cashAdvances || {}), [rec.empId]: 0 };
    }
    await saveState(next);
    setToast(`${rec.name} payroll saved — ${rec.period} · Net Pay ${fmt(rec.net)} ${rec.thirteenth > 0 ? '(includes 13th Month Pay)' : ''}${overwritten ? ' (overwritten)' : ''}`);
    load();
  };

  const breakdown = useMemo(() => {
    if (!emp) return null;
    const { breakdown: items, totalPaidDays, totalUnpaidDays: unpaid } = getLeaveBreakdown(emp.id, monthNum, year, state.leaveRecords || [], state.leaveTypes || []);
    const absentDays = getDetectedAbsences(emp.id, monthNum, year, state.attendance || [], state.leaveRecords || []);
    const totalUnpaid = unpaid + absentDays;
    if (!items.length && totalUnpaid === 0) return null;
    const dayValue = emp.classification === 'Teaching'
      ? (HOURS_PER_DAY * (parseFloat(emp.hourlyRate) || 0))
      : ((parseFloat(emp.salary) || 0) / (state.workDays || 22));
    return { items, totalPaidDays, totalUnpaid, absentDays, dayValue };
  }, [emp, monthNum, year, state]);

  if (loading) return <div style={{color:'var(--text-muted)',fontSize:13,padding:8}}>Loading payroll calculator…</div>;
  if (!state) return <div style={{color:'#C62828',fontSize:13,padding:8}}>Failed to load data.</div>;

  const monthOptions = [];
  for (let y = year - 1; y <= year; y++) for (let m = 0; m < 12; m++) monthOptions.push(`${MONTHS[m]} ${y}`);

  const isTeaching = emp?.classification === 'Teaching';
  const summaryPeriod = `${monthName} ${year}`;
  const activeCats = (state.deductionCategories || []).filter(c => c.status === 'Active');

  return (
    <div>
      <div className="pg-title">Payroll Calculation</div>
      <div className="pg-sub">Compute gross pay, deductions, and net pay. Teaching Personnel are paid by hours worked × hourly rate; Non-Teaching Personnel receive a fixed monthly base with absences deducted using a 22-day divisor. Absences and hours auto-load from attendance and leave records; <strong>December</strong> payroll includes the statutory 13th month bonus per RA 8515.</div>

      <div className="toast" style={toast ? {display:'flex'} : {}}><span>✅</span><span>{toast}</span></div>

      <div className="card" style={{marginBottom:16}}>
        <div className="card-head">
          <div className="card-title">💰 Payroll Calculator</div>
          <div className="toolbar">
            <select className="fi" style={{width:160}} value={payPeriod} onChange={e => onPeriodChange(e.target.value)}>
              {monthOptions.map(o => <option key={o}>{o}</option>)}
            </select>
            <label style={{display:'flex',alignItems:'center',gap:7,fontSize:12.5,color: canUse13 ? 'var(--maroon)' : '#999',fontWeight:700,cursor: canUse13 ? 'pointer' : 'not-allowed'}}>
              <input type="checkbox" checked={canUse13 && include13} disabled={!canUse13} onChange={e => setInclude13(e.target.checked)} style={{accentColor:'var(--maroon)',width:16,height:16,cursor: canUse13 ? 'pointer' : 'not-allowed'}} />
              <span>{canUse13 ? '🎁 Include 13th Month Pay (RA 8515)' : thirteenthActive ? '🎁 13th Month Pay — applies only in the December run' : '🎁 13th Month Pay — disabled (enable in Bonus Management)'}</span>
            </label>
          </div>
        </div>
        <div className="card-body">
          <div className="fg-row" style={{marginBottom:16}}>
            <div className="fg"><label className="fl">Classification <span style={{color:'#888',fontWeight:400}}>(step 1)</span></label>
              <select className="fi" value="" onChange={() => {}}>
                <option value="">All Types</option>
                <option>Teaching</option>
                <option>Non-Teaching</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">Select Employee <span style={{color:'#888',fontWeight:400}}>(step 2)</span></label>
              <select className="fi" value={empId} onChange={e => selectEmp(e.target.value)}>
                <option value="">— Select employee —</option>
                {employees.map(u => <option key={u.id} value={u.id}>{u.first} {u.last} — {u.classification}{u.department ? ' · ' + u.department : ''}</option>)}
              </select>
            </div>
          </div>
          <div className="fg-row" style={{marginBottom:16}}>
            <div className="fg" style={{gridColumn:'1 / -1'}}>
              <label className="fl">{isTeaching ? 'Hourly Rate (₱)' : 'Monthly Base Salary (₱)'}</label>
              <input className="fi" type="number" step="0.01" min="0" placeholder="0.00" value={salary} onChange={e => setSalary(e.target.value)} />
            </div>
          </div>
          <div className="fg-row" style={{marginBottom:16}}>
            <div className="fg"><label className="fl">{isTeaching ? 'Hours Worked' : 'Absences'}</label><input className="fi" type="number" step="0.5" min="0" placeholder="0" value={input} onChange={e => setInput(e.target.value)} /></div>
            <div className="fg"><label className="fl">Cash Advance (₱)</label><input className="fi" type="number" step="0.01" min="0" placeholder="0.00" value={cash} onChange={e => setCash(e.target.value)} /></div>
          </div>

          {activeCats.length > 0 && (
            <div className="fg-row" style={{marginBottom:16}}>
              {activeCats.map(c => (
                <div className="fg" key={c.id}>
                  <label className="fl">📌 {c.name} {c.type === 'percent' ? `(${c.amount}% of gross)` : '(₱)'}</label>
                  <input className="fi" type="number" step="0.01" min="0"
                    value={overrides[c.id] != null ? overrides[c.id] : ''}
                    placeholder={c.type === 'percent' ? 'auto — ' + c.amount + '% of gross' : '0.00'}
                    onChange={e => setOverrides({ ...overrides, [c.id]: e.target.value })} />
                </div>
              ))}
            </div>
          )}

          {emp && (
            <div style={{marginBottom:16,background:'var(--gold-pale)',border:'1px solid var(--gold)',borderRadius:10,padding:'12px 16px',fontSize:13,color:'var(--maroon-dark)'}}>
              <strong>{emp.first} {emp.last}</strong> — {emp.classification}{emp.department ? ' · ' + emp.department : ''}
            </div>
          )}

          <div style={{marginBottom:16}}>
            <button onClick={compute} className="btn btn-primary" style={{width:'100%'}}>✅ Compute Payroll</button>
          </div>

          {!result && !emp && (
            <div style={{textAlign:'center',padding:32,color:'var(--text-muted)'}}>
              <div style={{fontSize:36,marginBottom:8}}>💰</div>
              <div>Select an employee, enter hours worked (Teaching) or absences (Non-Teaching), and any cash advance to begin computation.</div>
            </div>
          )}

          {!result && emp && (
            <div style={{textAlign:'center',padding:32,color:'var(--text-muted)'}}>
              <div style={{fontSize:36,marginBottom:8}}>💰</div>
              <div>Enter hours worked (Teaching) or absences (Non-Teaching), and any cash advance to begin computation.</div>
            </div>
          )}

          {result && (
            <div style={{marginTop:16}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--maroon)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>📥 Earnings</div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F5F0EA',fontSize:13.5}}><span style={{color:'var(--text-muted)'}}>Gross Pay</span><span style={{fontWeight:700,color:'var(--maroon-dark)'}}>{fmt(result.details.gross)}</span></div>
                  {result.bonuses.map(b => (
                    <div key={b.name} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F5F0EA',fontSize:13.5}}><span style={{color:'var(--text-muted)'}}>🎁 {b.name}{b.deMinimis ? ' (de minimis)' : ' (taxable)'}</span><span style={{fontWeight:600,color:'#C62828'}}>+{fmt(b.amount)}</span></div>
                  ))}
                  {result.thirteenth > 0 && <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F5F0EA',fontSize:13.5}}><span style={{color:'var(--text-muted)'}}>🎁 13th Month Pay</span><span style={{fontWeight:700,color:'var(--maroon-dark)'}}>+{fmt(result.thirteenExempt)}</span></div>}
                  {result.thirteenTaxable > 0 && <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F5F0EA',fontSize:13.5}}><span style={{color:'var(--text-muted)'}}>⚠️ 13th Month excess (taxable)</span><span style={{fontWeight:600,color:'#C62828'}}>+{fmt(result.thirteenTaxable)}</span></div>}
                  {result.thirteenth > 0 && <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontSize:13.5,background:'#FFF8E1'}}><span style={{color:'#8D6E63'}}>🎁 13th excess tax <span style={{fontSize:10.5}}>(withheld)</span></span><span style={{fontWeight:700,color:'#C62828'}}>−{fmt(result.thirteenTax)}</span></div>}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--maroon)',marginBottom:12,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>📤 Deductions</div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F5F0EA',fontSize:13.5}}><span style={{color:'var(--text-muted)'}}>SSS</span><span style={{fontWeight:600}}>{fmt(result.sss)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F5F0EA',fontSize:13.5}}><span style={{color:'var(--text-muted)'}}>PhilHealth</span><span style={{fontWeight:600}}>{fmt(result.phil)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F5F0EA',fontSize:13.5}}><span style={{color:'var(--text-muted)'}}>Pag-IBIG</span><span style={{fontWeight:600}}>{fmt(result.pag)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F5F0EA',fontSize:13.5}}><span style={{color:'var(--text-muted)'}}>BIR Withholding Tax</span><span style={{fontWeight:600}}>{fmt(result.bir)}</span></div>
                  {result.cash > 0 && <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F5F0EA',fontSize:13.5}}><span style={{color:'var(--text-muted)'}}>Cash Advance</span><span style={{fontWeight:600,color:'#C62828'}}>{fmt(result.cash)}</span></div>}
                  {result.customDeds.map(x => <div key={x.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F5F0EA',fontSize:13.5}}><span style={{color:'var(--text-muted)'}}>📌 {x.name}</span><span style={{fontWeight:600,color:'#C62828'}}>{fmt(x.amount)}</span></div>)}
                  <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',fontSize:13.5}}><span style={{color:'var(--text-muted)'}}>Total Deductions</span><span style={{fontWeight:700,color:'#C62828'}}>{fmt(result.sss + result.phil + result.pag + result.bir + result.thirteenTax + result.cash + result.customDeds.reduce((s,x) => s + x.amount, 0))}</span></div>
                </div>
              </div>
              <div className="ps-total" style={{marginTop:16}}>
                <span className="ps-total-label">💵 NET PAY</span>
                <span className="ps-total-value">{fmt(result.net)}</span>
              </div>
              <div style={{marginTop:16,display:'flex',gap:10}}>
                <button className="btn btn-primary" onClick={confirm}>✅ Confirm &amp; Generate Payslip</button>
                <button className="btn btn-outline" onClick={compute}>🔄 Recalculate</button>
              </div>
            </div>
          )}

          {breakdown && (
            <div style={{marginTop:16,background:'#FBF9F6',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px'}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--maroon-dark)',marginBottom:8}}>📅 LEAVE &amp; ATTENDANCE — {monthName} {year}</div>
              <div style={{display:'grid',gap:4}}>
                {breakdown.items.map(item => (
                  <div key={item.name} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 8px',background:item.isPaid ? '#E8F5E9' : '#FFEBEE',borderRadius:6}}>
                    <span><strong>{item.name}</strong> <span style={{color:item.isPaid ? '#2E7D32' : '#C62828'}}>({item.isPaid ? 'Paid' : 'Unpaid'})</span></span>
                    <span>{item.days} day{item.days > 1 ? 's' : ''}{item.isPaid ? '' : '  −' + fmt(item.days * breakdown.dayValue)}</span>
                  </div>
                ))}
                {breakdown.absentDays > 0 && (
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 8px',background:'#FFF3E0',borderRadius:6}}>
                    <span><strong>🚫 Absent (no clock-in)</strong> <span style={{color:'#E65100'}}>(Unpaid)</span></span>
                    <span>{breakdown.absentDays} day{breakdown.absentDays > 1 ? 's' : ''}  −{fmt(breakdown.absentDays * breakdown.dayValue)}</span>
                  </div>
                )}
              </div>
              <div style={{marginTop:8,fontSize:11,color:'var(--text-muted)'}}>
                {breakdown.totalPaidDays > 0 ? <span style={{color:'#2E7D32'}}>{breakdown.totalPaidDays} paid</span> : null}
                {breakdown.totalPaidDays > 0 && breakdown.totalUnpaid > 0 ? ' · ' : ''}
                {breakdown.totalUnpaid > 0 ? <span style={{color:'#C62828'}}>{breakdown.totalUnpaid} unpaid</span> : null}
                {breakdown.totalUnpaid > 0 ? <span> → Deduction: <strong style={{color:'#C62828'}}>{fmt(breakdown.totalUnpaid * breakdown.dayValue)}</strong></span> : null}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title" style={{flex:'1'}}>📋 Payroll Summary — {summaryPeriod}</div>
          <button className="btn btn-outline btn-sm" onClick={() => load()}>🔄 Refresh</button>
        </div>
        <div style={{padding:0}}>
          <table>
            <thead>
              <tr><th>Employee</th><th>Type</th><th>Hrs / Abs</th><th>Gross Pay</th><th>Bonus</th><th>SSS</th><th>PhilHealth</th><th>Pag-IBIG</th><th>BIR</th><th>13th Tax</th><th>Cash Adv</th><th>Other</th><th>Net Pay</th><th>Status</th></tr>
            </thead>
            <tbody>
              <PayrollSummaryRows state={state} employees={employees} period={payPeriod} records={state.payrollRecords || []} />
            </tbody>
          </table>
        </div>
      </div>

      <div style={{background:'var(--gold-pale)',border:'1px solid var(--gold)',borderRadius:10,padding:'14px 18px',fontSize:13,color:'var(--maroon)',lineHeight:1.7,marginTop:16}}>
        <strong>Note:</strong> Monthly-paid (Non-Teaching) = 22 workdays, absent days deducted as <em>(salary ÷ 22) × absent</em>. Teaching paid hourly — actual hours worked × hourly rate, minus unpaid/absent days at 8 hrs each. Absences auto-combine unpaid leaves and unworked days (no clock-in). 13th Month Pay computed per RA 8515 based on total basic earnings during the calendar year.
      </div>
    </div>
  );
}

function PayrollSummaryRows({ state, employees, period, records }) {
  const [monthName, yearStr] = period.split(' ');
  const year = parseInt(yearStr);
  const monthNum = MONTHS.indexOf(monthName) + 1;
  const isDec = /^december/i.test(monthName);

  return employees.map(u => {
    const r = computeOne(u, { payPeriod: period, hours: u.hoursWorked, absences: u.absenceDays, salaryInput: u.salary, hourlyInput: u.hourlyRate, cash: (state.cashAdvances && state.cashAdvances[u.id]) || 0, include13th: isDec, customOverrides: {} }, state);
    const rec = records.find(x => x.empId === u.id && x.month === monthNum && x.year === year);
    const customTotal = (r.customDeds || []).reduce((s, x) => s + x.amount, 0);
    const bonusTotal = (r.bonuses || []).reduce((s, b) => s + b.amount, 0);
    return (
      <tr key={u.id}>
        <td data-label="Employee"><strong>{u.first} {u.last}</strong></td>
        <td data-label="Type"><span className={"badge " + (EMP_CLASS[u.classification]?.badge || 'b-gray')}>{u.classification}</span></td>
        <td data-label="Hrs / Abs">{u.classification === 'Teaching' ? (u.hoursWorked || 0) + ' hrs' : (u.absenceDays || 0) + ' days'}</td>
        <td data-label="Gross Pay">{fmt(r.details.grossTotal)}</td>
        <td data-label="Bonus">{bonusTotal > 0 ? fmt(bonusTotal) : '—'}</td>
        <td data-label="SSS">{fmt(r.sss)}</td>
        <td data-label="PhilHealth">{fmt(r.phil)}</td>
        <td data-label="Pag-IBIG">{fmt(r.pag)}</td>
        <td data-label="BIR">{fmt(r.bir)}</td>
        <td data-label="13th Tax">{(r.thirteenTax || 0) > 0 ? fmt(r.thirteenTax) : '—'}</td>
        <td data-label="Cash Adv">{(r.cash || 0) > 0 ? fmt(r.cash) : '—'}</td>
        <td data-label="Other">{customTotal > 0 ? fmt(customTotal) : '—'}</td>
        <td data-label="Net Pay"><strong style={{color:'var(--maroon-dark)'}}>{fmt(r.net)}</strong></td>
        <td data-label="Status">{rec ? <span className="badge b-green">✓ Released {rec.date}</span> : <span className="badge b-yellow">Pending</span>}</td>
      </tr>
    );
  });
}