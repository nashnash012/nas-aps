# RCC-APS System — Modules & Sub-Modules

**Project:** Republic Central Colleges — Automated Payroll System (RCC-APS)  
**Stack:** Node.js + Express (backend), Vanilla JS SPA (frontend), MySQL/MariaDB (database), JWT (auth)

---

## System Architecture Overview

| Layer | Technology | Key Files |
|---|---|---|
| Backend Server | Express 4 | `server/server.js`, `server/auth-router.js` |
| Database Layer | MySQL2 (promise pool) | `server/db.js`, `server/db/sql/schema.sql` |
| Auth Middleware | JWT + bcryptjs | `server/middleware/jwt.js`, `server/auth-router.js` |
| HRIS Integration | Fetch API + mock fallback | `server/hris-mock.js`, `server/server.js` |
| Frontend SPA | Vanilla JS (9 modules) | `public/js/*.js`, `public/index.html` |
| Styling | CSS | `public/css/style.css`, `public/css/responsive.css` |

---

## Module 1: Authentication & Authorization

**Purpose:** User login, session management, password handling, role-based access control.

| Sub-module | Description | Key Files |
|---|---|---|
| **1a. Login** | Email/password authentication against MySQL `auth` table; bcrypt comparison with legacy plain-text auto-upgrade; 5-attempt lockout (30s); JWT issuance (8h TTL) | `server/auth-router.js` (`POST /api/auth/login`), `public/js/auth.js` (`checkLogin()`, `handleLogin()`) |
| **1b. JWT Middleware** | Bearer token verification, role guard factory (`requireRole()`), optional auth for backward compatibility | `server/middleware/jwt.js` (`requireAuth`, `optionalAuth`, `requireRole`) |
| **1c. Change Password** | Current password verification, new password hashing, DB update | `server/auth-router.js` (`POST /api/auth/change-password`), `public/js/auth.js` (`changePassword()`) |
| **1d. Current User** | Returns user info from JWT payload (no DB hit) | `server/auth-router.js` (`GET /api/auth/me`) |
| **1e. Client-side Auth** | Token storage in localStorage, login UI, role-based page redirect, logout | `public/js/auth.js`, `public/js/core.js` (`USERS_AUTH`, `ensureAuth()`, `rebuildAuthDefaults()`) |

**Endpoints:**
- `POST /api/auth/login` — authenticate, return JWT
- `GET /api/auth/me` — current user from token
- `POST /api/auth/change-password` — update password

**Database Tables:** `auth`

---

## Module 2: User & Employee Management

**Purpose:** CRUD for user accounts and employee records, role assignment, HRIS synchronization.

| Sub-module | Description | Key Files |
|---|---|---|
| **2a. User CRUD** | Add/edit/deactivate/reactivate/remove users; role assignment (Admin/Finance/Employee); classification (Teaching/Non-Teaching); salary/hourly rate; hire date validation; duplicate email prevention; last-admin removal protection | `public/js/deductions.js` (`saveUser()`, `viewUser()`, `confirmDeactivate()`, `reactivateUser()`, `confirmRemove()`, `removalBlockReason()`) |
| **2b. User Table & Search** | Filterable user table with search, role filter, status filter; avatar initials; recent users list | `public/js/deductions.js` (`renderUserTable()`, `renderAdminRecentUsers()`, `updateAdminStats()`) |
| **2c. Employee Data Model** | 12 seed employees; fields: name, email, role, status, department, classification, salary, hourlyRate, hireDate, hoursWorked/absenceDays, endDate | `public/js/payroll.js` (lines 2-16, `users` array) |
| **2d. HRIS Sync** | Pull employees/attendance/leaves from HRIS API or mock; add/update/deactivate users; import leave records and attendance; seed account protection | `public/js/deductions.js` (`syncFromHris()`), `server/server.js` (`fetchHrisData()`, `mapHrisEmployee()`, `mapHrisAttendance()`) |
| **2e. Per-User Profiles** | Phone/address storage keyed by user ID; legacy migration from global profile blob | `public/js/core.js` (`PROFILES`, `restoreProfileFields()`, `saveProfile()`) |

**Endpoints:**
- `GET /api/employees` — list all users
- `GET /api/hris/sync` — trigger HRIS sync
- `GET /api/hris/status` — HRIS connection status

**Database Tables:** `users`, `auth`, `profiles`

---

## Module 3: Payroll Computation Engine

**Purpose:** Core payroll calculation including gross pay, deductions, bonuses, 13th month pay, and net pay.

