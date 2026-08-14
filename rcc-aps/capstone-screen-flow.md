# RCC-APS Screen Flow Diagram (Per Module)

> Simple version — for capstone documentation. Feed this to any AI to generate diagrams, narratives, or Visio/Draw.io files.

---

## 1. System Overview

RCC-APS is a web-based Automated Payroll System with **1 login screen** and **3 separate portals** (one per role). After logging in, the user lands on their role's dashboard.

```
                ┌─────────────┐
                │ LOGIN SCREEN│
                └──────┬──────┘
        ┌──────────────┼───────────────┐
        ▼              ▼               ▼
  ┌──────────┐  ┌───────────┐  ┌────────────┐
  │ EMPLOYEE │  │  FINANCE  │  │ SYSTEM     │
  │ PORTAL   │  │  OFFICER  │  │ ADMIN      │
  │ 4 pages  │  │ 16 pages  │  │  7 pages   │
  └──────────┘  └───────────┘  └────────────┘
        └──────────────┼───────────────┘
                       ▼
                 LOGOUT → back to LOGIN SCREEN
```

**Demo accounts:**
| Role | Email | Password |
|---|---|---|
| System Admin | admin@rcc.edu.ph | admin123 |
| Finance Officer | finance@rcc.edu.ph | finance123 |
| Employee | employee@rcc.edu.ph | employee123 |

---

## 2. LOGIN MODULE (1 screen)

**Screen:** Login Page

```
Open App → Login Page
  ├─ Enter email + password
  ├─ Click "Sign In" (or press Enter)
  │    ├─ Empty fields  → error "Please enter your email and password"
  │    ├─ Wrong email/password → error "Invalid email or password"
  │    ├─ Inactive account → error "This account is deactivated..."
  │    └─ Correct → "Welcome screen" (role icon + name, ~2s)
  │               → redirect to the role's DASHBOARD automatically
  └─ "Reset Demo Data" button → restores sample data
```

**Feature checklist:** email & password validation · show/hide password · loading spinner · role-based redirect · demo data reset.

---

## 3. EMPLOYEE PORTAL (4 screens)

Navigation sidebar: **Dashboard · My Payslip · My Profile · Change Password · Log Out**

### 3.1 Dashboard
```
Login as Employee → EMPLOYEE DASHBOARD
  ├─ Greeting banner (name + date)
  ├─ 3 hero stats: Basic Pay · Net Pay · Next Payout
  ├─ 4 stat cards (earnings/deductions summary)
  └─ Recent Payslips table
       └─ Click a payslip → go to My Payslip
       └─ "View All" button → opens My Payslip screen
```

### 3.2 My Payslip
```
DASHBOARD → My Payslip
  ├─ Select year (2024 / 2025 / 2026)
  ├─ Table of payslips for that year (with status badge)
  └─ Click 👁 View on a row → PAYSLIP DETAIL
       ├─ Shows official payslip: earnings, deductions (SSS,
       │  PhilHealth, Pag-IBIG, BIR, Cash Advance, 13th-month tax),
       │  and NET PAY
       ├─ "Download PDF" button → prints/saves payslip
       └─ "← Back to My Payslips"
```

### 3.3 My Profile
```
DASHBOARD → My Profile
  ├─ Shows personal info
  ├─ Edit Phone & Address
  └─ Save Changes → success message
```

### 3.4 Change Password
```
DASHBOARD → Change Password
  ├─ Enter Current / New / Confirm password
  └─ Validations: all fields required · new ≥ 8 chars ·
     confirm must match · current must be correct
     → Update Password → success message
```

---

## 4. FINANCE OFFICER PORTAL (16 screens)

Sidebar — Main Menu: **Dashboard · Analytics · Payroll Calculation · Bonus Management · Reports · Deduction Tables**
Sidebar — My Employee Info: **My Payslip · My Profile · Change Password** · Log Out

### 4.1 Dashboard
```
Login as Finance → FINANCE DASHBOARD
  ├─ Hero: total employees (teaching / non-teaching)
  ├─ Stat cards: total gross · deductions · net · pending
  └─ Recent Payroll Activity table
       └─ "Process Payroll" button → jumps to Payroll Calculation
```

