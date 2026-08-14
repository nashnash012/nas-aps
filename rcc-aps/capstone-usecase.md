# RCC-APS Use Case Diagram (Per Module & Feature)

> Simple version — for capstone documentation.

**Actors:**
| Actor | Description |
|---|---|
| Employee | Regular staff member of RCC |
| Finance Officer | Handles payroll computation and deductions |
| System Administrator | Manages users and the system |
| HRIS System | External Human Resource Information System (API) |
| System (RCC-APS) | Automatic computations and rules |

**Format per use case:**
```
Actor · Precondition · Trigger · Main Flow · Alternate · Result
```

---

## 1. COMMON USE CASES (all actors)

### UC-01: Log In
```
  Actor:   Employee / Finance Officer / Admin
  Pre:     Account exists and is Active
  Trigger: Opens the system
  Main Flow:
    1. Enter email and password
    2. Click Sign In (or press Enter)
    3. System validates credentials
    4. System shows Welcome screen (role icon + name, ~2s)
    5. System redirects to the role's dashboard
  Alternate:
    • Empty fields → "Please enter your email and password"
    • Wrong email/password → "Invalid email or password"
    • Deactivated account → "This account is deactivated..."
  Result: User enters their portal
```

### UC-02: Log Out
```
  Actor:   All actors
  Pre:     Logged in
  Main Flow:
    1. Click "Log Out" in sidebar
    2. System clears session and resets login form
    3. Returns to Login Screen
  Result: Session ended, back to Login
```

### UC-03: View My Payslip
```
  Actor:   All actors
  Pre:     Logged in
  Main Flow:
    1. Open "My Payslip"
    2. Select year (2024/2025/2026)
    3. View list of payslips (with status badge)
    4. Click 👁 View on a row
    5. System renders the official payslip
    6. Optionally click "Download PDF" to print/save
  Result: Payslip displayed / downloaded
```

### UC-04: View My Profile
```
  Actor:   Employee (functional) / Finance & Admin (basic)
  Main Flow:
    1. Open "My Profile"
    2. View personal information
    3. (Employee) edit phone & address
    4. Click Save Changes → success toast
  Result: Profile displayed / updated
```

### UC-05: Change My Password
```
  Actor:   All actors
  Pre:     Logged in
  Main Flow:
    1. Open "Change Password"
    2. Enter current, new, and confirm password
    3. System validates: all required · new ≥ 8 chars ·
       confirm matches · current is correct
    4. Update Password → success message
  Alternate: any validation fails → error message
  Result: Password updated
```

---

## 2. EMPLOYEE USE CASES

### UC-06: View Employee Dashboard
```
  Actor:   Employee
  Main Flow:
    1. After login, land on Dashboard
    2. View greeting, hero stats (Basic/Net Pay, Next Payout)
    3. View Recent Payslips table
    4. Click "View All" → goes to My Payslip
  Result: Overview of employee's pay information
```

---

## 3. FINANCE OFFICER USE CASES

### UC-07: View Finance Dashboard
```
  Actor:   Finance Officer
  Main Flow:
    1. After login, land on Dashboard
    2. View employee counts (total/teaching/non-teaching)
    3. View totals: gross, deductions, net, pending
    4. View Recent Payroll Activity
    5. Click "Process Payroll" → jumps to Payroll Calculation
  Result: Overview of payroll status
```

### UC-08: View Analytics
```
  Actor:   Finance Officer
  Main Flow:
    1. Open "Analytics"
    2. View YTD gross, government deductions, teaching vs
       non-teaching cost
    3. View charts: monthly trend, breakdown donut, 13th-month impact
    4. View government deduction table
  Result: Financial insights displayed
```

