// ── EMPLOYEE FUNCTIONS ────────────────────────────────────────
function renderEmpPayslips() {
  const tbody = document.getElementById('empPayslipBody');
  if (!tbody) return;
  tbody.innerHTML = payslips.map(p=>`
    <tr>
      <td><strong>${p.period}</strong></td>
      <td>${fmt(p.gross)}</td>
      <td>${fmt(p.sss)}</td>
      <td>${fmt(p.phil)}</td>
      <td>${fmt(p.pag)}</td>
      <td>${fmt(p.bir)}</td>
      <td><strong style="color:var(--maroon-dark)">${fmt(p.net)}</strong></td>
      <td><span class="badge ${p.status==='Released'?'b-green':'b-yellow'}">${p.status==='Released'?'✅':'⏳'} ${p.status}</span></td>
      <td><button class="btn btn-outline btn-sm" onclick="downloadPayslip('${p.period}')">📥 PDF</button></td>
    </tr>`).join('');
}

function downloadPayslip(period) {
  showToast('📄', `Payslip for ${period} downloaded as PDF.`);
}

// ── FINANCE FUNCTIONS ─────────────────────────────────────────
function updateFinStats() {
  const emps = users.filter(u=>u.status==='Active' && (u.role==='Employee' || u.role==='Finance Officer' || u.role==='System Admin') && u.salary>0);
  const teach = emps.filter(u=>u.classification==='Teaching').length;
  const nonT  = emps.length - teach;
  const el1 = document.getElementById('finTotEmp');
  const elT = document.getElementById('finTeachCnt');
  const elN = document.getElementById('finNonTeachCnt');
  if (el1) el1.textContent = emps.length;
  if (elT) elT.textContent = teach;
  if (elN) elN.textContent = nonT;
  let totGross=0, totDed=0, totNet=0;
  emps.forEach(e=>{ const g=empGrossPay(e); const d=computeDeductions(g); totGross+=g; totDed+=(d.sss+d.phil+d.pag+d.bir+d.cash); totNet+=d.net; });
  const el2 = document.getElementById('finTotGross');
  const el4 = document.getElementById('finTotDed');
  const el3 = document.getElementById('finTotNet');
  if (el2) el2.textContent = fmt(totGross);
  if (el4) el4.textContent = fmt(totDed);
  if (el3) el3.textContent = fmt(totNet);
}
