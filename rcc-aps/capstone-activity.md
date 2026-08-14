# RCC-APS Activity Diagram (Per Module & Feature)

> Simple version — for capstone documentation. Feed this to any AI to generate formal UML activity diagrams (swimlanes, decisions, forks).

---

## 1. How to Read This Document

Each activity is written as a **flow of steps** with:

- **○ Start** → **● End** (how the activity begins and ends)
- **◈ Decision** → branching (yes/no, valid/invalid)
- **∥ Fork / Join** → parallel activities
- **[note]** → guard conditions on a decision

**Swimlane actors:** Employee · Finance Officer · System Admin · System (RCC-APS) · HRIS API

---

## 2. LOGIN ACTIVITY

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
  ├─ Yes → show error "Please enter your email and password" → back to input
  └─ No → continue
  │
  ▼
◈ Account exists & Active?
  ├─ No →
  │    ├─ Account deactivated → show "This account is deactivated..." → ● End
  │    └─ Not found → show "Invalid email or password" → back to input
  └─ Yes → continue
  │
  ▼
Show spinner → validate credentials
  │
  ▼
◈ Password correct?
  ├─ No → show "Invalid email or password" → back to input
  └─ Yes → continue
  │
  ▼
Show Welcome screen (role icon + name, ~2s)
  │
  ▼
Redirect to role dashboard
  │
  ▼
● End → [User logged in]
```

---

## 3. LOGOUT ACTIVITY

```
○ Start
  │
  ▼
[Any dashboard screen] → Click "Log Out"
  │
  ▼
System clears session · resets login form · hides dashboard
  │
  ▼
Show toast "You have been logged out successfully"
  │
  ▼
Return to Login page
  │
  ▼
● End
```

---

## 4. EMPLOYEE MODULE

### 4.1 View Employee Dashboard
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
  ├─ Yes → go to My Payslip activity
  └─ No → stay on Dashboard
  │
  ▼
● End
```

### 4.2 View My Payslip
```
○ Start
  │
  ▼
[My Payslip screen]
  │
  ▼
Select year (2024 / 2025 / 2026)
  │
  ▼
System loads payslip list for that year
  │
  ▼
◈ Click 👁 View on a payslip row?
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

### 4.3 Edit My Profile (Employee)
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
  ├─ No → show validation error → back to edit
  └─ Yes → continue
  │
  ▼
Click "Save Changes"
  │
  ▼
System saves to storage + server
  │
  ▼
Show success toast
  │
  ▼
● End
```

### 4.4 Change My Password (Employee)
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
◈ New password ≥ 8 chars?
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

## 5. FINANCE OFFICER MODULE

### 5.1 View Finance Dashboard
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
  ├─ Yes → go to Payroll Calculation activity
  └─ No → stay
  │
  ▼
● End
```

### 5.2 View Analytics
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

### 5.3 Compute Employee Payroll ★CORE
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
◈ Is period December AND 13th-month bonus Active?
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
(optional) Enter Cash Advance
  │
  ▼
System AUTO-COMPUTES:
  ∥   Gross pay
      • SSS (63-bracket table)
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

### 5.4 View Payroll Summary (All Employees)
```
○ Start
  │
  ▼
[Payroll Calculation screen → Payroll Summary card]
  │
  ▼
System loads all computed payslips for the period
  │
  ▼
Display table: Type · Hrs/Abs · Gross · SSS · PhilHealth ·
              Pag-IBIG · BIR · 13th-tax · Cash Adv · Net Pay · Status
  │
  ▼
● End
```

### 5.5 Manage 13th Month Pay
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
  ├─ Before/after → banner "outside window" / "disabled"
  └─ Period passed → banner "outside window"
  │
  ▼
Display per-employee proration
  ◈ (Full year / Prorated n months / No service)
  │
  ▼
◈ Click "Mark Paid" on an employee?
  ├─ No → continue viewing
  └─ Yes → record payout date
  │
  ▼
● End
```

### 5.6 Manage Configurable Bonus Types
```
○ Start
  │
  ▼
[Bonus Management screen → Bonus Types section]
  │
  ▼
◈ Add / Edit / Toggle / Remove?
  ├─ Add → modal → enter name, kind (months/fixed/percent),
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

### 5.7 Generate Reports
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
        ├─ Select year + month (gated to months with data)
        ├─ Display rows: Gross, SSS, PhilHealth, Pag-IBIG, BIR,
        │               Total Remittance + grand totals
        └─ Export → download
  │
  ▼
● End
```

### 5.8 Edit Deduction Rates
```
○ Start
  │
  ▼
[Deduction Tables screen] → click agency card
  │
  ▼
◈ Agency?
  ├─ SSS → 63-bracket table → "✏️ Edit All Brackets"
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
  ├─ No → show error → stay in modal
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

### 5.9 Manage Other Deduction Categories
```
○ Start
  │
  ▼
[Deduction Tables screen → Other Deduction Categories]
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

## 6. SYSTEM ADMIN MODULE

### 6.1 View Admin Dashboard
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
  ├─ Yes → go to User Management activity
  └─ No → stay
  │
  ▼
● End
```

### 6.2 User Management — Add New User ★CORE
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
  ├─ No → show error → stay in modal
  └─ Yes → continue
  │
  ▼
◈ Email valid & unique?
  ├─ No → show error → stay in modal
  └─ Yes → continue
  │
  ▼
◈ Salary > 0 (and hourly rate valid for Teaching)?
  ├─ No → show error → stay in modal
  └─ Yes → continue
  │
  ▼
System creates user record
  │
  ▼
System creates login account (ensureAuth)
  │
  ▼
Save + close modal + refresh table
  │
  ▼
● End → [new user can log in]
```

### 6.3 User Management — Search / Filter / View
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

### 6.4 User Management — Deactivate / Reactivate
```
○ Start
  │
  ▼
[User Management screen → find user in table]
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

### 6.5 User Management — Remove User
```
○ Start
  │
  ▼
[User Management screen → find user in table]
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

### 6.6 Sync Employees from HRIS
```
○ Start
  │
  ▼
[User Management screen] → Click "Sync from HRIS"
  │
  ▼
System requests /api/hris/sync
  │
  ▼
◈ Real HRIS configured (HRIS_API_URL + key)?
  ├─ Yes → call real HRIS API → fetch employees
  └─ No → use MOCK HRIS data (4 sample employees)
  │
  ▼
◈ HRIS reachable?
  ├─ No → show error toast → ● End
  └─ Yes → continue
  │
  ▼
∥ For each HRIS employee:
      ◈ Already in system?
      ├─ Yes → update existing record
      └─ No → add new user + create login account
  ▼
Show toast summary: "X added, Y updated"
  │
  ▼
Refresh user table
  │
  ▼
● End
```

### 6.7 View Deduction Tables (Read-Only)
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

## 7. SYSTEM AUTOMATIC ACTIVITIES

### 7.1 Auto-Compute Government Deductions
```
○ Start (triggered: payroll inputs entered)
  │
  ▼
∥ In parallel:
  ├─ SSS: find MSC in 63-bracket table → compute contribution
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

### 7.2 Auto-Compute 13th Month & Bonuses
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

### 7.3 Auto-Save Data (Persistence)
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

### 7.4 Reset Demo Data
```
○ Start (Login page → "Reset Demo Data")
  │
  ▼
System restores original sample dataset
  │
  ▼
Reload state
  │
  ▼
● End
```


