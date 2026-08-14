# RCC-APS Process Flow Diagram (Fully Developed System)

> **Republic Central Colleges — Automated Payroll System**
> Kumpletong process/activity flow ng target system. I-feed ito sa AI para bumuo ng
> formal UML activity diagrams, swimlane diagrams, o process narratives.

**Notation:**
- `○ Start` → `● End` — simula at katapusan ng process
- `◈` — decision/branching (yes/no, valid/invalid)
- `∥` — parallel activities
- `[note]` — guard condition sa decision

**Actors (swimlanes):** Employee · Finance Officer · System Admin · System (RCC-APS) · HRIS API

---

## 1. LOGIN PROCESS

```
○ Start
  │
  ▼
[Login page opens]
  │
  ▼
Enter email & password
  │
  ▼
◈ Fields empty?
  ├─ Yes → error "Please enter your email and password" → back to input
  └─ No → continue
  │
  ▼
◈ Account exists & Active?
  ├─ No →
  │    ├─ Deactivated → error "This account is deactivated..." → ● End
  │    └─ Not found → error "Invalid email or password" → back to input
  └─ Yes → continue
  │
  ▼
Show spinner → validate credentials
  │
  ▼
◈ Password correct?
  ├─ No → error "Invalid email or password" → back to input
  └─ Yes → continue
  │
  ▼
Redirect to role dashboard (Employee / Finance / Admin)
  │
  ▼
● End → [User logged in]
```

---

## 2. LOGOUT PROCESS

```
○ Start
  │
  ▼
[Any dashboard screen] → Click "Log Out"
  │
  ▼
System clears session · resets inputs · hides dashboard
  │
  ▼
Show "You have been logged out successfully"
  │
  ▼
Return to Login page
  │
  ▼
● End
```

---

## 3. EMPLOYEE PROCESSES

### 3.1 View Dashboard
```
○ Start
  │
  ▼
[Login as Employee] → Land on Dashboard
  │
  ▼
Load greeting + hero stats (Basic Pay / Net Pay / Next Payout)
  │
  ▼
Load Recent Payslips table
  │
  ▼
◈ Click "View All"?
  ├─ Yes → go to My Payslip
  └─ No → stay on Dashboard
  │
  ▼
● End
```

### 3.2 View My Payslip
```
○ Start
  │
  ▼
[My Payslip screen]
  │
  ▼
Select year
  │
  ▼
System loads payslip list para sa taon
  │
  ▼
◈ Click 👁 View sa isang payslip?
  ├─ No → stay on list
  └─ Yes → continue
  │
  ▼
System renders official payslip
  │
  ▼
◈ Click "Download PDF"?
  ├─ Yes → print/save dialog → payslip saved
  └─ No → skip
  │
  ▼
Click "← Back to My Payslips"
  │
  ▼
● End
```

### 3.3 Edit My Profile
```
○ Start
  │
  ▼
[My Profile screen]
  │
  ▼
Edit Phone & Address
  │
  ▼
◈ Valid input? (format checks)
  ├─ No → validation error → back to edit
  └─ Yes → continue
  │
  ▼
Click "Save Changes"
  │
  ▼
System saves to storage + server
  │
  ▼
Success toast
  │
  ▼
● End
```

### 3.4 Change My Password
```
○ Start
  │
  ▼
[Change Password screen]
  │
  ▼
Enter Current / New / Confirm password
  │
  ▼
◈ All fields filled?
  ├─ No → error → back to input
  └─ Yes → continue
  │
  ▼
◈ New password meets length requirement?
  ├─ No → error → back to input
  └─ Yes → continue
  │
  ▼
◈ Confirm matches New?
  ├─ No → error → back to input
  └─ Yes → continue
  │
  ▼
◈ Current password correct?
  ├─ No → error → back to input
  └─ Yes → continue
  │
  ▼
Update password → save → success toast
  │
  ▼
● End
```

---

## 4. FINANCE OFFICER PROCESSES

### 4.1 View Finance Dashboard
```
○ Start
  │
  ▼
[Login as Finance] → Land on Dashboard
  │
  ▼
Load employee counts (total / teaching / non-teaching)
  │
  ▼
Load totals: gross · deductions · net · pending
  │
  ▼
Load Recent Payroll Activity
  │
  ▼
◈ Click "Process Payroll"?
  ├─ Yes → go to Payroll Calculation
  └─ No → stay
  │
  ▼
● End
```