| Sub-module | Description | Key Files |
|---|---|---|
| **3a. Gross Pay Calculation** | Teaching: hours x hourly rate minus unpaid day deductions (8h/day); Non-Teaching: monthly salary minus (absences/WORK_DAYS) x salary | `public/js/payroll.js` (`empGrossPay()`, `computePayroll()`) |
| **3b. Payroll Calculator UI** | Employee combobox search, pay period selector, hours/absence input, cash advance input, custom deduction overrides, live computation display, 13th month opt-in/out | `public/js/payroll.js` (`loadEmployeeData()`, `computePayroll()`, `renderCalcEmpList()`, `selectCalcEmp()`, `renderCalcCustomInputs()`) |
| **3c. Payroll Confirmation & Persistence** | Confirm computation, overwrite existing records, cash advance consumption, save to localStorage + MySQL | `public/js/payroll.js` (`confirmPayroll()`, `doSavePayroll()`) |
| **3d. Payroll Summary** | Per-period table of all active employees with gross, deductions, bonuses, 13th month, net pay, release status | `public/js/payroll.js` (`renderPayrollSummary()`) |
| **3e. Payroll Records** | Confirmed payroll storage; per-employee per-month records with full breakdown | `public/js/payroll.js` (`payrollRecords`, `getPayrollRecords()`, `payslipRecordsFor()`) |
| **3f. Attendance Integration** | Clock-in/out hours from HRIS; graveyard shift handling; attendance day set; detected absences (no clock-in, no leave) | `public/js/payroll.js` (`getAttendanceHours()`, `attendanceRecordHours()`, `getAttendanceDaySet()`, `getDetectedAbsences()`) |
| **3g. Leave Integration** | Leave breakdown by type (paid/unpaid); unpaid day calculation; leave-covered day set; total unpaid days = unpaid leave + absences | `public/js/payroll.js` (`getLeaveBreakdown()`, `getUnpaidDays()`, `getLeaveCoveredDaySet()`, `getTotalUnpaidDaysAll()`) |
| **3h. Working Days Config** | Configurable WORK_DAYS (default 22) as absence divisor for Non-Teaching staff | `public/js/payroll.js` (`WORK_DAYS`), `public/js/deductions.js` (`renderWorkDaysSetting()`, `saveWorkDays()`) |

**Key Functions:**
- `empGrossPay(emp, hours, absences)` — gross pay by classification
- `computePayroll()` — full payroll computation
- `computeDeductions(gross, cashAdv, extraAnnual, customOverrides)` — all deductions
- `activeBonusTypes(emp, baseGross, periodEnd)` — applicable bonuses
- `splitBonusTaxable(thirteenth, otherBonuses)` — RA 10963 exemption split
- `thirteenthTaxSplit(d, monthlyGross, taxable13)` — 13th month excess tax

**Database Tables:** `payroll_records`, `attendance`, `cash_advances`

---

## Module 4: Statutory Deductions (Government Contributions)

**Purpose:** Computation and configuration of SSS, PhilHealth, Pag-IBIG, and BIR withholding tax.

| Sub-module | Description | Key Files |
|---|---|---|
| **4a. SSS Contribution (2025)** | Editable bracket table (MSC range, employee share, employer share); RA 11199; bracket matching (min <= salary < max); bracket CRUD with add/remove/normalize | `public/js/deductions.js` (`sssTable`, `getSSS()`, `renderSSSTable()`, `openDedModal('SSS')`, `renderSssEditRows()`, `addSssBracket()`, `removeSssBracket()`, `normalizeBrackets()`), `public/js/payroll.js` (`computeDeductions()`) |
| **4b. PhilHealth (5%)** | Rate % of salary base; employee/employer 50/50 split; min/max contribution clamp; salary floor/ceiling; editable rate, min, max, floor, ceiling; computation examples | `public/js/deductions.js` (`philData`, `getPhil()`, `renderPhilHealthDisplay()`, `renderPhilExamples()`, `openDedModal('PhilHealth')`), `public/js/payroll.js` (`philMonthlyTotal()`) |
| **4c. Pag-IBIG (2025)** | 2% of compensation (1% for <=P1,500); max P100 employee share; editable rates and caps; RA 9679 | `public/js/deductions.js` (`pagData`, `getPag()`, `renderPagIBIGDisplay()`, `openDedModal('PagIBIG')`), `public/js/payroll.js` (`computeDeductions()`) |
| **4d. BIR Withholding Tax (TRAIN Law)** | Editable annual tax brackets (min, max, base, rate); RA 10963; annualized monthly withholding; taxable income = gross - SSS - PhilHealth - Pag-IBIG; bracket CRUD | `public/js/deductions.js` (`birData`, `annualBIR()`, `renderBIRTable()`, `openDedModal('BIR')`, `renderBirEditRows()`, `addBirBracket()`, `removeBirBracket()`), `public/js/payroll.js` (`taxableMonthlyOf()`, `getBIR()`) |
| **4e. Deduction Tables UI** | Finance: editable tables with modals; Admin: read-only mirror; "last updated" banner; working days setting | `public/js/deductions.js` (`showDedPage()`, `showDedMain()`, `renderAdmDedTables()`, `renderDedBanner()`, `saveDedModal()`) |
| **4f. Custom Deduction Categories** | Non-statutory deductions (fixed amount or % of gross); active/inactive status; per-run overrides in calculator | `public/js/deductions.js` (`deductionCategories`, `renderDeductionCategories()`, `saveDeductionCategory()`, `deleteDeductionCategory()`), `public/js/payroll.js` (`activeCustomDeductions()`, `collectCustomOverrides()`) |