### UC-09: Compute Employee Payroll ★CORE
```
  Actor:   Finance Officer
  Pre:     Active employees exist
  Trigger: Opens Payroll Calculation
  Main Flow:
    1. Select pay period (month/year)
    2. Optionally check "Include 13th Month" (auto-enabled in December
       when 13th-month bonus type is Active)
    3. Filter classification: All / Teaching / Non-Teaching
    4. Search & select employee
    5. Enter inputs (labels change by classification):
       Teaching → Hourly Rate + Hours Worked
       Non-Teaching → Monthly Base + Absences (÷22)
       Optional: Cash Advance
    6. System AUTO-COMPUTES: Gross, SSS, PhilHealth, Pag-IBIG,
       BIR, 13th-month tax, total deductions, NET PAY
    7. Review results
    8. Click "Confirm Payroll" → saves the payslip
  Result: Payslip generated (status: Pending)
```

### UC-10: View Payroll Summary (All Employees)
```
  Actor:   Finance Officer
  Pre:     Payroll computed (UC-09)
  Main Flow:
    1. Open Payroll Calculation → Payroll Summary card
    2. View all employees' computed payslips
    3. See status badges: Released / Pending
  Result: Full payroll picture for the period
```

### UC-11: Manage 13th Month Pay
```
  Actor:   Finance Officer
  Main Flow:
    1. Open "Bonus Management"
    2. Select year
    3. View payout banner (Dec 1–24 statutory window status)
    4. View 13th-month pay table (proration: Full year / Prorated n
       months / No service)
    5. Click "Mark Paid" on an employee → records payout date
  Result: 13th-month pay tracked
```

### UC-12: Manage Configurable Bonus Types
```
  Actor:   Finance Officer
  Main Flow:
    1. Open "Bonus Management"
    2. Click "+ Add Bonus Type" → modal
    3. Enter name, kind (months/fixed/percent), value, description,
       de minimis checkbox
    4. Save → new bonus type created
    5. Toggle enable/disable · ✏️ Edit · 🗑️ Remove (with confirm)
  Result: Bonus types configured; used in payroll computation
```

### UC-13: Generate Payroll Summary Report
```
  Actor:   Finance Officer
  Main Flow:
    1. Open "Reports"
    2. Click "Payroll Summary Report" card
    3. Select year → month (only months with data shown)
    4. Choose month → monthly report (Gross, SSS, PhilHealth,
       Pag-IBIG, BIR, Net Pay, Status)
       OR "Full Year" → 12-month net columns + total
    5. Click Export → download
  Result: Report generated and exported
```

### UC-14: Generate Government Contribution Report
```
  Actor:   Finance Officer
  Main Flow:
    1. Open "Reports"
    2. Click "Government Contribution Report" card
    3. Select year + month
    4. View per-employee rows (Gross, SSS, PhilHealth, Pag-IBIG,
       BIR, Total Remittance)
    5. Click Export → download
  Result: Government contribution report generated
```

### UC-15: Edit Deduction Rates (SSS / PhilHealth / Pag-IBIG / BIR)
```
  Actor:   Finance Officer
  Main Flow:
    1. Open "Deduction Tables"
    2. Click an agency card (SSS / PhilHealth / Pag-IBIG / BIR)
    3. View the rate/bracket table
    4. Click "✏️ Edit" → modal
    5. Modify brackets or rates (e.g. SSS 63 brackets, PhilHealth
       rate/min/max, BIR TRAIN brackets)
    6. Save → system persists changes
  Alternate: invalid value → error; table not saved
  Result: Updated rates apply on next payroll cycle
```

### UC-16: Manage Other Deduction Categories
```
  Actor:   Finance Officer
  Main Flow:
    1. Open "Deduction Tables"
    2. In "Other Deduction Categories": "+ Add Category" → modal
    3. Enter name, type (fixed ₱ / % of gross), amount, description,
       status
    4. Save · ✏️ Edit · 🗑️ Remove (with confirm)
  Result: Custom deductions available in payroll
```

---

## 4. SYSTEM ADMINISTRATOR USE CASES

### UC-17: View Admin Dashboard
```
  Actor:   System Admin
  Main Flow:
    1. After login, land on Dashboard
    2. View totals: users · active · inactive
    3. View role breakdown + Recent User Activity
    4. Click "Manage All" → goes to User Management
  Result: Overview of user accounts
```