### 4.2 View Analytics
```
○ Start
  │
  ▼
[Analytics screen]
  │
  ▼
∥ Compute & display in parallel:
  │   • YTD gross
  │   • Government deductions (SSS+PhilHealth+Pag-IBIG+BIR)
  │   • Teaching vs non-teaching cost (%)
  │   • Monthly trend chart
  │   • Donut breakdown
  │   • 13th-month impact chart
  │   • Government deduction table
  ▼
● End
```

### 4.3 Compute Employee Payroll ★CORE
```
○ Start
  │
  ▼
[Payroll Calculation screen]
  │
  ▼
Select pay period (month/year)
  │
  ▼
◈ Period is December AND 13th-month bonus Active?
  ├─ Yes → "Include 13th Month" checkbox enabled
  └─ No → checkbox disabled (with note)
  │
  ▼
Filter classification: All / Teaching / Non-Teaching
  │
  ▼
Search & select employee (name / email / department)
  │
  ▼
◈ Employee selected?
  ├─ No → search again
  └─ Yes → continue
  │
  ▼
Enter inputs (labels change by classification)
  │
  ▼
◈ Classification?
  ├─ Teaching → enter Hourly Rate + Hours Worked
  └─ Non-Teaching → enter Monthly Base + Absences (÷22)
  │
  ▼
(optional) Enter Cash Advance · select custom bonuses
  │
  ▼
System AUTO-COMPUTES:
  ∥   Gross pay
      • SSS (bracket table)
      • PhilHealth (5%, min 500 / max 5,000)
      • Pag-IBIG (max 100)
      • BIR (TRAIN law, annualized)
      • 13th-month tax (if December)
      • Total deductions
      • NET PAY
  ▼
Display results panel
  │
  ▼
◈ Review results → Click "Confirm Payroll"?
  ├─ No → adjust inputs (recompute)
  └─ Yes → continue
  │
  ▼
System saves payslip (status: Pending)
  │
  ▼
Update Payroll Summary card
  │
  ▼
● End
```

### 4.4 View Payroll Summary
```
○ Start
  │
  ▼
[Payroll Calculation screen → Payroll Summary card]
  │
  ▼
System loads all computed payslips para sa period
  │
  ▼
Display table: Type · Hrs/Abs · Gross · SSS · PhilHealth ·
            Pag-IBIG · BIR · 13th-tax · Cash Adv · Net Pay · Status
  │
  ▼
● End
```

### 4.5 Manage Employee Records (CRUD)
```
○ Start
  │
  ▼
[Employee Records screen]
  │
  ▼
◈ Action?
  ├─ ADD → open Add Employee form
  │        enter: name, email, role, status, classification,
  │        department, basic salary / hourly rate, hire date
  │        → ◈ Valid? (required, email format, unique, salary>0)
  │          ├─ No → error → stay in form
  │          └─ Yes → save record → refresh table
  ├─ EDIT → modal pre-filled → modify → validate → save
  ├─ VIEW → open read-only profile
  ├─ DEACTIVATE / REACTIVATE → confirm → toggle status
  └─ IMPORT HRIS → pull employee records (see 6.6)
  │
  ▼
Refresh employee table
  │
  ▼
● End
```

### 4.6 Enter Attendance / Hours Worked
```
○ Start
  │
  ▼
[Attendance / Hours screen]
  │
  ▼
Select pay period (month/year)
  │
  ▼
◈ Classification?
  ├─ Teaching → enter Hours Worked per employee
  └─ Non-Teaching → enter Absences per employee
  │
  ▼
◈ Values valid? (hours range · absences ≤ working days)
  ├─ No → validation error → back to input
  └─ Yes → continue
  │
  ▼
Save (single o batch) → system persists
  │
  ▼
Feed sa payroll calculation ng period
  │
  ▼
Success toast
  │
  ▼
● End
```

### 4.7 Manage 13th Month Pay
```
○ Start
  │
  ▼
[Bonus Management screen]
  │
  ▼
Select year
  │
  ▼
System loads 13th-month table + payout banner
  │
  ▼
◈ Within Dec 1–24 payout window?
  ├─ Open → banner "within window"
  ├─ Before/after → banner "outside window"
  └─ Period passed → banner "outside window" (disabled)
  │
  ▼
Display per-employee proration
  ◈ (Full year / Prorated n months / No service)
  │
  ▼
◈ Click "Mark Paid" sa isang employee?
  ├─ No → continue viewing
  └─ Yes → record payout date
  │
  ▼
● End
```