**Database Tables:** `sss_table`, `phil_data`, `pag_data`, `bir_table`, `deduction_categories`

---

## Module 5: Bonus Management

**Purpose:** Configurable bonus types, 13th Month Pay computation (RA 8515), de minimis handling, tax exemption pool.

| Sub-module | Description | Key Files |
|---|---|---|
| **5a. Bonus Types CRUD** | Add/edit/remove/toggle bonus types; kinds: fixed, percent, months-of-pay; scheduling (release date, end date); de minimis flag; unique name enforcement; expiry auto-deactivation | `public/js/bonus.js` (`bonusTypes`, `renderBonusTypes()`, `openBonusTypeModal()`, `saveBonusType()`, `deleteBonusType()`, `toggleBonusType()`, `checkBonusDates()`) |
| **5b. 13th Month Pay (RA 8515)** | DOLE computation: total basic salary earned / 12; prorated by calendar days worked; eligibility check (full year vs prorated); December-only; opt-out checkbox; Dec 24 deadline banner | `public/js/bonus.js` (`doleBasicSalaryEarned()`, `thirteenthEligibility()`, `computeThirteenth()`, `renderBonusTable()`, `renderPayoutBanner()`, `isThirteenthActive()`) |
| **5c. Bonus Tax Exemption (RA 10963)** | Configurable annual exemption limit (default P90,000); de minimis excluded from pool; taxable bonus + 13th month excess = one-time taxable income; 13th month excess tax withheld from December pay | `public/js/bonus.js` (`renderBonusExemptionLimit()`, `saveBonusExemptionLimit()`), `public/js/payroll.js` (`splitBonusTaxable()`, `thirteenthTaxSplit()`, `bonusAnnualTax()`) |
| **5d. Bonus Payout Tracking** | Mark 13th month as paid per employee per year; payout date recording | `public/js/bonus.js` (`markBonusPaid()`, `bonusPayouts`) |
| **5e. Bonus Scheduling** | Give date / end date modal; scheduled vs active badges; expired bonus deactivation with restart prompt | `public/js/bonus.js` (`openBonusDateModal()`, `saveBonusDateModal()`, `skipBonusDateModal()`, `openEndDatePrompt()`, `saveEndDatePrompt()`) |
| **5f. De Minimis Benefits** | Tax-exempt bonuses (BIR RR 11-2018); excluded from P90k pool and contributions; flagged in bonus types | `public/js/bonus.js` (`splitBonuses()`), `public/js/payroll.js` (`splitBonuses()`) |

**Database Tables:** `bonus_types`, `bonus_payouts`

---

## Module 6: Leave Management

**Purpose:** Leave type configuration, leave record CRUD, attendance display, leave-absence deduction integration.