### 4.2 Analytics
```
DASHBOARD → Analytics
  ├─ Stat cards: YTD gross · government deductions ·
  │  teaching vs non-teaching cost
  ├─ Bar chart: monthly gross payroll trend
  ├─ Donut chart: teaching vs non-teaching breakdown
  ├─ 13th-month impact chart
  └─ Government deduction table (Monthly / YTD / Share)
```

### 4.3 Payroll Calculation (CORE module)
```
DASHBOARD → Payroll Calculation
  ├─ ① Select Pay Period (month/year)
  ├─ ② Check "Include 13th Month" (auto-enabled only in December
  │     when the 13th-month bonus type is Active)
  ├─ ③ Filter: All / Teaching / Non-Teaching
  ├─ ④ Search employee (name / email / department)
  │     └─ Click result → shows employee info card
  ├─ ⑤ Enter inputs (labels change by classification):
  │     Teaching     → Hourly Rate + Hours Worked
  │     Non-Teaching → Monthly Base + Absences (÷22)
  │     (optional) Cash Advance
  │     └─ System AUTO-COMPUTES instantly: Gross, SSS, PhilHealth,
  │        Pag-IBIG, BIR (TRAIN law), 13th-month tax, total
  │        deductions, NET PAY
  ├─ ⑥ Review results in the results panel
  ├─ ⑦ "Confirm Payroll" → saves the payslip (status: Pending)
  └─ PAYROLL SUMMARY card → table of ALL employees with their
       computed payslips (Released / Pending status)
```

**Auto-computation rules:** hourly rate × hours (teaching) · base − (absences ÷ 22 × base) (non-teaching) · SSS 2025 table · PhilHealth 5% (min ₱500 / max ₱5,000) · Pag-IBIG max ₱100 · BIR TRAIN annualized · 13th month prorated (RA 8515) · ₱90,000 tax-exempt pool.

### 4.4 Bonus Management
```
DASHBOARD → Bonus Management
  ├─ Stat cards: 13th-month pool · eligible employees · active bonus types
  ├─ Select year
  ├─ Payout banner (shows if within Dec 1–24 statutory window)
  ├─ 13TH MONTH PAY TABLE
  │    ├─ Lists all eligible employees with proration
  │    │  (Full year / Prorated n months / No service)
  │    └─ "Mark Paid" per employee → records payout date
  └─ CONFIGURABLE BONUS TYPES
       ├─ "+ Add Bonus Type" → modal (name, kind: months/fixed/percent,
       │  value, description, de minimis checkbox)
       ├─ Toggle enable/disable
       ├─ ✏️ Edit bonus type → modal
       └─ 🗑️ Remove bonus type → confirm
```

### 4.5 Reports
```
DASHBOARD → Reports → (landing page with 2 cards)
  ├─ 📋 PAYROLL SUMMARY REPORT
  │    ├─ Select year → month dropdown (only months with data)
  │    ├─ Pick a month → monthly report (Employee, Type, Gross,
  │    │  SSS, PhilHealth, Pag-IBIG, BIR, Net Pay, Status)
  │    ├─ Pick "Full Year" → 12-month net columns + total
  │    └─ Export button → download
  │
  └─ 🏛️ GOVERNMENT CONTRIBUTION REPORT
       ├─ Select year + month
       ├─ Per-employee rows: Gross, SSS, PhilHealth, Pag-IBIG,
       │  BIR, Total Remittance
       └─ Export button → download
```

### 4.6 Deduction Tables (editable)
```
DASHBOARD → Deduction Tables
  ├─ Status bar + 4 agency cards:
  │    ├─ SSS card → SSS table (63 brackets) → "✏️ Edit All Brackets" modal
  │    ├─ PhilHealth card → rates → "✏️ Edit Rates" modal
  │    ├─ Pag-IBIG card → rates → "✏️ Edit Rates" modal
  │    └─ BIR card → TRAIN brackets → "✏️ Edit Brackets" modal
  ├─ Each detail page has "← Back to Deduction Tables"
  └─ OTHER DEDUCTION CATEGORIES section (e.g. union dues, loans)
       ├─ "+ Add Category" → modal (name, fixed ₱ or % of gross,
       │  description, status)
       ├─ ✏️ Edit category → modal
       └─ 🗑️ Remove category → confirm
```