### 4.8 Manage Configurable Bonus Types
```
○ Start
  │
  ▼
[Bonus Management → Bonus Types section]
  │
  ▼
◈ Add / Edit / Toggle / Remove?
  ├─ Add → modal → name, kind (months/fixed/percent),
  │        value, description, de minimis → validate → save
  ├─ Edit → modal pre-filled → modify → validate → save
  ├─ Toggle → enable/disable → re-evaluate calculator state
  └─ Remove → confirm → delete bonus type
  │
  ▼
Refresh bonus type cards + stat cards
  │
  ▼
● End
```

### 4.9 Generate Reports
```
○ Start
  │
  ▼
[Reports screen] → pick report type
  │
  ▼
◈ Type?
  ├─ PAYROLL SUMMARY REPORT
  │     ├─ Select year → month dropdown (only months with data)
  │     ├─ ◈ Month or Full Year?
  │     │    ├─ Month → monthly report (Employee, Gross, SSS,
  │     │    │         PhilHealth, Pag-IBIG, BIR, Net Pay, Status)
  │     │    └─ Full Year → 12-month net columns + total
  │     └─ Export → download
  │
  └─ GOVERNMENT CONTRIBUTION REPORT
        ├─ Select year + month (gated sa months with data)
        ├─ Display rows: Gross, SSS, PhilHealth, Pag-IBIG, BIR,
        │               Total Remittance + grand totals
        └─ Export → download
  │
  ▼
● End
```

### 4.10 Edit Deduction Rates
```
○ Start
  │
  ▼
[Deduction Tables screen] → click agency card
  │
  ▼
◈ Agency?
  ├─ SSS → bracket table → "✏️ Edit All Brackets"
  ├─ PhilHealth → rate/min/max → "✏️ Edit Rates"
  ├─ Pag-IBIG → rates → "✏️ Edit Rates"
  └─ BIR → TRAIN brackets → "✏️ Edit Brackets"
  │
  ▼
Open edit modal
  │
  ▼
Modify brackets/rates (live totals update)
  │
  ▼
◈ Valid values?
  ├─ No → error → stay in modal
  └─ Yes → continue
  │
  ▼
Save → system persists
  │
  ▼
Refresh detail page · toast "applies next payroll cycle"
  │
  ▼
● End
```

### 4.11 Manage Other Deduction Categories
```
○ Start
  │
  ▼
[Deduction Tables → Other Deduction Categories]
  │
  ▼
◈ Add / Edit / Remove?
  ├─ Add → modal → name, type (fixed ₱ / % of gross),
  │        amount, description, status → validate → save
  ├─ Edit → modal pre-filled → modify → save
  └─ Remove → confirm → delete
  │
  ▼
Refresh category list
  │
  ▼
● End
```

---

## 5. SYSTEM ADMIN PROCESSES

### 5.1 View Admin Dashboard
```
○ Start
  │
  ▼
[Login as Admin] → Land on Dashboard
  │
  ▼
Load totals: users · active · inactive
  │
  ▼
Load role breakdown + Recent User Activity
  │
  ▼
◈ Click "Manage All"?
  ├─ Yes → go to User Management
  └─ No → stay
  │
  ▼
● End
```

### 5.2 Add New User ★CORE
```
○ Start
  │
  ▼
[User Management screen]
  │
  ▼
Click "+ Add User"
  │
  ▼
Open Add User modal
  │
  ▼
Enter: first/last name, email, role, status, password,
       classification, department, salary/hourly rate, date hired
  │
  ▼
◈ Classification = Teaching?
  ├─ Yes → show Hourly Rate field
  └─ No → show Monthly Salary field
  │
  ▼
Click Save
  │
  ▼
◈ Required fields filled?
  ├─ No → error → stay in modal
  └─ Yes → continue
  │
  ▼
◈ Email valid & unique?
  ├─ No → error → stay in modal
  └─ Yes → continue
  │
  ▼
◈ Salary > 0 (and hourly rate valid for Teaching)?
  ├─ No → error → stay in modal
  └─ Yes → continue
  │
  ▼
System creates user record
  │
  ▼
System creates login account
  │
  ▼
Save + close modal + refresh table
  │
  ▼
● End → [new user can log in]
```

