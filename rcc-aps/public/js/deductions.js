// ── DEDUCTION CATEGORIES ─────────────────────────────────────
let deductionCategories = (_savedDemo && _savedDemo.deductionCategories) || [];
let nextDedCatId = (_savedDemo && _savedDemo.nextDedCatId) || 1;

function renderDeductionCategories() {
  const list  = document.getElementById('deductionCategoryList');
  const empty = document.getElementById('deductionCategoryEmpty');
  if (!list) return;

  const cats = deductionCategories;
  if (!cats.length) {
    list.style.display  = 'none';
    empty.style.display = 'block';
    return;
  }
  list.style.display  = 'grid';
  empty.style.display = 'none';

  const typeLabel = { fixed:'Fixed Amount', percent:'% of Gross' };
  list.innerHTML = cats.map(c => `
    <div class="card" style="margin:0">
      <div class="card-body" style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div>
            <div style="font-weight:700;font-size:15px;color:var(--maroon-dark)">${c.name}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${c.desc || '—'}</div>
          </div>
          <span class="badge ${c.status==='Active'?'b-green':'b-gray'}" style="flex-shrink:0">● ${c.status}</span>
        </div>
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px">
          <div style="background:var(--gold-pale);border:1px solid var(--gold);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;color:var(--maroon-dark)">
            ${c.type==='fixed' ? '₱'+c.amount.toLocaleString('en-PH',{minimumFractionDigits:2}) : c.amount+'%'}
          </div>
          <div style="font-size:12px;color:var(--text-muted)">${typeLabel[c.type]}</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-outline btn-sm" onclick="editDeductionCategory(${c.id})">✏️ Edit</button>
          <button class="btn btn-outline btn-sm" style="color:#C62828;border-color:#FFCDD2" onclick="deleteDeductionCategory(${c.id})">🗑️ Remove</button>
        </div>
      </div>
    </div>`).join('');
}

function openAddDeductionCategory() {
  document.getElementById('dedCatModalTitle').textContent = 'Add Deduction Category';
  document.getElementById('dedCatName').value   = '';
  document.getElementById('dedCatType').value   = 'fixed';
  document.getElementById('dedCatAmount').value = '';
  document.getElementById('dedCatDesc').value   = '';
  document.getElementById('dedCatStatus').value = 'Active';
  document.getElementById('dedCatErr').style.display = 'none';
  document.getElementById('dedCatAmountLabel').textContent = 'Default Amount (₱)';
  document.getElementById('dedCatModal').style.display = 'flex';
  document.getElementById('dedCatModal').dataset.editId = '';
}

function editDeductionCategory(id) {
  const c = deductionCategories.find(x=>x.id===id); if(!c) return;
  document.getElementById('dedCatModalTitle').textContent = 'Edit Deduction Category';
  document.getElementById('dedCatName').value   = c.name;
  document.getElementById('dedCatType').value   = c.type;
  document.getElementById('dedCatAmount').value = c.amount;
  document.getElementById('dedCatDesc').value   = c.desc;
  document.getElementById('dedCatStatus').value = c.status;
  document.getElementById('dedCatErr').style.display = 'none';
  document.getElementById('dedCatAmountLabel').textContent = c.type==='fixed' ? 'Default Amount (₱)' : 'Rate (%)';
  document.getElementById('dedCatModal').style.display = 'flex';
  document.getElementById('dedCatModal').dataset.editId = id;
}

function saveDeductionCategory() {
  const name   = document.getElementById('dedCatName').value.trim();
  const type   = document.getElementById('dedCatType').value;
  const amount = parseFloat(document.getElementById('dedCatAmount').value) || 0;
  const desc   = document.getElementById('dedCatDesc').value.trim();
  const status = document.getElementById('dedCatStatus').value;
  const err    = document.getElementById('dedCatErr');
  err.style.display = 'none';

  if (!name) { err.textContent='Please enter a category name.'; err.style.display='block'; return; }

  const editId = document.getElementById('dedCatModal').dataset.editId;
  if (editId) {
    const c = deductionCategories.find(x=>x.id===parseInt(editId));
    if (c) { c.name=name; c.type=type; c.amount=amount; c.desc=desc; c.status=status; }
    showToast('✅', `"${name}" updated successfully!`);
  } else {
    deductionCategories.push({ id:nextDedCatId++, name, type, amount, desc, status });
    showToast('✅', `"${name}" added successfully!`);
  }
  closeModal('dedCatModal');
  saveDemo();
  renderDeductionCategories();
}

function deleteDeductionCategory(id) {
  const c = deductionCategories.find(x=>x.id===id); if(!c) return;
  if (confirm(`Remove "${c.name}"? This cannot be undone.`)) {
    deductionCategories = deductionCategories.filter(x=>x.id!==id);
    saveDemo();
    renderDeductionCategories();
    showToast('🗑️', `"${c.name}" removed.`);
  }
}

// Update type label when type changes
document.addEventListener('change', e => {
  if (e.target.id === 'dedCatType') {
    document.getElementById('dedCatAmountLabel').textContent =
      e.target.value === 'fixed' ? 'Default Amount (₱)' : 'Rate (%)';
  }
});

function exportReport() { showToast('📥','Report exported to PDF/Excel successfully!'); }


