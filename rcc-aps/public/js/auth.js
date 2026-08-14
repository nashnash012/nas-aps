// ── LOGIN ────────────────────────────────────────────────────
let loggedInUser = null; // current authenticated USERS_AUTH entry
function togglePass() {
  const p = document.getElementById('passInp');
  const e = document.getElementById('eyeBtn');
  p.type = p.type==='password' ? 'text' : 'password';
  e.textContent = p.type==='password' ? '👁' : '🙈';
}

function handleLogin() {
  const email = document.getElementById('emailInp').value.trim().toLowerCase();
  const pass  = document.getElementById('passInp').value.trim();
  const err   = document.getElementById('errBox');
  err.classList.remove('show');
  if (!email||!pass) {
    document.getElementById('errText').textContent='Please enter your email and password.';
    err.classList.add('show'); return;
  }
  const u = Object.values(USERS_AUTH).find(x => x.email === email);
  if (!u) {
    document.getElementById('errText').textContent='Invalid email or password. Please try again.';
    err.classList.add('show'); return;
  }
  if (u.status === 'Inactive') {
    document.getElementById('errText').textContent='This account is deactivated. Please contact the System Admin.';
    err.classList.add('show'); return;
  }
  if (pass !== u.pass) {
    document.getElementById('errText').textContent='Invalid email or password. Please try again.';
    err.classList.add('show'); return;
  }
  loggedInUser = u;
  // Loading state
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  document.getElementById('btnText').textContent = 'Signing in...';
  document.getElementById('spinner').style.display = 'inline-block';

  setTimeout(()=>{
    document.getElementById('loginForm').style.display = 'none';
    const rs = document.getElementById('rdScreen');
    rs.style.display = 'block';

    const roleIcons = {
      employee: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="28" cy="22" r="12" fill="#4A90D9"/><path d="M4 68c0-13.3 10.7-24 24-24h8c13.3 0 24 10.7 24 24" fill="#4A90D9"/><circle cx="52" cy="26" r="10" fill="#6BAEE8"/><path d="M30 68c0-11 8.9-20 20-20h6c11 0 20 9 20 20" fill="#6BAEE8"/></svg>`,
      finance:  `<svg width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="22" r="16" fill="#222"/><path d="M10 72c0-16.6 13.4-30 30-30h0c16.6 0 30 13.4 30 30" fill="#222"/><circle cx="58" cy="58" r="14" fill="#27AE60"/><text x="58" y="63" text-anchor="middle" font-size="14" font-weight="900" fill="white" font-family="Arial">$</text></svg>`,
      admin:    `<svg width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="36" cy="22" r="16" fill="#222"/><path d="M6 72c0-16.6 13.4-30 30-30h0c16.6 0 30 13.4 30 30" fill="#222"/><circle cx="60" cy="56" r="14" fill="#555"/><text x="60" y="61" text-anchor="middle" font-size="16" fill="white" font-family="Arial">⚙</text></svg>`,
    };
    document.getElementById('rdIcon').innerHTML = roleIcons[u.role] || roleIcons['employee'];
    document.getElementById('rdTitle').textContent = 'Welcome, ' + u.label + '!';
    document.getElementById('rdRoleLabel').textContent = u.label;
    document.getElementById('rdNote').textContent = 'Redirecting to ' + u.label + ' dashboard...';
    setTimeout(()=>document.getElementById('rdBar').style.width='100%', 100);
    setTimeout(()=>{
      document.getElementById('loginPage').style.display = 'none';
      document.getElementById(u.page).classList.add('show');
      initPage(u.page);
    }, 2200);
  }, 1000);
}

function logout() {
  document.querySelectorAll('.dashboard-page').forEach(p=>p.classList.remove('show'));
  const lp = document.getElementById('loginPage');
  lp.style.display = 'flex';
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('rdScreen').style.display = 'none';
  document.getElementById('rdBar').style.width = '0%';
  document.getElementById('emailInp').value = '';
  document.getElementById('passInp').value  = '';
  const btn = document.getElementById('loginBtn');
  btn.disabled = false;
  document.getElementById('btnText').textContent = 'Sign In';
  document.getElementById('spinner').style.display = 'none';
  showToast('👋','You have been logged out successfully.');
}

// ── EMPLOYEE PROFILE & PASSWORD ──────────────────────────────
function saveProfile() {
  const phone = document.getElementById('empPhone').value.trim();
  const addr  = document.getElementById('empAddr').value.trim();
  if (!phone) { showToast('⚠️','Please enter your phone number.'); return; }
  if (!addr)  { showToast('⚠️','Please enter your home address.'); return; }
  saveDemo();
  showToast('✅','Profile updated successfully!');
}

function changePassword() {
  const cur = document.getElementById('pwCurrent').value;
  const nw  = document.getElementById('pwNew').value;
  const cf  = document.getElementById('pwConfirm').value;
  const err = document.getElementById('pwError');
  if (!loggedInUser) { err.textContent = 'Session expired. Please log in again.'; err.classList.add('show'); return; }
  if (!cur || !nw || !cf) { err.textContent = 'Please fill in all fields.'; err.classList.add('show'); return; }
  if (nw.length < 8)      { err.textContent = 'New password must be at least 8 characters long.'; err.classList.add('show'); return; }
  if (nw !== cf)          { err.textContent = 'New password and confirmation do not match.'; err.classList.add('show'); return; }
  if (cur !== loggedInUser.pass) { err.textContent = 'Current password is incorrect.'; err.classList.add('show'); return; }
  loggedInUser.pass = nw;
  err.classList.remove('show');
  document.getElementById('pwCurrent').value = '';
  document.getElementById('pwNew').value = '';
  document.getElementById('pwConfirm').value = '';
  saveDemo();
  showToast('✅','Password changed successfully!');
}

document.addEventListener('keydown', e => { if (e.key==='Enter') handleLogin(); });

// ── PAGE NAVIGATION ───────────────────────────────────────────
function initPage(page) {
  setTopbarDates();
  if (page === 'empPage')     { renderPayslipList(); }
  if (page === 'financePage') { updateFinStats(); populateCalcEmployees(); renderPayrollSummary(); renderBonusModule(); renderAnalytics(); }
  if (page === 'adminPage')   { updateAdminStats(); renderAdminRecentUsers(); renderUserTable(); }
}
function setTopbarDates() {
  const d = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  ['empDateDisplay','finDateDisplay','admDateDisplay'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.textContent = d;
  });
}

// ── PAYSLIP DATA PER ROLE ────────────────────────────────────
const payslipPeriods = {
  2026: [
    {month:'December',status:'Pending'},
    {month:'May',    status:'Pending'},
    {month:'April',  status:'Released'},
    {month:'March',  status:'Released'},
    {month:'February',status:'Released'},
    {month:'January',status:'Released'},
  ],
  2025: [
    {month:'December', status:'Released'},{month:'November', status:'Released'},
    {month:'October',  status:'Released'},{month:'September',status:'Released'},
    {month:'August',   status:'Released'},{month:'July',     status:'Released'},
    {month:'June',     status:'Released'},{month:'May',      status:'Released'},
    {month:'April',    status:'Released'},{month:'March',    status:'Released'},
    {month:'February', status:'Released'},{month:'January',  status:'Released'},
  ],
};

function buildPayslipRows(tbodyId, salary, year, prefix) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const periods = payslipPeriods[year] || [];
  const empId = prefix==='emp'?3:prefix==='fin'?2:1;
  const emp = users.find(u=>u.id===empId);
  tbody.innerHTML = periods.map(p => {
    const isDec = p.month === 'December';
    const thirteenth = isDec && emp ? computeThirteenth(emp, year) : 0;
    const taxable13 = splitBonusTaxable(thirteenth, 0).taxable13;
    const d = computeDeductions(salary, 0, 0);
    const tTax = thirteenthTaxSplit(d, salary, taxable13);
    const totalDed = d.sss + d.phil + d.pag + d.bir + d.cash + tTax.annualTax;
    const gross = salary + thirteenth;
    const net = parseFloat((d.net + thirteenth - tTax.annualTax).toFixed(2));
    return `
    <tr>
      <td><strong>${p.month} ${year}</strong>${isDec?' <span class="badge b-gold" style="margin-left:4px;font-size:10px">🎁 13th Mo.</span>':''}</td>
      <td>${fmt(gross)}</td>
      <td>${fmt(totalDed)}</td>
      <td><strong style="color:var(--maroon-dark)">${fmt(net)}</strong></td>
      <td><span class="badge ${p.status==='Released'?'b-green':'b-yellow'}">${p.status==='Released'?'✓ Released':'⏳ Pending'}</span></td>
      <td><button class="btn btn-outline btn-sm" onclick="viewPayslipDetail('${p.month} ${year}',${salary},'${prefix}')" style="display:flex;align-items:center;gap:4px">👁 View</button></td>
    </tr>`;
  }).join('');
}

function renderPayslipList() {
  const year = parseInt(document.getElementById('psYear')?.value||2026);
  buildPayslipRows('psListBody', 28500, year, 'emp');
}
function renderFinPayslipList() {
  const year = parseInt(document.getElementById('finPsYear')?.value||2026);
  buildPayslipRows('finMyPayslipBody', 38000, year, 'fin');
}
function renderAdmPayslipList() {
  const year = parseInt(document.getElementById('admPsYear')?.value||2026);
  buildPayslipRows('admMyPayslipBody', 45000, year, 'adm');
}

function viewPayslipDetail(period, salary, prefix) {
  const gross = parseFloat(salary) || 0;
  const names = {emp:['Jhon Gerald','Batuaan','#USR-003','Employee','Teaching','150 hrs × ₱190.00'], fin:['John','Cabigting','#USR-002','Finance Officer','Non-Teaching','Monthly Base Salary'], adm:['Nash','Valencia','#USR-001','System Admin','Non-Teaching','Monthly Base Salary']};
  const n = names[prefix] || names.emp;
  const year = parseInt((period.match(/\d{4}/)||[])[0]) || new Date().getFullYear();
  const isDec = period.startsWith('December');
  const empId = prefix==='emp'?3:prefix==='fin'?2:1;
  const emp = users.find(u=>u.id===empId);
  const thirteenth = isDec && emp ? computeThirteenth(emp, year) : 0;
  const thirteenSplit = splitBonusTaxable(thirteenth, 0);
  const d = computeDeductions(gross, 0, 0);
  const tTax = thirteenthTaxSplit(d, gross, thirteenSplit.taxable13);
  const totalDed = d.sss + d.phil + d.pag + d.bir + d.cash + tTax.annualTax;

  const docId = prefix==='adm'?'admPsDoc':'psDoc';
  document.getElementById(docId).innerHTML = `
    <div style="text-align:center;margin-bottom:24px;padding-bottom:24px;border-bottom:2px solid var(--maroon-dark)">
      <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--maroon-dark)">Republic Central Colleges</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px">Automated Payroll System — Official Payslip</div>
      <div style="font-size:13px;color:var(--text-muted)">Period: ${period}${isDec?' <span class="badge b-gold" style="margin-left:4px">🎁 incl. 13th Month</span>':''}</div>
    </div>
    <div style="margin-bottom:20px">
      <div style="font-weight:700;font-size:13px;color:var(--maroon-dark);margin-bottom:12px">Employee Information</div>
      ${[['Name',`${n[0]} ${n[1]}`],['Employee ID',n[2]],['Position',n[3]],['Classification',n[4]],['Department','Finance Department']].map(([l,v])=>`
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px">
          <span style="color:var(--text-muted)">${l}</span><span style="font-weight:600">${v}</span>
        </div>`).join('')}
    </div>
    <div style="margin-bottom:20px">
      <div style="font-weight:700;font-size:13px;color:var(--maroon-dark);margin-bottom:12px">Earnings</div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px">
        <span style="color:var(--text-muted)">${n[5]}</span><span style="font-weight:600">${fmt(gross)}</span>
      </div>
      ${thirteenSplit.exempt13>0 ? `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px">
        <span style="color:var(--text-muted)">🎁 13th Month Pay (RA 8515) <span style="font-size:10px;color:#2E7D32">— exempt (≤₱90,000/yr)</span></span><span style="font-weight:700;color:var(--maroon-dark)">${fmt(thirteenSplit.exempt13)}</span>
      </div>`:''}
      ${thirteenSplit.taxable13>0 ? `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px">
        <span style="color:var(--text-muted)">⚠️ 13th Month excess <span style="font-size:10px;color:#C62828">— taxable (over ₱90,000)</span></span><span style="font-weight:700;color:#C62828">${fmt(thirteenSplit.taxable13)}</span>
      </div>`:''}
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;font-weight:700;color:var(--maroon-dark)">
        <span>Total Earnings</span><span>${fmt(gross + thirteenth)}</span>
      </div>
    </div>
    <div style="margin-bottom:20px">
      <div style="font-weight:700;font-size:13px;color:var(--maroon-dark);margin-bottom:12px">Deductions</div>
      ${[['SSS Contribution',d.sss],['PhilHealth Premium',d.phil],['Pag-IBIG Contribution',d.pag],['BIR Withholding Tax',d.bir],['Cash Advance',d.cash]].map(([l,v])=>`
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px">
          <span style="color:var(--text-muted)">${l}</span><span>${fmt(v)}</span>
        </div>`).join('')}
      ${tTax.annualTax > 0 ? `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px;background:#FFF8E1">
        <span style="color:#8D6E63">🧾 13th Month Excess Tax <span style="font-size:10px;color:#8D6E63">(over ₱90,000 exemption — withheld from 13th Month Pay)</span></span><span style="font-weight:700;color:#C62828">${fmt(tTax.annualTax)}</span>
      </div>`:''}
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;font-weight:700;color:#C62828">
        <span>Total Deductions</span><span>${fmt(totalDed)}</span>
      </div>
    </div>
    <div style="background:linear-gradient(135deg,var(--maroon-dark),var(--maroon));border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <span style="font-weight:700;color:#fff;letter-spacing:1px">NET PAY</span>
      <span style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#fff">${fmt(d.net + thirteenth - tTax.annualTax)}</span>
    </div>
    <div style="text-align:center;font-size:11px;color:#AAA">This is a computer-generated payslip. No signature required.</div>
  `;

  // Show detail page based on prefix
  if (prefix==='emp') {
    document.getElementById('empPayslip').style.display='none';
    document.getElementById('payslipDetailPage').style.display='block';
    document.getElementById('psBackBtn').onclick = ()=>{
      document.getElementById('payslipDetailPage').style.display='none';
      document.getElementById('empPayslip').style.display='block';
    };
  } else if (prefix==='fin') {
    document.getElementById('finMyPayslip').style.display='none';
    document.getElementById('finPayslipDetail').style.display='block';
  } else if (prefix==='adm') {
    document.getElementById('admMyPayslip').style.display='none';
    document.getElementById('admPayslipDetail').style.display='block';
  }
}

function printPayslip() { showToast('📥','Payslip downloaded as PDF successfully!'); }

function renderMyPayslips(tbodyId, salary) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const d = computeDeductions(salary);
  tbody.innerHTML = payslips.map(p => `
    <tr>
      <td><strong>${p.period}</strong></td>
      <td>${fmt(salary)}</td>
      <td>${fmt(d.sss)}</td>
      <td>${fmt(d.phil)}</td>
      <td>${fmt(d.pag)}</td>
      <td>${fmt(d.bir)}</td>
      <td><strong style="color:var(--maroon-dark)">${fmt(d.net)}</strong></td>
      <td><span class="badge ${p.status==='Released'?'b-green':'b-yellow'}">${p.status==='Released'?'✅':'⏳'} ${p.status}</span></td>
      <td><button class="btn btn-outline btn-sm" onclick="downloadPayslip('${p.period}')">📥 PDF</button></td>
    </tr>`).join('');
}

function showFinPage(id, btn) {
  ['finDashboard','finAnalytics','finBonus','finPayroll','finReports','finGovReport','finPayrollReport','finDeduction','finMyPayslip','finPayslipDetail','finMyProfile','finChangePassword',
   'finDedSSS','finDedPhilHealth','finDedPagIBIG','finDedBIR'].forEach(x=>{
    const el = document.getElementById(x);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (target) target.style.display = 'block';
  document.querySelectorAll('#financePage .nav-item').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const labels = {finDashboard:'Dashboard',finAnalytics:'Analytics',finBonus:'Bonus Management',finPayroll:'Payroll Calculation',finReports:'Reports',finGovReport:'Reports',finPayrollReport:'Reports',finDeduction:'Deduction Tables',finMyPayslip:'My Payslip',finMyProfile:'My Profile',finChangePassword:'Change Password'};
  const bc = document.getElementById('finBreadcrumb');
  if (bc) bc.textContent = labels[id] || 'Dashboard';
  if (id === 'finDashboard') updateFinStats();
  if (id === 'finAnalytics') renderAnalytics();
  if (id === 'finBonus') renderBonusModule();
  if (id === 'finPayroll') { populateCalcEmployees(); renderPayrollSummary(); }
  if (id === 'finDeduction') renderDeductionCategories();
  if (id === 'finMyPayslip') renderFinPayslipList();
  if (id === 'admMyPayslip') renderAdmPayslipList();
  if (id === 'finPayrollReport') {
    document.getElementById('reportOutput').style.display = 'none';
    renderMonthButtons();
  }
}

function showEmpPage(id, btn) {
  ['empDashboard','empPayslip','empProfile','empPassword','payslipDetailPage'].forEach(x=>{
    const el = document.getElementById(x);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (target) target.style.display = 'block';
  document.querySelectorAll('#empPage .nav-item').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function showAdmPage(id, btn) {
  ['admDashboard','admUsers','admDeduction','admMyPayslip','admPayslipDetail','admMyProfile','admChangePassword'].forEach(x=>{
    const el = document.getElementById(x);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (target) target.style.display = 'block';
  document.querySelectorAll('#adminPage .nav-item').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const labels = {admDashboard:'Dashboard',admUsers:'User Management',admDeduction:'Deduction Tables',admMyPayslip:'My Payslip',admMyProfile:'My Profile',admChangePassword:'Change Password'};
  const bc = document.getElementById('admBreadcrumb');
  if (bc) bc.textContent = labels[id] || 'Dashboard';
  if (id === 'admDashboard') { updateAdminStats(); renderAdminRecentUsers(); }
  if (id === 'admUsers') renderUserTable();
}