### 5.3 Search / Filter / View Users
```
○ Start
  │
  ▼
[User Management screen]
  │
  ▼
Enter search text OR filter by role OR filter by status
  │
  ▼
System filters the user table live
  │
  ▼
◈ Click 👁 View?
  ├─ No → keep browsing
  └─ Yes → open View User modal (read-only profile)
  │
  ▼
Close modal
  │
  ▼
● End
```

### 5.4 Edit User
```
○ Start
  │
  ▼
[User Management → find user]
  │
  ▼
Click ✏️ Edit
  │
  ▼
Open modal pre-filled with user data
  │
  ▼
Modify fields
  │
  ▼
◈ Valid? (required · email unique · salary > 0)
  ├─ No → error → stay in modal
  └─ Yes → continue
  │
  ▼
Save → refresh table
  │
  ▼
● End
```

### 5.5 Deactivate / Reactivate User
```
○ Start
  │
  ▼
[User Management → find user in table]
  │
  ▼
◈ Action?
  ├─ DEACTIVATE (Active user)
  │     ├─ Click ⏸ Deactivate
  │     ├─ Confirm modal → Click Confirm
  │     └─ System sets status = Inactive
  │           └─ user can no longer log in
  └─ REACTIVATE (Inactive user)
        ├─ Click ▶ Reactivate
        └─ System sets status = Active
              └─ user can log in again
  │
  ▼
Refresh table + status badges
  │
  ▼
● End
```

### 5.6 Remove User
```
○ Start
  │
  ▼
[User Management → find user in table]
  │
  ▼
Click 🗑️ Remove
  │
  ▼
Open confirm modal (permanent delete warning)
  │
  ▼
◈ Confirm?
  ├─ No → cancel → close modal → ● End
  └─ Yes → continue
  │
  ▼
System permanently deletes user + login account
  │
  ▼
Refresh table
  │
  ▼
● End
```

### 5.7 Sync Employees from HRIS
```
○ Start
  │
  ▼
[User Management → Click "Sync from HRIS"]
  │
  ▼
System requests /api/hris/sync
  │
  ▼
◈ Real HRIS configured (HRIS_API_URL + key)?
  ├─ Yes → call real HRIS API → fetch employees
  └─ No → use fallback HRIS service
  │
  ▼
◈ HRIS reachable?
  ├─ No → error toast → ● End
  └─ Yes → continue
  │
  ▼
∥ For each HRIS employee:
      ◈ Already in system?
      ├─ Yes → update existing record
      └─ No → add new user + create login account
  ▼
Show summary toast: "X added, Y updated"
  │
  ▼
Refresh user table
  │
  ▼
● End
```

### 5.8 View Deduction Tables (Read-Only)
```
○ Start
  │
  ▼
[Deduction Tables screen]
  │
  ▼
Display note: "rates editable only by Finance"
  │
  ▼
Display read-only SSS / PhilHealth / Pag-IBIG / BIR tables
  │
  ▼
● End
```

---

## 6. SYSTEM AUTOMATIC PROCESSES

### 6.1 Auto-Compute Government Deductions
```
○ Start (triggered: payroll inputs entered)
  │
  ▼
∥ In parallel:
  ├─ SSS: find MSC in bracket table → compute contribution
  ├─ PhilHealth: 5% premium → split employee/employer →
  │             clamp min ₱500 / max ₱5,000
  ├─ Pag-IBIG: compute capped contribution (max ₱100)
  └─ BIR: annualize salary → apply TRAIN brackets →
          derive tax for the period
  │
  ▼
Sum = Total Deductions
  │
  ▼
Display in results panel
  │
  ▼
● End
```

### 6.2 Auto-Compute 13th Month & Bonuses
```
○ Start (triggered: December period / active bonus types)
  │
  ▼
◈ Employee eligible for 13th month? (service months)
  ├─ No service → mark "No service" → skip
  └─ Yes → prorate: months/12 × average monthly pay
  │
  ▼
Apply active configurable bonus types (months/fixed/percent)
  │
  ▼
Split de minimis vs taxable portion (RR 11-2018)
  │
  ▼
Apply ₱90,000 tax-exempt pool → tax only the excess
  │
  ▼
Add to gross pay
  │
  ▼
● End
```

### 6.3 Auto-Save Data (Persistence)
```
○ Start (triggered: any save action)
  │
  ▼
Save state to browser localStorage
  │
  ▼
POST to server /api/data
  │
  ▼
◈ Server saves?
  ├─ No → data stays local only
  └─ Yes → confirmed
  │
  ▼
● End
```