| Sub-module | Description | Key Files |
|---|---|---|
| **6a. Leave Types CRUD** | Add/edit/remove leave types; paid/unpaid flag; auto-creation from HRIS sync | `public/js/deductions.js` (`LEAVE_TYPES`, `renderLeaveTypes()`, `openAddLeaveType()`, `editLeaveType()`, `saveLeaveType()`, `deleteLeaveType()`) |
| **6b. Leave Records CRUD** | Add/edit/remove leave records; employee selector with combobox search; leave type selector; start/end dates; auto-computed days; manual day override; employee filter | `public/js/deductions.js` (`LEAVE_RECORDS`, `renderLeaveRecords()`, `openAddLeaveRecord()`, `editLeaveRecord()`, `saveLeaveRecord()`, `deleteLeaveRecord()`, `computeLeaveDays()`, `updateLeaveRecordDays()`) |
| **6c. Attendance Display** | Read-only HRIS attendance table; employee filter with combobox; clock-in/out in Manila time (UTC+8); hours display | `public/js/deductions.js` (`renderAttendance()`, `fmtClock()`, `attEmpOptions()`, `selectAttEmp()`) |
| **6d. Leave-Attendance Integration** | Leave breakdown in payroll calculator; paid/unpaid day counts; absence detection (no clock-in, no leave); deduction calculation per day value | `public/js/payroll.js` (`getLeaveBreakdown()`, `renderLeaveBreakdown()`, `getDetectedAbsences()`, `getTotalUnpaidDaysAll()`) |

**Endpoints:**
- `GET /api/leaves` — leave types and records
- `POST /api/leave-types` — save leave types
- `POST /api/leave-records` — save leave records

**Database Tables:** `leave_types`, `leave_records`, `attendance`

---

## Module 7: Reports & Analytics

**Purpose:** Government contribution reports, payroll summary reports, analytics dashboard.

| Sub-module | Description | Key Files |
|---|---|---|
| **7a. Government Contribution Report** | Per-month SSS/PhilHealth/Pag-IBIG/BIR totals per employee; grand total remittance | `public/js/reports.js` (`renderGovReport()`, `onGovYearChange()`, `onGovMonthChange()`) |
| **7b. Payroll Summary Report** | Monthly payroll report with gross, bonus, deductions, net per employee; full-year report with monthly columns and YTD total | `public/js/payroll.js` (`showMonthReport()`, `showYearReport()`) |
| **7c. Analytics Dashboard** | Monthly gross payroll trend bar chart; Teaching vs Non-Teaching donut chart; government deduction summary with monthly average and YTD; 13th month cost impact visualization | `public/js/reports.js` (`renderAnalytics()`) |
| **7d. Finance Dashboard Stats** | Total employees, teaching/non-teaching count, total gross/deductions/net; recent payroll activity | `public/js/employees.js` (`updateFinStats()`), `public/js/payroll.js` (`renderFinRecentActivity()`) |

---

## Module 8: Payslip Generation

**Purpose:** Individual payslip viewing, printing, and role-based access.

| Sub-module | Description | Key Files |
|---|---|---|
| **8a. Payslip List** | Year-filtered payslip table per role (Employee/Finance/Admin); period, gross, deductions, net, release status | `public/js/auth.js` (`renderPayslipList()`, `renderFinPayslipList()`, `renderAdmPayslipList()`, `buildPayslipRows()`) |
| **8b. Payslip Detail** | Full payslip with employee info, earnings breakdown (base, bonuses, de minimis, 13th month), deductions (SSS, PhilHealth, Pag-IBIG, BIR, cash advance, custom), 13th month excess tax, net pay | `public/js/auth.js` (`viewPayslipDetail()`) |
| **8c. Print/Download** | Browser print with auto-generated filename (Payslip_Name_Period.pdf) | `public/js/auth.js` (`printPayslip()`) |

---

## Module 9: UI Framework & Shared Utilities

**Purpose:** Modals, toasts, responsive sidebar, table formatting, data persistence.

| Sub-module | Description | Key Files |
|---|---|---|
| **9a. Modal System** | Overlay click-to-dismiss; non-dismissable modals for required actions | `public/js/ui.js` (`closeModal()`) |
| **9b. Toast Notifications** | Auto-dismissing toast with icon + message | `public/js/ui.js` (`showToast()`) |
| **9c. Responsive Sidebar** | Off-canvas drawer below 1024px; backdrop overlay | `public/js/ui.js` (`toggleSidebar()`, `closeSidebar()`) |
| **9d. Responsive Tables** | Mobile card layout via `td::before{content:attr(data-label)}`; MutationObserver for dynamic tables | `public/js/ui.js` (`stampTableLabels()`, `setupResponsiveTables()`) |
| **9e. Data Persistence** | localStorage demo state; server sync via `/api/data`; timestamp-based conflict resolution; `applyServerData()` for in-memory refresh | `public/js/core.js` (`saveDemo()`, `pushToServer()`, `syncDemo()`, `applyServerData()`) |
| **9f. Formatting & Helpers** | Peso formatter, HTML escaping, demo user detection, role/page/icon mappings | `public/js/core.js` (`fmt()`, `esc()`, `isDemoUser()`, `displayName()`), `public/js/ui.js` (`esc()`) |
| **9g. Page Navigation** | Role-based page initialization; sidebar nav with active states; breadcrumb labels | `public/js/auth.js` (`initPage()`, `showFinPage()`, `showEmpPage()`, `showAdmPage()`) |

