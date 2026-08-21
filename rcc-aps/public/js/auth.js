// ── LOGIN ────────────────────────────────────────────────────
let loggedInUser = null; // current authenticated USERS_AUTH entry
let loginFails = 0, lockUntil = 0;

// Pure-ish credential check with basic brute-force throttling
// (demo-grade: 5 failed attempts lock attempts for 30 seconds).
function checkLogin(email, pass) {
  const now = Date.now();
  if (now < lockUntil) {
    return { ok:false, msg:'Too many failed attempts. Try again in ' + Math.ceil((lockUntil - now)/1000) + 's.' };
  }
  const u = Object.values(USERS_AUTH).find(x => x.email === email);
  if (!u) {
    loginFails++;
    if (loginFails >= 5) { lockUntil = Date.now() + 30000; loginFails = 0; return { ok:false, msg:'Too many failed attempts. Locked for 30 seconds.' }; }
    return { ok:false, msg:'Invalid email or password. Please try again.' };
  }
  if (u.status === 'Inactive') {
    return { ok:false, msg:'This account is deactivated. Please contact the System Admin.' };
  }
  if (pass !== u.pass) {
    loginFails++;
    if (loginFails >= 5) { lockUntil = Date.now() + 30000; loginFails = 0; return { ok:false, msg:'Too many failed attempts. Locked for 30 seconds.' }; }
    return { ok:false, msg:'Invalid email or password. Please try again.' };
  }
  loginFails = 0;
  return { ok:true, user:u };
}

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
  const res = checkLogin(email, pass);
  if (!res.ok) {
    document.getElementById('errText').textContent = res.msg;
    err.classList.add('show'); return;
  }
  const u = res.user;
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

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  // Only trigger login while the login page is actually visible.
  const lp = document.getElementById('loginPage');
  if (lp && lp.style.display !== 'none') handleLogin();
});

// ── PAGE NAVIGATION ───────────────────────────────────────────
function initPage(page) {
  restoreProfileFields();
  setTopbarDates();
  if (page === 'empPage')     { renderEmpDashboard(); renderPayslipList(); }
  if (page === 'financePage') { updateFinStats(); renderFinRecentActivity(); populateCalcEmployees(); renderPayrollSummary(); renderBonusModule(); renderAnalytics(); }
  if (page === 'adminPage')   { updateAdminStats(); renderAdminRecentUsers(); renderUserTable(); }
}
function setTopbarDates() {
  const d = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  ['empDateDisplay','finDateDisplay','admDateDisplay'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.textContent = d;
  });
}

// ── PAYSLIP DATA (from confirmed payroll records) ────────────
// The employee record behind the currently logged-in account.
function currentEmp() {
  return users.find(u => u.id === (loggedInUser && loggedInUser.id));
}

// Fill a payslip year dropdown with years that have confirmed records.
function populatePayslipYears(selectId, preferred) {
  const emp = currentEmp();
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const years = emp ? payslipYearsFor(emp.id) : [];
  if (!years.length) {
    sel.innerHTML = '<option value="">— No payslips —</option>';
    sel.disabled = true;
    return;
  }
  sel.disabled = false;
  sel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
  sel.value = years.includes(preferred) ? preferred : years[years.length - 1];
}