// ── USER MANAGEMENT ───────────────────────────────────────────
const roleColor = {'System Admin':'#880E4F','Finance Officer':'#7D5A00','Employee':'#1565C0'};
const roleBadge = {'System Admin':'b-pink','Finance Officer':'b-gold','Employee':'b-blue'};
function initials(f,l){ return (f[0]+(l[0]||'')).toUpperCase(); }

function renderUserTable() {
  const q      = (document.getElementById('uSearch')||{}).value?.toLowerCase()||'';
  const role   = (document.getElementById('uRoleFilter')||{}).value||'';
  const status = (document.getElementById('uStatusFilter')||{}).value||'';
  const filtered = users.filter(u=>{
    const name = `${u.first} ${u.last}`.toLowerCase();
    return (!q || name.includes(q)||u.email.includes(q)) && (!role||u.role===role) && (!status||u.status===status);
  });
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;
  tbody.innerHTML = filtered.map(u=>`
    <tr>
      <td><div style="display:flex;align-items:center;gap:10px">
        <div style="width:34px;height:34px;border-radius:50%;background:${roleColor[u.role]};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">${initials(u.first,u.last)}</div>
        <div><div style="font-weight:600">${displayName(u)} <span class="badge ${EMP_CLASS[u.classification||'Non-Teaching']?.badge||'b-gray'}" style="margin-left:6px;font-size:10px">${u.classification||'Non-Teaching'}</span></div><div style="font-size:11px;color:var(--text-muted)">#USR-00${u.id}</div></div>
      </div></td>
      <td>${u.email}</td>
      <td><span class="badge ${roleBadge[u.role]}">${u.role}</span></td>
      <td><span class="badge ${u.status==='Active'?'b-green':'b-gray'}">${u.status==='Active'?'● Active':'● Inactive'}</span></td>
      <td>${u.date}</td>
      <td><div style="display:flex;gap:6px">
        <button class="btn btn-outline btn-sm btn-icon" title="View" onclick="viewUser(${u.id})">👁</button>
        ${u.status==='Active'
          ? `<button class="btn btn-outline btn-sm btn-icon" style="color:#C62828;border-color:#FFCDD2" title="Deactivate" onclick="confirmDeactivate(${u.id})">⏸</button>`
          : `<button class="btn btn-outline btn-sm btn-icon" title="Reactivate" onclick="reactivateUser(${u.id})">▶</button>`}
        <button class="btn btn-outline btn-sm btn-icon" style="color:#C62828;border-color:#FFCDD2" title="Remove" onclick="confirmRemove(${u.id})">🗑️</button>
      </div></td>
    </tr>`).join('');
  document.getElementById('uEmpty').style.display = filtered.length ? 'none' : 'block';
  updateAdminStats();
}

function updateAdminStats() {
  const tot = users.length, act = users.filter(u=>u.status==='Active').length;
  const inact = users.filter(u=>u.status==='Inactive').length;
  const adm = users.filter(u=>u.role==='System Admin').length;
  const fin = users.filter(u=>u.role==='Finance Officer').length;
  const emp = users.filter(u=>u.role==='Employee').length;
  ['admTot','admTotStat'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=tot; });
  ['admAct','admActStat'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=act; });
  ['admInact','admInactStat'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=inact; });
  const bd = document.getElementById('admBreakdown'); if(bd) bd.textContent=`${adm} Admin · ${fin} Finance · ${emp} Emp`;
  ['u-admin','u-finance','u-employee','u-inactive'].forEach((id,i)=>{
    const el=document.getElementById(id); if(el) el.textContent=[adm,fin,emp,inact][i];
  });
}

function renderAdminRecentUsers() {
  const tbody = document.getElementById('admRecentUsers');
  if (!tbody) return;
  const recent = users.slice(0,4);
  tbody.innerHTML = recent.map(u=>`
    <tr>
      <td><strong>${displayName(u)}</strong></td>
      <td><span class="badge ${roleBadge[u.role]}">${u.role}</span></td>
      <td style="font-size:12px;color:var(--text-muted)">Apr 28, 2026</td>
      <td><span class="badge ${u.status==='Active'?'b-green':'b-gray'}">${u.status==='Active'?'● Active':'● Inactive'}</span></td>
    </tr>`).join('');
}

