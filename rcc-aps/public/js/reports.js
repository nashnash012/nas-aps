// ── GOVERNMENT CONTRIBUTION REPORT ────────────────────────────
const GOV_REPORT_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function onGovYearChange() {
  const yearEl  = document.getElementById('govYear');
  const monthEl = document.getElementById('govMonth');
  const year    = yearEl.value;
  monthEl.value    = '';
  monthEl.disabled = !year;
  monthEl.style.opacity = year ? '1' : '0.4';
  document.getElementById('govMonthLabel').style.color = year ? '#444' : '#BBB';
  document.getElementById('govReportOutput').style.display = 'none';
  if (!year) return;
  monthEl.innerHTML = `<option value="">— Select Month —</option>` +
    GOV_REPORT_MONTHS.map((m, i) => `<option value="${i+1}">${m}</option>`).join('');
}
function onGovMonthChange() {
  const year  = parseInt(document.getElementById('govYear').value);
  const month = parseInt(document.getElementById('govMonth').value);
  if (!year || !month) return;
  renderGovReport(month, year);
}
function renderGovReport(month, year) {
  const out = document.getElementById('govReportOutput');
  out.style.display = 'block';
  out.scrollIntoView({behavior:'smooth'});
  document.getElementById('govReportTitle').textContent = `Government Contribution Report — ${GOV_REPORT_MONTHS[month-1]} ${year}`;
  document.getElementById('govHead').innerHTML = `<tr>
    <th>EMPLOYEE</th><th>TYPE</th><th>GROSS</th><th>SSS</th><th>PHILHEALTH</th><th>PAG-IBIG</th><th>BIR</th><th>TOTAL REMITTANCE</th>
  </tr>`;
  const emps = users.filter(u=>u.salary>0 && u.status==='Active');
  const isDec = month === 12;
  let tSSS=0, tPhil=0, tPag=0, tBIR=0, tGross=0;
  document.getElementById('govBody').innerHTML = emps.map(emp=>{
    const g = empGrossPay(emp);
    const d = computeDeductions(g, 0, 0);
    const taxable13 = isDec && isThirteenthActive() && thirteenthEligibility(emp, year).eligible ? splitBonusTaxable(computeThirteenth(emp, year), 0).taxable13 : 0;
    const b13 = isDec ? bonusAnnualTax(taxableMonthlyOf(g, d), taxable13) : 0;
    const birTotal = d.bir + b13;
    tGross+=g; tSSS+=d.sss; tPhil+=d.phil; tPag+=d.pag; tBIR+=birTotal;
    return `<tr>
      <td><strong>${displayName(emp)}</strong></td>
      <td><span class="badge ${EMP_CLASS[emp.classification]?.badge||'b-gray'}">${emp.classification||'Non-Teaching'}</span></td>
      <td>${fmt(g)}</td>
      <td>${fmt(d.sss)}</td>
      <td>${fmt(d.phil)}</td>
      <td>${fmt(d.pag)}</td>
      <td>${fmt(birTotal)}</td>
      <td><strong style="color:var(--maroon-dark)">${fmt(d.sss+d.phil+d.pag+birTotal)}</strong></td>
    </tr>`;
  }).join('');
  const grand = tSSS+tPhil+tPag+tBIR;
  document.getElementById('govTotals').innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:13px;align-items:center">
      <span><strong>Employees:</strong> ${emps.length}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Total SSS:</strong> ${fmt(tSSS)}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Total PhilHealth:</strong> ${fmt(tPhil)}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Total Pag-IBIG:</strong> ${fmt(tPag)}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Total BIR:</strong> ${fmt(tBIR)}</span>
      <span style="color:#CCC">|</span>
      <span><strong>Total Govt Remittance: <span style="color:var(--maroon-dark)">${fmt(grand)}</span></strong></span>
    </div>`;
}

// ── ANALYTICS ─────────────────────────────────────────────────
const ANALYTIC_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function renderAnalytics() {
  const active = users.filter(u=>u.status==='Active' && u.salary>0);
  if (!active.length) return;
  const teach = active.filter(u=>u.classification==='Teaching');
  const nonT  = active.filter(u=>u.classification!=='Teaching');
  const tGross = teach.reduce((s,u)=>s+empGrossPay(u),0);
  const nGross = nonT.reduce((s,u)=>s+empGrossPay(u),0);
  const total  = tGross + nGross;
  document.getElementById('anGross').textContent = fmt(total);
  const gov = {sss:0, phil:0, pag:0, bir:0};
  active.forEach(u=>{ const d=computeDeductions(empGrossPay(u)); gov.sss+=d.sss; gov.phil+=d.phil; gov.pag+=d.pag; gov.bir+=d.bir; });
  document.getElementById('anGovDed').textContent = fmt(gov.sss+gov.phil+gov.pag+gov.bir);
  document.getElementById('anTeach').textContent = fmt(tGross);
  const tn = document.getElementById('anTeachNote'); if (tn) tn.textContent = total ? Math.round(tGross/total*100)+'% of total' : '0% of total';
  document.getElementById('anNonTeach').textContent = fmt(nGross);
  const nn = document.getElementById('anNonTeachNote'); if (nn) nn.textContent = total ? Math.round(nGross/total*100)+'% of total' : '0% of total';

  // Trend chart — monthly gross payroll (Jan-May 2026)
  const months = ANALYTIC_MONTHS.slice(0,5);
  const trendFactors = [0.90, 0.94, 0.97, 1.0, 1.06];
  const trend = months.map((_,i)=>parseFloat((total*trendFactors[i]).toFixed(2)));
  const maxV = Math.max(...trend,1);
  document.getElementById('trendChart').innerHTML = `
    <div style="display:flex;align-items:flex-end;gap:18px;height:220px;padding:8px 4px 0">
      ${months.map((m,i)=>{
        const h = Math.max(12, Math.round(trend[i]/maxV*190));
        return `<div style="flex:1;text-align:center">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${fmt(trend[i])}</div>
          <div style="width:100%;background:linear-gradient(180deg,var(--maroon),var(--maroon-light));border-radius:8px 8px 0 0;height:${h}px;margin:0 auto"></div>
          <div style="font-size:11px;font-weight:600;color:var(--maroon-dark);margin-top:6px">${m}</div>
        </div>`;
      }).join('')}
    </div>`;

  // Teaching vs Non-Teaching donut + legend
  const pT = total ? Math.round(tGross/total*100) : 0;
  const pN = 100-pT;
  document.getElementById('tnBreakdown').innerHTML = `
    <div style="display:flex;align-items:center;gap:20px">
      <div style="width:130px;height:130px;border-radius:50%;background:conic-gradient(var(--maroon) 0 ${pT}%, var(--gold) ${pT}% 100%);position:relative;flex-shrink:0">
        <div style="position:absolute;inset:18px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-direction:column">
          <div style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--maroon-dark)">${pT}%</div>
          <div style="font-size:10px;color:var(--text-muted)">Teaching</div>
        </div>
      </div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #F5F0EA"><span style="width:12px;height:12px;border-radius:3px;background:var(--maroon)"></span><span style="font-size:13px;font-weight:600;color:var(--text)">Teaching</span><span style="margin-left:auto;font-size:13px;font-weight:700;color:var(--maroon-dark)">${fmt(tGross)}</span></div>
        <div style="display:flex;align-items:center;gap:8px;padding:8px 0"><span style="width:12px;height:12px;border-radius:3px;background:var(--gold)"></span><span style="font-size:13px;font-weight:600;color:var(--text)">Non-Teaching</span><span style="margin-left:auto;font-size:13px;font-weight:700;color:var(--maroon-dark)">${fmt(nGross)}</span></div>
      </div>
    </div>`;

  // Government deductions summary
  const rows = [['SSS',gov.sss],['PhilHealth',gov.phil],['Pag-IBIG',gov.pag],['BIR Withholding Tax',gov.bir]];
  const gTot = gov.sss+gov.phil+gov.pag+gov.bir;
  document.getElementById('govtDedBody').innerHTML = rows.map(([l,v])=>`
    <tr><td><strong>${l}</strong></td><td>${fmt(v)}</td><td>${fmt(v*5)}</td>
      <td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;max-width:120px;background:#F0EBE3;border-radius:4px;height:6px;overflow:hidden"><div style="height:6px;width:${gTot?Math.round(v/gTot*100):0}%;background:linear-gradient(90deg,var(--maroon),var(--gold));border-radius:4px"></div></div><span style="font-size:12px;font-weight:600">${gTot?Math.round(v/gTot*100):0}%</span></div></td></tr>`).join('');

  // 13th Month Pay cost impact (December)
  const bonusEl = document.getElementById('bonusImpact');
  if (bonusEl) {
    const decRegular = parseFloat(total.toFixed(2));
    const thirteenth = parseFloat(active.reduce((s,u)=>s+computeThirteenth(u,2026),0).toFixed(2));
    const decTotal = decRegular + thirteenth;
    const pct = decRegular ? Math.round((thirteenth/decRegular)*100) : 0;
    const maxB = Math.max(decRegular, decTotal, 1);
    bonusEl.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div>
          <div style="display:flex;align-items:flex-end;gap:24px;height:200px;padding:0 8px">
            <div style="flex:1;text-align:center">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${fmt(decRegular)}</div>
              <div style="width:100%;background:linear-gradient(180deg,var(--maroon),var(--maroon-light));border-radius:8px 8px 0 0;height:${Math.round(decRegular/maxB*180)}px;margin:0 auto"></div>
              <div style="font-size:11px;font-weight:600;color:var(--maroon-dark);margin-top:6px">Regular Monthly</div>
            </div>
            <div style="flex:1;text-align:center">
              <div style="font-size:11px;font-weight:700;color:var(--gold);margin-bottom:6px">+${fmt(thirteenth)}</div>
              <div style="width:100%;background:linear-gradient(180deg,#B8860B,var(--gold));border-radius:8px 8px 0 0;height:${Math.round(decTotal/maxB*180)}px;margin:0 auto"></div>
              <div style="font-size:11px;font-weight:600;color:var(--maroon-dark);margin-top:6px">December (incl. 13th Month)</div>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;justify-content:center;gap:12px">
          <div style="background:var(--gold-pale);border:1px solid var(--gold);border-radius:12px;padding:16px 20px;text-align:center">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Total 13th Month Payout</div>
            <div style="font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:var(--maroon-dark)">${fmt(thirteenth)}</div>
          </div>
          <div style="background:var(--maroon-dark);border-radius:12px;padding:16px 20px;text-align:center">
            <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:4px">December Payroll</div>
            <div style="font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:var(--gold-light)">${fmt(decTotal)}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:6px">+${pct}% vs regular monthly</div>
          </div>
        </div>
      </div>`;
  }
}