function buildPayslipRows(tbodyId, year, prefix) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const emp = currentEmp();
  const records = emp ? payslipRecordsFor(emp.id, year) : [];
  if (!records.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px">
      <div style="font-size:30px;margin-bottom:8px">📭</div>
      <div style="font-weight:600">No payslips available</div>
      <div style="font-size:12px;color:#AAA;margin-top:4px">${year ? `No payroll released for ${year}.` : 'Payslips appear here once the Finance Officer releases your payroll.'}</div>
    </td></tr>`;
    return;
  }
  tbody.innerHTML = records.map(p => {
    const isDec = p.monthNum === 12;
    const totalDed = p.sss + p.phil + p.pag + p.bir + p.cash + p.thirteenTax + (p.customTotal || 0);
    return `
    <tr>
      <td><strong>${p.period}</strong>${isDec?' <span class="badge b-gold" style="margin-left:4px;font-size:10px">🎁 13th Mo.</span>':''}</td>
      <td>${fmt(p.gross)}</td>
      <td>${fmt(totalDed)}</td>
      <td><strong style="color:var(--maroon-dark)">${fmt(p.net)}</strong></td>
      <td><span class="badge b-green">✓ Released</span></td>
      <td><button class="btn btn-outline btn-sm" onclick="viewPayslipDetail('${p.period}',${emp.id})" style="display:flex;align-items:center;gap:4px">👁 View</button></td>
    </tr>`;
  }).join('');
}

function renderPayslipList() {
  const sel = document.getElementById('psYear');
  if (!sel) return;
  const preferred = parseInt(sel.value) || 0;
  populatePayslipYears('psYear', preferred);
  buildPayslipRows('psListBody', parseInt(sel.value) || 0, 'emp');
}
function renderFinPayslipList() {
  const sel = document.getElementById('finPsYear');
  if (!sel) return;
  const preferred = parseInt(sel.value) || 0;
  populatePayslipYears('finPsYear', preferred);
  buildPayslipRows('finMyPayslipBody', parseInt(sel.value) || 0, 'fin');
}
function renderAdmPayslipList() {
  const sel = document.getElementById('admPsYear');
  if (!sel) return;
  const preferred = parseInt(sel.value) || 0;
  populatePayslipYears('admPsYear', preferred);
  buildPayslipRows('admMyPayslipBody', parseInt(sel.value) || 0, 'adm');
}

// Employee dashboard: hero, stat cards and Recent Payslips from confirmed records.
function renderEmpDashboard() {
  const emp = currentEmp();
  const el = id => document.getElementById(id);
  if (!emp) return;

  const years = payslipYearsFor(emp.id);
  const allRecs = [];
  years.forEach(y => allRecs.push(...payslipRecordsFor(emp.id, y)));
  const latestRec = allRecs[allRecs.length - 1];
  const base = empGrossPay(emp);

  const heroName = el('empHeroName');
  if (heroName) heroName.innerHTML = `Welcome back, ${esc(emp.first)}! 👋`;
  const heroSub = el('empHeroSub');
  if (heroSub) heroSub.textContent = latestRec
    ? `Here is your payroll summary for ${latestRec.period}.`
    : 'No payroll released yet. Payslips appear once the Finance Officer releases your payroll.';

  let nextLabel = '—';
  if (latestRec) {
    let m = latestRec.monthNum + 1, y = latestRec.year;
    if (m > 12) { m = 1; y += 1; }
    nextLabel = `${MONTHS[m - 1].slice(0, 3)} ${y}`;
  }

  const set = (id, txt) => { const e = el(id); if (e) e.textContent = txt; };
  set('empHeroBasic', fmt(base));
  set('empHeroNet', latestRec ? fmt(latestRec.net) : '—');
  set('empHeroNext', nextLabel);
  set('empStatNet', latestRec ? fmt(latestRec.net) : '₱0.00');
  set('empStatPayslips', allRecs.length);
  set('empStatDed', latestRec ? fmt(latestRec.sss + latestRec.phil + latestRec.pag + latestRec.bir + latestRec.thirteenTax + latestRec.cash + (latestRec.customTotal || 0)) : '₱0.00');
  set('empStatNext', nextLabel);

  const avatar = el('empAvatar');
  if (avatar) avatar.textContent = (emp.first[0] || '') + (emp.last[0] || '');
  const tbName = el('empTbName');
  if (tbName) tbName.textContent = displayName(emp);

  const tbody = el('empRecentPayslipBody');
  if (tbody) {
    tbody.innerHTML = allRecs.length
      ? allRecs.slice(-4).reverse().map(p => `
          <tr>
            <td><strong>${p.period}</strong>${p.monthNum===12?' <span class="badge b-gold" style="margin-left:4px;font-size:10px">🎁 13th</span>':''}</td>
            <td>${fmt(p.gross)}</td>
            <td><strong style="color:var(--maroon-dark)">${fmt(p.net)}</strong></td>
            <td><span class="badge b-green">✓ Released</span></td>
          </tr>`).join('')
      : `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px">📭 No payslips yet.</td></tr>`;
  }
}

