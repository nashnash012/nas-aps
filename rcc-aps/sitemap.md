# RCC-APS Sitemap (Fully Developed System)

> **Republic Central Colleges — Automated Payroll System**
> Kumpletong sitemap ng target system (web application). I-feed ito sa AI para bumuo ng
> formal sitemap diagram, screen-flow, wireframe hierarchy, o test case breakdown.

---

## 1. System Overview

```
                      ┌─────────────────┐
                      │   LOGIN SCREEN  │
                      └────────┬────────┘
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
      ┌──────────────┐ ┌───────────────┐ ┌──────────────┐
      │   EMPLOYEE   │ │    FINANCE    │ │ SYSTEM ADMIN │
      │    PORTAL    │ │    OFFICER    │ │    PORTAL    │
      │    (5)       │ │    (17)       │ │    (8)       │
      └──────────────┘ └───────────────┘ └──────────────┘
              └────────────────┼────────────────┘
                               ▼
                     LOGOUT → back to LOGIN
```

- **Web-based**, 1 login screen, 3 role-based portals.
- Role-based access control (RBAC): bawat role ay may sariling menu at permissions.
- Lahat ng screen ay may logout.

---

## 2. Login & Session (1 screen)

**Login Page**
- Email + Password
- "Show/Hide Password"
- Loading spinner habang nagbe-validate
- Error states: empty fields / invalid credentials / deactivated account
- Session timeout at secure logout
- Role-based redirect → Employee / Finance / Admin dashboard

---

## 3. Employee Portal (5 screens)

Sidebar: **Dashboard · My Payslip · My Profile · Change Password · Log Out**

### 3.1 Dashboard
- Greeting banner (name + date)
- Hero stats: Basic Pay · Net Pay · Next Payout
- Earnings & deductions summary cards
- Recent Payslips table (view all → My Payslip)

### 3.2 My Payslip
- Year selector
- Payslip list (status badge bawat pay period)
- **Payslip Detail** (sub-screen)
  - Official payslip: earnings, deductions (SSS, PhilHealth, Pag-IBIG, BIR, cash advance, 13th-month tax), NET PAY
  - Download / Print PDF
  - Back to list

### 3.3 My Profile
- View personal information (name, department, classification, hire date)
- Edit contact details (phone, address) → validation → save confirmation

### 3.4 Change Password
- Current / New / Confirm password
- Validation: required fields · min length · confirm match · current must be correct

---

## 4. Finance Officer Portal (17 screens)

Sidebar — Main Menu: **Dashboard · Analytics · Payroll Calculation · Employee Records · Attendance/Hours · Bonus Management · Reports · Deduction Tables**
Sidebar — My Employee Info: **My Payslip · My Profile · Change Password** · Log Out

### 4.1 Dashboard
- Total employees (teaching / non-teaching)
- Stat cards: total gross · total deductions · total net · pending payslips
- Recent Payroll Activity
- Shortcut: Process Payroll

### 4.2 Analytics
- YTD gross payroll
- Government deductions summary (SSS / PhilHealth / Pag-IBIG / BIR + % share)
- Teaching vs Non-Teaching cost breakdown (donut)
- Monthly payroll trend (bar chart)
- 13th-month pay cost impact (December)
- Government deduction table (Monthly / YTD)

### 4.3 Payroll Calculation (CORE)
- Step 1: Select pay period (month / year)
- Step 2: Include 13th Month (auto-enabled sa December kung active ang bonus type)
- Step 3: Filter classification (All / Teaching / Non-Teaching)
- Step 4: Search & select employee (name / email / department)
- Step 5: Enter inputs (labels nagbabago ayon sa classification):
  - Teaching → Hourly Rate + Hours Worked
  - Non-Teaching → Monthly Base + Absences (÷22)
  - Cash Advance (optional)
  - Custom bonuses (optional selection)
- Auto-compute (real-time):
  - Gross Pay
  - SSS · PhilHealth · Pag-IBIG · BIR (TRAIN, annualized)
  - 13th-month tax (December) · De minimis split
  - Total Deductions · NET PAY
- Review → **Confirm Payroll** → save payslip (status: Pending)
- **Payroll Summary** (sub-screen): lahat ng computed payslips per period
  (Type · Hours/Absences · Gross · SSS · PhilHealth · Pag-IBIG · BIR · 13th tax · Cash Advance · Net Pay · Status)

### 4.4 Employee Records (CRUD)
- Employee list (search, filter by department / classification / status)
- Add Employee → full form (name, email, role, status, department, classification, basic salary, hourly rate, hire date)
- Edit Employee
- View Employee profile
- Deactivate / Reactivate
- Import mula sa HRIS

### 4.5 Attendance / Hours Worked Input
- Select pay period
- Per employee:
  - Teaching → input hours worked
  - Non-Teaching → input absences (deductible days)
- Bulk entry / batch update
- Save + validate (hours range, absences ≤ working days)
- Feed sa payroll calculation