---

## Database Schema Summary (17 tables)

| Table | Purpose |
|---|---|
| `users` | Employee/user records |
| `auth` | Login credentials (email, bcrypt password, role, page) |
| `profiles` | Per-user phone/address |
| `cash_advances` | Per-employee cash advance amounts |
| `bonus_types` | Configurable bonus types |
| `bonus_payouts` | 13th month payout tracking (empId + year) |
| `deduction_categories` | Custom non-statutory deduction categories |
| `payroll_records` | Confirmed payroll runs (full breakdown) |
| `sss_table` | SSS contribution brackets |
| `phil_data` | PhilHealth config (single row) |
| `pag_data` | Pag-IBIG config (single row) |
| `bir_table` | BIR TRAIN Law tax brackets |
| `app_config` | Key-value config (next IDs, workDays, limits, dedMeta) |
| `leave_types` | Leave type definitions |
| `leave_records` | Employee leave records |
| `attendance` | HRIS attendance (clock-in/out per day) |

---

## API Endpoint Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Service health check |
| `GET` | `/api/db/status` | No | MySQL connection status + table counts |
| `GET` | `/api/hris/status` | No | HRIS API configuration status |
| `GET` | `/api/hris/sync` | No | Fetch employees/attendance/leaves from HRIS |
| `GET` | `/api/data` | No | Full state read from MySQL |
| `POST` | `/api/data` | Yes | Full state write to MySQL (validated) |
| `GET` | `/api/employees` | No | List all users |
| `GET` | `/api/leaves` | No | Leave types + records |
| `POST` | `/api/leave-types` | Yes | Save leave types |
| `POST` | `/api/leave-records` | Yes | Save leave records |
| `POST` | `/api/auth/login` | No | Authenticate, return JWT |
| `GET` | `/api/auth/me` | Yes | Current user from token |
| `POST` | `/api/auth/change-password` | Yes | Update password |

---

## Frontend JS File Map

| File | Lines | Primary Responsibility |
|---|---|---|
| `core.js` | 174 | Data persistence, auth defaults, profiles, formatting, demo labels |
| `auth.js` | 473 | Login/logout, page navigation, payslip viewing/printing, profile/password |
| `employees.js` | 20 | Finance dashboard stats (employee counts, gross/ded/net totals) |
| `payroll.js` | 1182 | Employee data, attendance/leave helpers, payroll calculator, deduction engine, payroll summary, reports |
| `deductions.js` | 1483 | Deduction categories, leave types/records, attendance display, user management, HRIS sync, SSS/BIR/PhilHealth/Pag-IBIG table editing |
| `bonus.js` | 461 | Bonus types CRUD, 13th month pay, tax exemption limit, bonus scheduling |
| `reports.js` | 183 | Government contribution report, analytics dashboard |
| `ui.js` | 80 | Modal helpers, toast, responsive sidebar, responsive tables |

---

## Key Business Rules Implemented

1. **Teaching staff:** Paid by hourly rate x hours worked; unpaid days deduct 8h x rate
2. **Non-Teaching staff:** Monthly salary; absences deduct (salary / WORK_DAYS) per day
3. **13th Month Pay (RA 8515):** Total basic salary earned / 12; prorated by days worked; December-only; Dec 24 deadline
4. **Bonus Tax Exemption (RA 10963):** P90,000 annual ceiling; de minimis excluded; excess is taxable
5. **BIR Withholding:** Annualized monthly method on taxable income (gross - SSS - PhilHealth - Pag-IBIG)
6. **SSS 2025:** Editable bracket table, 5% employee share (MSC P5,000-P35,000)
7. **PhilHealth:** 5% rate, 50/50 split, min P500 / max P5,000, floor P10,000 / ceiling P100,000
8. **Pag-IBIG:** 2% (1% for <=P1,500), max P100 employee share
9. **Cash Advance:** One-time deduction, consumed on payroll confirmation
10. **HRIS Sync:** Adds new employees, updates existing, deactivates missing (except seed accounts), imports attendance and leave records