function viewPayslipDetail(period, empId) {
  const emp = users.find(u => u.id === empId);
  const year = parseInt((period.match(/\d{4}/) || [])[0]) || new Date().getFullYear();
  const monthNum = MONTHS.indexOf(period.replace(` ${year}`, '')) + 1;
  const rec = emp && payrollRecords.find(r => r.empId === emp.id && r.month === monthNum && r.year === year);
  if (!emp || !rec) { showToast('⚠️', 'Payslip record not found.'); return; }

  const grossTaxable = parseFloat(rec.gross) || 0;
  const deMinimis    = parseFloat(rec.deMinimisSum) || 0;
  const thirteenth   = parseFloat(rec.thirteenth) || 0;
  const exempt13     = parseFloat(rec.thirteenExempt) || 0;
  const taxable13    = parseFloat(rec.thirteenTaxable) || 0;
  const thirteenTax  = parseFloat(rec.thirteenTax) || 0;
  const sss = parseFloat(rec.sss)||0, phil = parseFloat(rec.phil)||0, pag = parseFloat(rec.pag)||0, bir = parseFloat(rec.bir)||0, cash = parseFloat(rec.cash)||0;
  const customDeds = Array.isArray(rec.customDeds) ? rec.customDeds : [];
  const customTotal = customDeds.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
  const totalDed  = sss + phil + pag + bir + cash + thirteenTax + customTotal;
  const totalGross = grossTaxable + deMinimis + thirteenth;
  const earningLabel = emp.classification === 'Teaching'
    ? `${emp.hoursWorked||0} hrs × ₱${(parseFloat(emp.hourlyRate)||0).toFixed(2)}`
    : 'Monthly Base Salary';
  const isDec = monthNum === 12;

  const docId = empId === 3 ? 'psDoc' : empId === 2 ? 'finPsDoc' : 'admPsDoc';
  document.getElementById(docId).innerHTML = `
    <div style="text-align:center;margin-bottom:24px;padding-bottom:24px;border-bottom:2px solid var(--maroon-dark)">
      <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--maroon-dark)">Republic Central Colleges</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px">Automated Payroll System — Official Payslip</div>
      <div style="font-size:13px;color:var(--text-muted)">Period: ${period}${isDec?' <span class="badge b-gold" style="margin-left:4px">🎁 incl. 13th Month</span>':''}</div>
    </div>
    <div style="margin-bottom:20px">
      <div style="font-weight:700;font-size:13px;color:var(--maroon-dark);margin-bottom:12px">Employee Information</div>
      ${[['Name', esc(displayName(emp))],['Employee ID', '#USR-00' + emp.id],['Position', esc(emp.role)],['Classification', emp.classification || 'Non-Teaching'],['Department', esc(emp.department || '—')]].map(([l,v])=>`
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px">
          <span style="color:var(--text-muted)">${l}</span><span style="font-weight:600">${v}</span>
        </div>`).join('')}
    </div>
    <div style="margin-bottom:20px">
      <div style="font-weight:700;font-size:13px;color:var(--maroon-dark);margin-bottom:12px">Earnings</div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px">
        <span style="color:var(--text-muted)">${earningLabel}</span><span style="font-weight:600">${fmt(grossTaxable)}</span>
      </div>
      ${deMinimis>0 ? `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px">
        <span style="color:var(--text-muted)">De Minimis Benefits</span><span style="font-weight:600">${fmt(deMinimis)}</span>
      </div>`:''}
      ${exempt13>0 ? `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px">
        <span style="color:var(--text-muted)">🎁 13th Month Pay (RA 8515) <span style="font-size:10px;color:#2E7D32">— exempt (≤${fmt(BONUS_EXEMPTION_LIMIT)}/yr)</span></span><span style="font-weight:700;color:var(--maroon-dark)">${fmt(exempt13)}</span>
      </div>`:''}
      ${taxable13>0 ? `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px">
        <span style="color:var(--text-muted)">⚠️ 13th Month excess <span style="font-size:10px;color:#C62828">— taxable (over ${fmt(BONUS_EXEMPTION_LIMIT)})</span></span><span style="font-weight:700;color:#C62828">${fmt(taxable13)}</span>
      </div>`:''}
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;font-weight:700;color:var(--maroon-dark)">
        <span>Total Earnings</span><span>${fmt(totalGross)}</span>
      </div>
    </div>
    <div style="margin-bottom:20px">
      <div style="font-weight:700;font-size:13px;color:var(--maroon-dark);margin-bottom:12px">Deductions</div>
      ${[['SSS Contribution',sss],['PhilHealth Premium',phil],['Pag-IBIG Contribution',pag],['BIR Withholding Tax',bir],['Cash Advance',cash]].map(([l,v])=>`
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px">
          <span style="color:var(--text-muted)">${l}</span><span>${fmt(v)}</span>
        </div>`).join('')}
      ${customDeds.map(x=>`
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px">
          <span style="color:var(--text-muted)">📌 ${esc(x.name)}</span><span>${fmt(x.amount)}</span>
        </div>`).join('')}
      ${thirteenTax>0 ? `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F0EBE3;font-size:13px;background:#FFF8E1">
        <span style="color:#8D6E63">🧾 13th Month Excess Tax <span style="font-size:10px;color:#8D6E63">(over ${fmt(BONUS_EXEMPTION_LIMIT)} exemption — withheld from 13th Month Pay)</span></span><span style="font-weight:700;color:#C62828">${fmt(thirteenTax)}</span>
      </div>`:''}
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;font-weight:700;color:#C62828">
        <span>Total Deductions</span><span>${fmt(totalDed)}</span>
      </div>
    </div>
    <div style="background:linear-gradient(135deg,var(--maroon-dark),var(--maroon));border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <span style="font-weight:700;color:#fff;letter-spacing:1px">NET PAY</span>
      <span style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#fff">${fmt(rec.net)}</span>
    </div>
    <div style="text-align:center;font-size:11px;color:#AAA">This is a computer-generated payslip. No signature required.</div>
  `;

  // Show detail page based on role
  if (empId === 3) {
    document.getElementById('empPayslip').style.display='none';
    document.getElementById('payslipDetailPage').style.display='block';
    document.getElementById('psBackBtn').onclick = ()=>{
      document.getElementById('payslipDetailPage').style.display='none';
      document.getElementById('empPayslip').style.display='block';
    };
  } else if (empId === 2) {
    document.getElementById('finMyPayslip').style.display='none';
    document.getElementById('finPayslipDetail').style.display='block';
  } else if (empId === 1) {
    document.getElementById('admMyPayslip').style.display='none';
    document.getElementById('admPayslipDetail').style.display='block';
  }
}