### 4.6 Bonus Management
- Stat cards: 13th-month pool · eligible employees · active bonus types
- Year selector
- Payout window indicator (Dec 1–24 statutory deadline)
- 13th Month Pay table (proration: full year / prorated months / no service)
- Mark Paid per employee
- Configurable Bonus Types (sub-screen/modals):
  - Add Bonus Type (name, kind: months / fixed / percent, value, description, de minimis flag)
  - Edit · Enable/Disable · Remove

### 4.7 Reports
- **Payroll Summary Report** (sub-screen)
  - Select year → month (o full year)
  - Monthly: Employee, Type, Gross, SSS, PhilHealth, Pag-IBIG, BIR, Net Pay, Status
  - Full Year: 12-month net columns + annual total
  - Export PDF
- **Government Contribution Report** (sub-screen)
  - Select year + month
  - Per-employee rows: Gross, SSS, PhilHealth, Pag-IBIG, BIR, Total Remittance + grand totals
  - Export PDF

### 4.8 Deduction Tables (editable)
- SSS table detail — 63 brackets, edit all
- PhilHealth detail — rate / min / max, edit
- Pag-IBIG detail — rates / caps, edit
- BIR detail — TRAIN brackets, edit
- **Other Deduction Categories**: add / edit / remove custom deductions (fixed ₱ o % of gross)
- Note: pagbabago ay mag-aaplay sa susunod na payroll cycle

### 4.9 My Payslip / My Profile / Change Password
- Same self-service screens (sariling data ng Finance Officer)

---

## 5. System Admin Portal (8 screens)

Sidebar — Main Menu: **Dashboard · User Management · Employee Records · Deduction Tables**
Sidebar — My Employee Info: **My Payslip · My Profile · Change Password** · Log Out

### 5.1 Dashboard
- Total users · active · inactive
- Role breakdown (Admin / Finance / Employee)
- Recent User Activity (User, Role, Last Login, Status)
- Shortcut: Manage Users

### 5.2 User Management (CORE)
- Toolbar: search · role filter · status filter · Sync from HRIS
- Add User modal: first/last name, email, role, status, password, classification (Teaching → hourly rate / Non-Teaching → monthly salary), department, hire date
  - Validation: required fields · email format · unique email · valid salary
  - Auto-create login account
- Edit User
- View User (read-only profile)
- Deactivate / Reactivate (blocks / restores login)
- Remove User (permanent delete, may confirmation)
- Sync from HRIS (pull employee records, auto-create users, add/update summary)

### 5.3 Employee Records (CRUD)
- Manage master employee data (add / edit / view / deactivate)
- Same as Finance 4.4, admin-level access

### 5.4 Deduction Tables (read-only)
- View-only SSS / PhilHealth / Pag-IBIG / BIR tables
- Note: ang Finance lamang ang makakapag-edit ng rates

### 5.5 My Payslip / My Profile / Change Password
- Same self-service screens (sariling data ng Admin)

---

## 6. Shared / Cross-Cutting

- **Toast notifications** — success / error / validation feedback
- **Modal system** — Add/Edit User, View User, Edit Deduction Tables, Bonus Type editor, confirm dialogs, payslip detail
- **Persistence** — browser localStorage + server database (JSON) via REST API; hindi nawawala kahit mag-refresh
- **Auth guard** — deactivated accounts hindi makakapag-login; role-based page access
- **Data seeding** — paunang sample data para sa unang paggamit ng bagong deployment

---

## 7. REST API (backend)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server status |
| GET | `/api/data` | Fetch full persisted state |
| POST | `/api/data` | Save state |
| GET | `/api/employees` | Employee records |
| GET | `/api/hris/status` | HRIS connection status |
| GET | `/api/hris/sync` | Pull employees mula sa HRIS |

---

## 8. System Automation

- Auto-compute SSS / PhilHealth / Pag-IBIG / BIR (TRAIN) sa bawat payroll run
- Auto-compute 13th Month Pay (RA 8515) + configurable bonuses (December)
- De minimis benefits split (BIR RR 11-2018) + ₱90,000 tax-exempt pool
- Auto-save ng records (localStorage + server)
- Automatic role-based redirect pagkatapos mag-login

---

## 9. Full Screen-Flow Map (single view)

```
                         LOGIN
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   EMPLOYEE            FINANCE             ADMIN
   ───────            ───────             ─────
   Dashboard          Dashboard           Dashboard
   My Payslip         Analytics           User Management
   └─ Payslip Detail  Payroll Calculation └─ Add/Edit/View User
   My Profile         └─ Payroll Summary      └─ Deactivate/Remove
   Change Password    Employee Records    Employee Records
                      Attendance/Hours    Deduction Tables (view)
                      Bonus Management    My Payslip
                      └─ Bonus Types      My Profile
                      Reports             Change Password
                      └─ Payroll Summary Report
                      └─ Gov Contribution Report
                      Deduction Tables
                      └─ SSS │ PhilHealth │ Pag-IBIG │ BIR
                      My Payslip
                      My Profile
                      Change Password
```