### UC-18: Add New User ★CORE
```
  Actor:   System Admin
  Pre:     Logged in as Admin
  Main Flow:
    1. Open "User Management"
    2. Click "+ Add User" → modal
    3. Enter first/last name, email, role, status, password,
       classification (Teaching/Non-Teaching), department,
       salary or hourly rate, date hired
    4. Click Save
    5. System validates: required fields · email format ·
       unique email · salary > 0 · hourly rate for Teaching
    6. System creates the user AND a login account
  Result: New user can log in
```

### UC-19: Edit / View User
```
  Actor:   System Admin
  Main Flow:
    1. Open "User Management"
    2. Search or filter to find the user
    3. Click 👁 View → read-only profile modal
  Result: User details displayed
```

### UC-20: Deactivate User
```
  Actor:   System Admin
  Main Flow:
    1. Open "User Management"
    2. Click ⏸ Deactivate on an Active user
    3. Confirm in the modal
    4. System sets status to Inactive
  Result: User can no longer log in (account kept)
```

### UC-21: Reactivate User
```
  Actor:   System Admin
  Main Flow:
    1. Open "User Management"
    2. Click ▶ Reactivate on an Inactive user
  Result: User can log in again
```

### UC-22: Remove User
```
  Actor:   System Admin
  Main Flow:
    1. Open "User Management"
    2. Click 🗑️ Remove on a user
    3. Confirm permanent deletion in the modal
  Result: User and login account permanently deleted
```

### UC-23: Sync Employees from HRIS
```
  Actor:   System Admin (Primary) / HRIS System (External)
  Pre:     HRIS API reachable (or mock HRIS fallback)
  Main Flow:
    1. Open "User Management"
    2. Click "Sync from HRIS"
    3. System requests employee data from HRIS
       (real API if configured; otherwise mock data)
    4. System adds new employees / updates existing ones
    5. System creates login accounts for them
    6. Toast summary: X added, Y updated
  Alternate: HRIS unavailable → error message
  Result: HRIS employees now in RCC-APS
```

### UC-24: View Deduction Tables (Read-Only)
```
  Actor:   System Admin
  Main Flow:
    1. Open "Deduction Tables"
    2. View note: rates editable only by Finance
    3. View read-only SSS / PhilHealth / Pag-IBIG / BIR tables
  Result: Reference data displayed (no editing)
```

---

## 5. SYSTEM USE CASES (automatic, no human actor)

### UC-25: Auto-Compute Government Deductions
```
  Actor:   System (RCC-APS)
  Trigger: Payroll inputs entered (UC-09)
  Flow:
    1. SSS: look up monthly salary credit in editable 63-bracket table
    2. PhilHealth: 5% premium, split employee/employer,
       min ₱500 / max ₱5,000
    3. Pag-IBIG: capped contribution (max ₱100)
    4. BIR: annualize salary → apply TRAIN law brackets (RA 10963)
       → tax for the period
  Result: Deduction amounts appear in the payslip
```

### UC-26: Auto-Compute 13th Month & Bonuses
```
  Actor:   System (RCC-APS)
  Trigger: December period / active bonus types
  Flow:
    1. 13th month: prorate by months of service (RA 8515),
       eligibility check
    2. Apply active configurable bonus types (months/fixed/percent)
    3. Split de minimis vs taxable portion
    4. Apply ₱90,000 tax-exempt pool; tax the excess
  Result: Bonus amounts computed and added to gross
```

### UC-27: Auto-Save Data (Persistence)
```
  Actor:   System (RCC-APS)
  Trigger: Any save action (confirm payroll, save user, etc.)
  Flow:
    1. Save state to browser localStorage
    2. POST to server /api/data
  Result: Data persists across sessions
```

### UC-28: Reset Demo Data
```
  Actor:   Any user (on Login page)
  Flow:
    1. Click "Reset Demo Data"
    2. System restores the original sample dataset
  Result: Demo data restored
```