function printPayslip() {
  const active = document.querySelector('.dashboard-page.show');
  const cfg = {
    empPage: 'psDoc',
    financePage: 'finPsDoc',
    adminPage: 'admPsDoc'
  }[active && active.id];
  const doc = cfg ? document.getElementById(cfg) : null;
  if (!doc || !doc.innerHTML.trim()) { showToast('⚠️','No payslip to download.'); return; }
  const period = (doc.innerHTML.match(/Period:\s*([A-Za-z]+\s+\d{4})/) || [])[1] || '';
  const name   = (doc.innerHTML.match(/Name<\/span><span style="font-weight:600">([^<]+)<\/span>/) || [])[1] || '';
  const base   = `Payslip_${name.trim().replace(/\s+/g,'_')}_${period.replace(/\s+/g,'')}`;
  const oldTitle = document.title;
  document.title = base + '.pdf';
  const old = document.getElementById('printOverlay');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'printOverlay';
  overlay.innerHTML = doc.innerHTML;
  document.body.appendChild(overlay);
  window.print();
  setTimeout(()=>{ if (overlay.parentNode) overlay.parentNode.removeChild(overlay); document.title = oldTitle; }, 1500);
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
  if (id === 'finDashboard') { updateFinStats(); renderFinRecentActivity(); }
  if (id === 'finAnalytics') renderAnalytics();
  if (id === 'finBonus') renderBonusModule();
  if (id === 'finPayroll') { populateCalcEmployees(); renderPayrollSummary(); }
  if (id === 'finDeduction') { renderDeductionCategories(); renderDedBanner(); }
  if (id === 'finMyPayslip') renderFinPayslipList();
  if (id === 'finPayrollReport') {
    document.getElementById('reportOutput').style.display = 'none';
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
  if (id === 'empPayslip') renderPayslipList();
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
  if (id === 'admDeduction') renderAdmDedTables();
  if (id === 'admMyPayslip') renderAdmPayslipList();
}