function openAddUserModal() {
  editingUserId = null;
  document.getElementById('uModalTitle').textContent = 'Add New User';
  document.getElementById('uFirst').value  = '';
  document.getElementById('uLast').value   = '';
  document.getElementById('uEmail').value  = '';
  document.getElementById('uRole').value   = 'Employee';
  document.getElementById('uStatus').value = 'Active';
  document.getElementById('uPass').value   = '';
  document.getElementById('uClass').value  = 'Non-Teaching';
  document.getElementById('uDept').value   = '';
  document.getElementById('uSalary').value = '';
  document.getElementById('uHourly').value = '';
  document.getElementById('uHire').value   = '';
  document.getElementById('uHrsAbs').value = '';
  document.getElementById('uPassGroup').style.display = 'block';
  document.getElementById('uErr').classList.remove('show');
  toggleUserClassFields();
  document.getElementById('userModal').classList.add('show');
}
function openEditUserModal(id) {
  const u = users.find(x=>x.id===id); if(!u) return;
  editingUserId = id;
  document.getElementById('uModalTitle').textContent = 'Edit User';
  document.getElementById('uFirst').value  = u.first;
  document.getElementById('uLast').value   = u.last;
  document.getElementById('uEmail').value  = u.email;
  document.getElementById('uRole').value   = u.role;
  document.getElementById('uStatus').value = u.status;
  document.getElementById('uClass').value  = u.classification || 'Non-Teaching';
  document.getElementById('uDept').value   = u.department || '';
  document.getElementById('uSalary').value = u.salary || '';
  document.getElementById('uHourly').value = u.hourlyRate || '';
  document.getElementById('uHire').value   = u.hireDate || '';
  document.getElementById('uHrsAbs').value = (u.hoursWorked || u.absenceDays || '');
  document.getElementById('uPassGroup').style.display = 'none';
  document.getElementById('uErr').classList.remove('show');
  toggleUserClassFields();
  closeModal('viewUserModal');
  document.getElementById('userModal').classList.add('show');
}
function toggleUserClassFields() {
  const c = document.getElementById('uClass')?.value;
  const hg = document.getElementById('uHourlyGroup');
  if (hg) hg.style.opacity = c==='Teaching' ? '1' : '0.5';
  const hr = document.getElementById('uHourly');
  if (hr) hr.disabled = c!=='Teaching';
}
function saveUser() {
  const first=document.getElementById('uFirst').value.trim(), last=document.getElementById('uLast').value.trim();
  const email=document.getElementById('uEmail').value.trim(), role=document.getElementById('uRole').value;
  const status=document.getElementById('uStatus').value, pass=document.getElementById('uPass').value.trim();
  const classification=document.getElementById('uClass').value;
  const department=document.getElementById('uDept').value.trim();
  const salary=parseFloat(document.getElementById('uSalary').value)||0;
  const hourlyRate=parseFloat(document.getElementById('uHourly').value)||0;
  const hireDate=document.getElementById('uHire').value;
  const hrsAbs=parseFloat(document.getElementById('uHrsAbs').value)||0;
  const err=document.getElementById('uErr');
  err.classList.remove('show');
  if (!first||!last) { err.textContent='Please enter first and last name.'; err.classList.add('show'); return; }
  if (!email||!email.includes('@')) { err.textContent='Please enter a valid email address.'; err.classList.add('show'); return; }
  if (!editingUserId&&!pass) { err.textContent='Please set an initial password.'; err.classList.add('show'); return; }
  if (!salary||salary<=0) { err.textContent='Please enter a valid monthly base salary.'; err.classList.add('show'); return; }
  if (classification==='Teaching' && (!hourlyRate||hourlyRate<=0)) { err.textContent='Teaching personnel require a valid hourly rate.'; err.classList.add('show'); return; }
  const dup = users.find(u=>u.email.toLowerCase()===email.toLowerCase()&&u.id!==editingUserId);
  if (dup) { err.textContent='This email is already in use.'; err.classList.add('show'); return; }
  if (editingUserId) {
    const u=users.find(x=>x.id===editingUserId);
    u.first=first; u.last=last; u.email=email; u.role=role; u.status=status; u.salary=salary;
    u.classification=classification; u.department=department; u.hourlyRate=hourlyRate; u.hireDate=hireDate;
    if (classification==='Teaching') u.hoursWorked=hrsAbs; else u.absenceDays=hrsAbs;
    ensureAuth(u, pass);
    showToast('✅',`${first} ${last} updated successfully.`);
  } else {
    const today=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    const nu={id:nextUserId++,first,last,email,role,status,date:today,salary,classification,department,hireDate};
    if (classification==='Teaching') nu.hourlyRate=hourlyRate, nu.hoursWorked=hrsAbs; else nu.absenceDays=hrsAbs;
    users.push(nu);
    ensureAuth(nu, pass);
    showToast('✅',`${first} ${last} added successfully.`);
  }
  closeModal('userModal');
  saveDemo();
  renderUserTable(); renderAdminRecentUsers();
}
function viewUser(id) {
  const u=users.find(x=>x.id===id); if(!u) return;
  document.getElementById('viewUserBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)">
      <div style="width:56px;height:56px;border-radius:50%;background:${roleColor[u.role]};color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700">${initials(u.first,u.last)}</div>
      <div><div style="font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--maroon-dark)">${displayName(u)}</div><div style="font-size:12px;color:var(--text-muted)">#USR-00${u.id} &nbsp;·&nbsp; Added ${u.date}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${infoBox('✉️ Email',u.email)}${infoBox('🏷️ Role',`<span class="badge ${roleBadge[u.role]}">${u.role}</span>`)}
      ${infoBox('⚡ Status',`<span class="badge ${u.status==='Active'?'b-green':'b-gray'}">${u.status==='Active'?'● Active':'● Inactive'}</span>`)}${infoBox('📅 Date Added',u.date)}
      ${infoBox('🎓 Classification',`<span class="badge ${EMP_CLASS[u.classification]?.badge||'b-gray'}">${u.classification||'Non-Teaching'}</span>`)}${infoBox('🏢 Department',u.department||'—')}
      ${infoBox('💰 Monthly Base',`<strong>₱${(u.salary||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>`)}${infoBox('🆔 Employee ID',`#USR-00${u.id}`)}
      ${infoBox(u.classification==='Teaching'?'⏱ Hourly Rate':'📅 Date Hired', u.classification==='Teaching' ? '₱'+(u.hourlyRate||0).toFixed(2) : (u.hireDate||'—'))}${infoBox(u.classification==='Teaching'?'🕒 Hours Worked':'🚫 Absence Days', u.classification==='Teaching' ? (u.hoursWorked||0)+' hrs' : (u.absenceDays||0)+' days')}
    </div>`;
  // edit removed
  document.getElementById('viewUserModal').classList.add('show');
}
function infoBox(label,value){return`<div style="background:var(--bg);border-radius:8px;padding:12px 14px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${label}</div><div style="font-size:13px;font-weight:600;color:var(--text)">${value}</div></div>`;}
function confirmDeactivate(id) {
  const u=users.find(x=>x.id===id); if(!u) return;
  document.getElementById('confirmIcon').textContent='⚠️';
  document.getElementById('confirmMsg').innerHTML=`Are you sure you want to deactivate <strong>${u.first} ${u.last}</strong>? Their access will be suspended.`;
  document.getElementById('confirmActionBtn').textContent='Deactivate';
  document.getElementById('confirmActionBtn').onclick=()=>{ u.status='Inactive'; ensureAuth(u); closeModal('confirmModal'); renderUserTable(); renderAdminRecentUsers(); showToast('⏸',`${u.first} ${u.last} deactivated.`); };
  document.getElementById('confirmModal').classList.add('show');
}
function reactivateUser(id) {
  const u=users.find(x=>x.id===id); if(!u) return;
  u.status='Active'; ensureAuth(u); renderUserTable(); renderAdminRecentUsers();
  showToast('✅',`${u.first} ${u.last} reactivated.`);
}

function confirmRemove(id) {
  const u=users.find(x=>x.id===id); if(!u) return;
  // Update title based on role
  const titles = {
    'Employee': 'Remove Employee',
    'Finance Officer': 'Remove Finance Officer',
    'System Admin': 'Remove System Admin'
  };
  document.getElementById('removeTitle').textContent = titles[u.role] || 'Remove User';
  document.getElementById('removeUserName').textContent = `${u.first} ${u.last} (#USR-00${u.id})`;
  document.getElementById('removeConfirmBtn').onclick = () => {
    users = users.filter(x=>x.id!==id);
    removeAuth(id);
    saveDemo();
    closeModal('removeModal');
    renderUserTable();
    renderAdminRecentUsers();
    updateAdminStats();
    showToast('🗑️',`${u.first} ${u.last} has been permanently removed.`);
  };
  document.getElementById('removeModal').classList.add('show');
}

// ── HRIS SYNC ─────────────────────────────────────────────────
function syncFromHris() {
  const btn = document.getElementById('hrisSyncBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Syncing...'; }
  fetch('/api/hris/sync')
    .then(r => r.json())
    .then(d => {
      let added = 0, updated = 0;
      (d.employees || []).forEach(h => {
        const email = h.email.toLowerCase();
        let u = users.find(x => x.email.toLowerCase() === email);
        if (u) {
          u.first = h.first; u.last = h.last; u.role = h.role; u.status = h.status;
          u.department = h.department; u.classification = h.classification;
          u.salary = h.salary; u.hourlyRate = h.hourlyRate; u.hireDate = h.hireDate;
          if (h.classification === 'Teaching') u.hoursWorked = h.hoursWorked; else u.absenceDays = h.absenceDays;
          ensureAuth(u, h.password);
          updated++;
        } else {
          const nu = {id:nextUserId++, first:h.first, last:h.last, email,
            role:h.role, status:h.status,
            date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
            salary:h.salary, classification:h.classification, department:h.department, hireDate:h.hireDate};
          if (h.classification === 'Teaching') { nu.hourlyRate = h.hourlyRate; nu.hoursWorked = h.hoursWorked; }
          else nu.absenceDays = h.absenceDays;
          users.push(nu);
          ensureAuth(nu, h.password);
          added++;
        }
      });
      // Deactivate (NOT delete) any Active user missing from the HRIS pull,
      // except the three seed accounts (one per role), so payroll history is preserved.
      const hrisEmails = new Set((d.employees || []).map(h => (h.email || '').toLowerCase()));
      const seedEmails = ['admin@rcc.edu.ph', 'finance@rcc.edu.ph', 'employee@rcc.edu.ph'];
      let deactivated = 0;
      users.forEach(u => {
        if (u.status === 'Active' && !hrisEmails.has(u.email.toLowerCase()) && !seedEmails.includes(u.email.toLowerCase())) {
          u.status = 'Inactive';
          ensureAuth(u);
          deactivated++;
        }
      });
      saveDemo();
      renderUserTable(); renderAdminRecentUsers(); updateAdminStats();
      showToast('✅', `HRIS sync complete — ${added} added, ${updated} updated, ${deactivated} deactivated (source: ${d.source})`);
    })
    .catch(() => showToast('⚠️', 'HRIS sync failed. Make sure the server is running.'))
    .finally(() => { if (btn) { btn.disabled = false; btn.textContent = '🔄 Sync from HRIS'; } });
}

// ── DEDUCTION MODAL ───────────────────────────────────────────
// ── DEDUCTION TABLE DATA (editable) ──────────────────────────
let sssTable = [
  {range:'Below ₱5,250',        emp:250.00,   er:500.00},
  {range:'₱5,250 – ₱5,749',    emp:275.00,   er:550.00},
  {range:'₱5,750 – ₱6,249',    emp:300.00,   er:600.00},
  {range:'₱6,250 – ₱6,749',    emp:325.00,   er:650.00},
  {range:'₱6,750 – ₱7,249',    emp:350.00,   er:700.00},
  {range:'₱7,250 – ₱7,749',    emp:375.00,   er:750.00},
  {range:'₱7,750 – ₱8,249',    emp:400.00,   er:800.00},
  {range:'₱8,250 – ₱8,749',    emp:425.00,   er:850.00},
  {range:'₱8,750 – ₱9,249',    emp:450.00,   er:900.00},
  {range:'₱9,250 – ₱9,749',    emp:475.00,   er:950.00},
  {range:'₱9,750 – ₱10,249',   emp:500.00,   er:1000.00},
  {range:'₱10,250 – ₱10,749',  emp:525.00,   er:1050.00},
  {range:'₱10,750 – ₱11,249',  emp:550.00,   er:1100.00},
  {range:'₱11,250 – ₱11,749',  emp:575.00,   er:1150.00},
  {range:'₱11,750 – ₱12,249',  emp:600.00,   er:1200.00},
  {range:'₱12,250 – ₱12,749',  emp:625.00,   er:1250.00},
  {range:'₱12,750 – ₱13,249',  emp:650.00,   er:1300.00},
  {range:'₱13,250 – ₱13,749',  emp:675.00,   er:1350.00},
  {range:'₱13,750 – ₱14,249',  emp:700.00,   er:1400.00},
  {range:'₱14,250 – ₱14,749',  emp:725.00,   er:1450.00},
  {range:'₱14,750 – ₱15,249',  emp:750.00,   er:1500.00},
  {range:'₱15,250 – ₱15,749',  emp:775.00,   er:1550.00},
  {range:'₱15,750 – ₱16,249',  emp:800.00,   er:1600.00},
  {range:'₱16,250 – ₱16,749',  emp:825.00,   er:1650.00},
  {range:'₱16,750 – ₱17,249',  emp:850.00,   er:1700.00},
  {range:'₱17,250 – ₱17,749',  emp:875.00,   er:1750.00},
  {range:'₱17,750 – ₱18,249',  emp:900.00,   er:1800.00},
  {range:'₱18,250 – ₱18,749',  emp:925.00,   er:1850.00},
  {range:'₱18,750 – ₱19,249',  emp:950.00,   er:1900.00},
  {range:'₱19,250 – ₱19,749',  emp:975.00,   er:1950.00},
  {range:'₱19,750 – ₱20,249',  emp:1000.00,  er:2000.00},
  {range:'₱20,250 – ₱20,749',  emp:1025.00,  er:2050.00},
  {range:'₱20,750 – ₱21,249',  emp:1050.00,  er:2100.00},
  {range:'₱21,250 – ₱21,749',  emp:1075.00,  er:2150.00},
  {range:'₱21,750 – ₱22,249',  emp:1100.00,  er:2200.00},
  {range:'₱22,250 – ₱22,749',  emp:1125.00,  er:2250.00},
  {range:'₱22,750 – ₱23,249',  emp:1150.00,  er:2300.00},
  {range:'₱23,250 – ₱23,749',  emp:1175.00,  er:2350.00},
  {range:'₱23,750 – ₱24,249',  emp:1200.00,  er:2400.00},
  {range:'₱24,250 – ₱24,749',  emp:1225.00,  er:2450.00},
  {range:'₱24,750 – ₱25,249',  emp:1250.00,  er:2500.00},
  {range:'₱25,250 – ₱25,749',  emp:1275.00,  er:2550.00},
  {range:'₱25,750 – ₱26,249',  emp:1300.00,  er:2600.00},
  {range:'₱26,250 – ₱26,749',  emp:1325.00,  er:2650.00},
  {range:'₱26,750 – ₱27,249',  emp:1350.00,  er:2700.00},
  {range:'₱27,250 – ₱27,749',  emp:1375.00,  er:2750.00},
  {range:'₱27,750 – ₱28,249',  emp:1400.00,  er:2800.00},
  {range:'₱28,250 – ₱28,749',  emp:1425.00,  er:2850.00},
  {range:'₱28,750 – ₱29,249',  emp:1450.00,  er:2900.00},
  {range:'₱29,250 – ₱29,749',  emp:1475.00,  er:2950.00},
  {range:'₱29,750 – ₱30,249',  emp:1500.00,  er:3000.00},
  {range:'₱30,250 – ₱30,749',  emp:1525.00,  er:3050.00},
  {range:'₱30,750 – ₱31,249',  emp:1550.00,  er:3100.00},
  {range:'₱31,250 – ₱31,749',  emp:1575.00,  er:3150.00},
  {range:'₱31,750 – ₱32,249',  emp:1600.00,  er:3200.00},
  {range:'₱32,250 – ₱32,749',  emp:1625.00,  er:3250.00},
  {range:'₱32,750 – ₱33,249',  emp:1650.00,  er:3300.00},
  {range:'₱33,250 – ₱33,749',  emp:1675.00,  er:3350.00},
  {range:'₱33,750 – ₱34,249',  emp:1700.00,  er:3400.00},
  {range:'₱34,250 – ₱34,749',  emp:1725.00,  er:3450.00},
  {range:'₱34,750 and above',   emp:1750.00,  er:3500.00},
];
let philData = { rate:5.00, min:500.00, max:5000.00 };
let pagData  = { rate1:1, rate2:2, empMax:100.00, erMax:100.00 };
let birData  = [
  {range:'Up to ₱250,000',             base:0,       rate:0},
  {range:'Over ₱250,000 – ₱400,000',   base:0,       rate:15},
  {range:'Over ₱400,000 – ₱800,000',   base:22500,   rate:20},
  {range:'Over ₱800,000 – ₱2,000,000', base:102500,  rate:25},
  {range:'Over ₱2,000,000 – ₱8,000,000', base:402500, rate:30},
  {range:'Over ₱8,000,000',            base:2202500,  rate:35},
];
// Converts legacy "₱250,001 – ₱400,000" / "Above ₱8,000,000" range phrasing
// into the BIR-correct "Over ₱250,000 – ₱400,000" / "Over ₱8,000,000" form so
// the "excess over" used in the tax formula matches the official brackets.
function normalizeBIRTable(t) {
  return (t || []).map(row => {
    let r = row.range || '';
    if (r.indexOf('Above') === 0) {
      r = 'Over' + r.slice(r.indexOf('₱'));
    } else if (r.indexOf('Up to') !== 0 && r.indexOf('Over') !== 0 && r.indexOf('–') > -1) {
      const parts = r.split('–');
      const low = parseFloat(String(parts[0]).replace(/[^\d.]/g, '')) || 0;
      r = 'Over ₱' + (low - 1).toLocaleString('en-PH') + ' –' + parts[1];
    }
    return Object.assign({}, row, { range: r });
  });
}
// Restore government tables edited by the Finance Officer so they persist
// across sessions and keep the system compliant with the latest regulations.
if (_savedDemo && Array.isArray(_savedDemo.sssTable) && _savedDemo.sssTable.length) sssTable = _savedDemo.sssTable;
if (_savedDemo && _savedDemo.philData) philData = Object.assign({}, philData, _savedDemo.philData);
if (_savedDemo && _savedDemo.pagData)  pagData  = Object.assign({}, pagData,  _savedDemo.pagData);
if (_savedDemo && Array.isArray(_savedDemo.birData) && _savedDemo.birData.length) birData = normalizeBIRTable(_savedDemo.birData);

function openDedModal(type) {
  const titles = {
    SSS:'Edit SSS Contribution Table',
    PhilHealth:'Edit PhilHealth Premium Rates',
    PagIBIG:'Edit Pag-IBIG Contribution Rates',
    BIR:'Edit BIR Withholding Tax Table'
  };
  document.getElementById('dedModalTitle').textContent = titles[type];
  document.getElementById('dedModal').dataset.type = type;

  let html = '';

  if (type === 'SSS') {
    html = `
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
        Update SSS contribution amounts for each salary bracket. Changes apply to all future payroll computations.
        <strong style="color:var(--maroon-dark)"> Republic Act No. 11199 — Rate: 15% of MSC.</strong>
      </p>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:var(--maroon-dark);color:#fff">
              <th style="padding:10px 12px;text-align:left">#</th>
              <th style="padding:10px 12px;text-align:left">Monthly Salary Credit Range</th>
              <th style="padding:10px 12px;text-align:left">Employee Share (₱)</th>
              <th style="padding:10px 12px;text-align:left">Employer Share (₱)</th>
              <th style="padding:10px 12px;text-align:left">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sssTable.map((row, i) => `
              <tr style="background:${i%2===0?'#F9F7F4':'#fff'}">
                <td style="padding:8px 12px;color:var(--text-muted)">${i+1}</td>
                <td style="padding:8px 12px;font-weight:600;color:var(--maroon-dark)">${row.range}</td>
                <td style="padding:4px 8px">
                  <input type="number" step="0.01" value="${row.emp.toFixed(2)}"
                    data-idx="${i}" data-field="emp"
                    style="width:100px;padding:6px 10px;border:1px solid #DDD;border-radius:6px;font-size:13px"
                    oninput="updateSSSRow(${i},'emp',this.value)"/>
                </td>
                <td style="padding:4px 8px">
                  <input type="number" step="0.01" value="${row.er.toFixed(2)}"
                    data-idx="${i}" data-field="er"
                    style="width:110px;padding:6px 10px;border:1px solid #DDD;border-radius:6px;font-size:13px"
                    oninput="updateSSSRow(${i},'er',this.value)"/>
                </td>
                <td style="padding:8px 12px;font-weight:600" id="sss-total-${i}">
                  ₱${(row.emp + row.er).toFixed(2)}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  else if (type === 'PhilHealth') {
    html = `
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
        Update PhilHealth premium rate and contribution limits. <strong style="color:var(--maroon-dark)">Republic Act No. 11223 — UHC Act.</strong>
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
        <div>
          <label class="fl">Total Premium Rate (%)</label>
          <input class="fi" id="ph-rate" type="number" step="0.5" min="1" max="10" value="${philData.rate.toFixed(2)}"
            oninput="philData.rate=parseFloat(this.value)||5"/>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Split equally — employee & employer each pay half</div>
        </div>
        <div style="background:var(--gold-pale);border:1px solid var(--gold);border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:11px;color:var(--text-muted)">Employee / Employer Share</div>
          <div style="font-size:22px;font-weight:700;color:var(--maroon-dark)" id="ph-split-display">${(philData.rate/2).toFixed(2)}% each</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <label class="fl">Minimum Monthly Contribution (₱)</label>
          <input class="fi" id="ph-min" type="number" step="50" value="${philData.min.toFixed(2)}"
            oninput="philData.min=parseFloat(this.value)||500"/>
        </div>
        <div>
          <label class="fl">Maximum Monthly Contribution (₱)</label>
          <input class="fi" id="ph-max" type="number" step="100" value="${philData.max.toFixed(2)}"
            oninput="philData.max=parseFloat(this.value)||5000"/>
        </div>
      </div>
      <div style="margin-top:16px;background:#EFF8FF;border:1px solid #B3D9FF;border-radius:10px;padding:12px 16px;font-size:12px;color:#1A4A7A">
        ℹ️ <strong>Formula reminder:</strong> Monthly Contribution = Basic Salary × Rate% ÷ 2 (employee share only)
      </div>`;
  }

  else if (type === 'PagIBIG') {
    html = `
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
        Update Pag-IBIG Fund contribution rates and maximum amounts. <strong style="color:var(--maroon-dark)">Republic Act No. 9679 — HDMF Law.</strong>
      </p>
      <div style="overflow-x:auto;margin-bottom:16px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:var(--maroon-dark);color:#fff">
              <th style="padding:10px 12px">Monthly Compensation</th>
              <th style="padding:10px 12px">Employee Rate (%)</th>
              <th style="padding:10px 12px">Employer Rate (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background:#F9F7F4">
              <td style="padding:8px 12px;font-weight:600">₱1,500 and below</td>
              <td style="padding:4px 8px;text-align:center">
                <input type="number" step="0.5" min="1" max="5" value="${pagData.rate1}"
                  style="width:80px;padding:6px 10px;border:1px solid #DDD;border-radius:6px;font-size:13px;text-align:center"
                  oninput="pagData.rate1=parseFloat(this.value)||1"/>
              </td>
              <td style="padding:4px 8px;text-align:center">
                <input type="number" step="0.5" min="1" max="5" value="${pagData.rate2}"
                  style="width:80px;padding:6px 10px;border:1px solid #DDD;border-radius:6px;font-size:13px;text-align:center"
                  oninput="pagData.rate2=parseFloat(this.value)||2"/>
              </td>
            </tr>
            <tr style="background:#fff">
              <td style="padding:8px 12px;font-weight:600">Above ₱1,500</td>
              <td style="padding:8px 12px;text-align:center;color:var(--text-muted)">2% (same)</td>
              <td style="padding:8px 12px;text-align:center;color:var(--text-muted)">2% (same)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <label class="fl">Max Employee Contribution (₱/month)</label>
          <input class="fi" id="pag-emp-max" type="number" step="10" value="${pagData.empMax.toFixed(2)}"
            oninput="pagData.empMax=parseFloat(this.value)||100"/>
        </div>
        <div>
          <label class="fl">Max Employer Contribution (₱/month)</label>
          <input class="fi" id="pag-er-max" type="number" step="10" value="${pagData.erMax.toFixed(2)}"
            oninput="pagData.erMax=parseFloat(this.value)||100"/>
        </div>
      </div>`;
  }

  else if (type === 'BIR') {
    html = `
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
        Update BIR TRAIN Law annual income tax brackets. <strong style="color:var(--maroon-dark)">Republic Act No. 10963.</strong>
        Only update when the BIR issues new official tax tables.
      </p>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:var(--maroon-dark);color:#fff">
              <th style="padding:10px 12px">#</th>
              <th style="padding:10px 12px">Annual Taxable Income</th>
              <th style="padding:10px 12px">Base Tax (₱)</th>
              <th style="padding:10px 12px">Rate on Excess (%)</th>
            </tr>
          </thead>
          <tbody>
            ${birData.map((row, i) => `
              <tr style="background:${i%2===0?'#F9F7F4':'#fff'}">
                <td style="padding:8px 12px;color:var(--text-muted)">${i+1}</td>
                <td style="padding:8px 12px;font-weight:600;color:var(--maroon-dark)">${row.range}</td>
                <td style="padding:4px 8px">
                  <input type="number" step="0.01" value="${row.base.toFixed(2)}"
                    style="width:120px;padding:6px 10px;border:1px solid #DDD;border-radius:6px;font-size:13px"
                    oninput="birData[${i}].base=parseFloat(this.value)||0"/>
                </td>
                <td style="padding:4px 8px">
                  <input type="number" step="1" min="0" max="100" value="${row.rate}"
                    style="width:80px;padding:6px 10px;border:1px solid #DDD;border-radius:6px;font-size:13px;text-align:center"
                    oninput="birData[${i}].rate=parseFloat(this.value)||0"/>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:12px;background:#FFF8E1;border:1px solid #FFD54F;border-radius:10px;padding:12px 16px;font-size:12px;color:#6D4C00">
        ⚠️ <strong>Important:</strong> BIR tax tables are mandated by law. Only update when the BIR officially issues a new TRAIN Law amendment or Revenue Regulation.
      </div>`;
  }

  document.getElementById('dedModalBody').innerHTML = html;
  document.getElementById('dedModal').classList.add('show');
}

function showDedPage(type) {
  document.getElementById('finDeduction').style.display = 'none';
  const pages = ['finDedSSS','finDedPhilHealth','finDedPagIBIG','finDedBIR'];
  pages.forEach(p => document.getElementById(p).style.display = 'none');
  const map = { SSS:'finDedSSS', PhilHealth:'finDedPhilHealth', PagIBIG:'finDedPagIBIG', BIR:'finDedBIR' };
  const page = document.getElementById(map[type]);
  if (page) {
    page.style.display = 'block';
    if (type === 'SSS') renderSSSTable();
    if (type === 'PhilHealth') renderPhilHealthDisplay();
    if (type === 'BIR') renderBIRTable();
  }
}

function showDedMain() {
  const pages = ['finDedSSS','finDedPhilHealth','finDedPagIBIG','finDedBIR'];
  pages.forEach(p => document.getElementById(p).style.display = 'none');
  document.getElementById('finDeduction').style.display = 'block';
}

function renderSSSTable() {
  const tbody = document.getElementById('sssTableBody');
  if (!tbody) return;
  tbody.innerHTML = sssTable.map((row, i) => `
    <tr>
      <td>${i+1}</td>
      <td><strong>${row.range}</strong></td>
      <td>₱${row.emp.toFixed(2)}</td>
      <td>₱${row.er.toFixed(2)}</td>
      <td><strong>₱${(row.emp + row.er).toFixed(2)}</strong></td>
    </tr>`).join('');
}

function renderPhilHealthDisplay() {
  const r = document.getElementById('philRateDisplay');
  const e = document.getElementById('philEmpDisplay');
  const mn = document.getElementById('philMinDisplay');
  const mx = document.getElementById('philMaxDisplay');
  if (r) r.textContent = philData.rate.toFixed(2) + '%';
  if (e) e.textContent = (philData.rate/2).toFixed(2) + '%';
  if (mn) mn.textContent = '₱' + philData.min.toLocaleString('en-PH', {minimumFractionDigits:2});
  if (mx) mx.textContent = '₱' + philData.max.toLocaleString('en-PH', {minimumFractionDigits:2});
}

function renderBIRTable() {
  const tbody = document.getElementById('birTableBody');
  if (!tbody) return;
  const num = s => parseFloat(String(s).match(/[\d,]+/)?.[0]?.replace(/,/g,'')) || 0;
  tbody.innerHTML = birData.map((row, i) => {
    const r = row.range;
    const excess = r.indexOf('Over') === 0
      ? '₱' + num(r).toLocaleString('en-PH')
      : '—';
    const baseCell = i === 0 && row.base === 0
      ? '<span class="badge b-green">₱0 — Exempt</span>'
      : '₱' + row.base.toLocaleString('en-PH', {minimumFractionDigits:2});
    return `<tr>
      <td>${i+1}</td>
      <td>${r}</td>
      <td>${baseCell}</td>
      <td>${row.rate}%</td>
      <td>${excess}</td>
    </tr>`;
  }).join('');
}

function updateSSSRow(i, field, val) {
  sssTable[i][field] = parseFloat(val) || 0;
  const total = sssTable[i].emp + sssTable[i].er;
  const el = document.getElementById('sss-total-'+i);
  if (el) el.textContent = '₱' + total.toFixed(2);
}

function saveDedModal() {
  const type = document.getElementById('dedModal').dataset.type;

  if (type === 'SSS') {
    // Update the SSS table display
    const tbody = document.querySelector('#finDeduction table tbody');
    if (tbody) {
      tbody.querySelectorAll('tr').forEach((tr, i) => {
        if (i < sssTable.length) {
          const tds = tr.querySelectorAll('td');
          if (tds[1]) tds[1].textContent = '₱' + sssTable[i].emp.toFixed(2);
          if (tds[2]) tds[2].textContent = '₱' + sssTable[i].er.toFixed(2);
          if (tds[3]) tds[3].textContent = '₱' + (sssTable[i].emp + sssTable[i].er).toFixed(2);
        }
      });
    }
  }
  if (type === 'PhilHealth') {
    const el = document.getElementById('philRate');
    if (el) el.textContent = philData.rate.toFixed(2) + '%';
  }

  closeModal('dedModal');
  saveDemo();
  // Refresh the detail page display
  if (type === 'SSS') renderSSSTable();
  if (type === 'PhilHealth') renderPhilHealthDisplay();
  if (type === 'BIR') renderBIRTable();
  showToast('✅', `${type} rates updated successfully! Changes will apply to the next payroll cycle.`);
}