### 4.7 My Payslip / My Profile / Change Password (Finance)
Same 3 screens as the Employee portal (self-service), with the Finance Officer's own salary data.

---

## 5. SYSTEM ADMIN PORTAL (7 screens)

Sidebar — Main Menu: **Dashboard · User Management · Deduction Tables**
Sidebar — My Employee Info: **My Payslip · My Profile · Change Password** · Log Out

### 5.1 Dashboard
```
Login as Admin → ADMIN DASHBOARD
  ├─ Hero: total users · active · inactive
  ├─ Stat cards + role breakdown
  └─ Recent User Activity table (User, Role, Last Login, Status)
       └─ "Manage All" button → jumps to User Management
```

### 5.2 User Management (full CRUD) — CORE module
```
DASHBOARD → User Management
  ├─ Toolbar: search box · role filter · status filter · "Sync from HRIS"
  ├─ "+ Add User" button → ADD/EDIT USER MODAL
  │     Fields: First Name, Last Name, Email, Role, Status,
  │     Password (new users only), Classification (Teaching/Non-
  │     Teaching), Department, Salary / Hourly Rate, Date Hired
  │     → Save → validates (required fields, email format, unique
  │       email, valid salary) → creates user + login account
  ├─ USER TABLE — each row has actions:
  │     👁 View      → View User modal (read-only profile)
  │     ⏸ Deactivate → confirm modal → user cannot log in
  │     ▶ Reactivate → user can log in again
  │     🗑️ Remove    → confirm modal → permanently deletes user
  └─ "Sync from HRIS" → pulls employees from the HRIS system
       (mock HRIS used while the real HRIS API is under development)
```

### 5.3 Deduction Tables (read-only)
```
DASHBOARD → Deduction Tables
  └─ Note: rates can only be edited by Finance.
     Shows read-only SSS, PhilHealth, Pag-IBIG, BIR tables.
```

### 5.4 My Payslip / My Profile / Change Password (Admin)
Same 3 self-service screens as Employee/Finance, using the Admin's own salary data.

---

## 6. LOGOUT (all portals)
```
Any screen → Click "Log Out" → returns to LOGIN SCREEN
  ├─ Clears session and resets inputs
  └─ Shows "You have been logged out successfully"
```

---

## 7. Full Screen-Flow Map (single view)

```
                      LOGIN
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   EMPLOYEE           FINANCE          ADMIN
   ───────           ───────          ─────
   Dashboard         Dashboard        Dashboard
   My Payslip        Analytics        User Management
   └─Payslip Detail  Payroll Calc     Deduction Tables
   My Profile        └─Payroll Summary
   Change Password   Bonus Management
                     Reports
                     └─Payroll Summary Report
                     └─Gov Contribution Report
                     Deduction Tables
                     └─SSS │ PhilHealth │ Pag-IBIG │ BIR
                     My Payslip
                     My Profile
                     Change Password
```

---

## 8. System APIs (for backend diagram)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health | Server status check |
| GET | /api/data | Fetch saved data |
| POST | /api/data | Save data (localStorage sync) |
| GET | /api/employees | Employee list |
| GET | /api/hris/status | Check HRIS connection |
| GET | /api/hris/sync | Pull employees from HRIS (mock fallback) |

---

## 9. Quick Feature Summary Table

| Module | Key Features |
|---|---|
| Login | Email/password, validation, role redirect, demo reset |
| Dashboard (all roles) | Stats, shortcuts to main features |
| Payroll Calculation | Auto SSS/PhilHealth/Pag-IBIG/BIR/13th-month/net pay |
| Bonus Management | 13th-month pay, configurable bonus types, mark paid |
| Reports | Payroll summary + government contribution, export |
| Deduction Tables | Editable (Finance) / read-only (Admin), custom categories |
| User Management | Add/Edit/View/Deactivate/Reactivate/Remove, HRIS sync |
| Self-Service | My Payslip, My Profile, Change Password (all roles) |
| Compliance | RA 11199 (SSS), PhilHealth 5%, TRAIN Law RA 10963, RA 8515 (13th month), De Minimis, ₱90k exempt |
