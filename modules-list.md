# RCC-APS — Modules & Submodules

## M1 — Login & Authentication Module

| Submodule | Description |
|-----------|-------------|
| User Authentication & Session Management | Handles email/password login and session persistence |
| Role-Based Access Control (RBAC) | Restricts page access based on user role (Employee, Finance, Admin) |
| Account Status Check | Blocks deactivated users from logging in |
| Welcome/Redirect Screen | Routes users to the correct portal dashboard after login |
| Change Password | Allows users to update their password |

## M2 — User Management Module

| Submodule | Description |
|-----------|-------------|
| CRUD for User Accounts | Add, view, edit, and delete user accounts |
| Deactivate / Reactivate Accounts | Toggle user account status |
| Search / Filter Users | Filter users by role, status, and keywords |
| Sync Employees from HRIS | Imports employee data from external HRIS (real API or mock fallback) |

## M3 — Payroll Calculation Module

| Submodule | Description |
|-----------|-------------|
| Teaching Personnel Computation | Computes pay based on Hours Worked × Hourly Rate |
| Non-Teaching Personnel Computation | Computes pay using Fixed Monthly Salary − Absences ÷ 22 |
| SSS Contribution | Editable 63-bracket table (RA 11199) |
| PhilHealth Premium | 5% rate, min ₱500 / max ₱5,000 |
| Pag-IBIG Contribution | 2% rate, capped at ₱100 |
| BIR Withholding Tax | TRAIN Law (RA 10963), annualized computation |
| Net Pay Computation | Gross Pay − All Deductions |
| Cash Advance Deduction | Deducts cash advances from net pay |
| 13th Month Pay | December run computation (RA 8515) |
| De Minimis Benefits | BIR RR 11-2018, ₱90,000 tax-exempt bonus pool |
| Payroll Confirmation & Save | Finalizes and saves payroll run |

## M4 — Employee Dashboard Module

| Submodule | Description |
|-----------|-------------|
| Digital Payslip Viewer | Displays payslip details (earnings, deductions, net pay) |
| Download / Print Payslip (PDF) | Generates printable PDF of the payslip |
| Update Personal Contact Information | Employees can edit their contact details |
| Payroll Overview | Shows basic pay, net pay, and next payout date |

## M5 — Reporting Module

| Submodule | Description |
|-----------|-------------|
| Payroll Summary Report | Monthly and full-year payroll summary |
| Government Contribution Report | SSS, PhilHealth, Pag-IBIG, BIR totals per period |
| PDF Export | Generates downloadable PDF reports |

## M6 — Deduction Table Management Module

| Submodule | Description |
|-----------|-------------|
| SSS Rate Table | Editable SSS contribution brackets |
| PhilHealth Rate Table | Editable PhilHealth premium rates |
| Pag-IBIG Rate Table | Editable Pag-IBIG contribution rates |
| BIR Withholding Tax Table | Editable BIR tax table (TRAIN Law) |
| Other Deduction Categories | Custom fixed-amount or percentage-based deductions |

## M7 — Bonus Table Management Module

| Submodule | Description |
|-----------|-------------|
| 13th Month Pay Computation | Total Basic Salary Earned / 12, with proration for new hires/resignees |
| Bonus Type Management | Add, edit, delete, and toggle bonus types |
| De Minimis Flag | Marks bonus types as tax-exempt under BIR RR 11-2018 |
| Eligibility Check | Prevents 13th month payout for employees with no service year |
| Mark Paid | Tracks and marks 13th month payout completion |
| Payout Window Banner | Displays statutory Dec 1–24 payout deadline reminder |

## M8 — Analytics Dashboard Module

| Submodule | Description |
|-----------|-------------|
| Total Payroll Cost per Cycle | Shows total cost for the current payroll cycle |
| YTD Gross Payroll | Year-to-date gross payroll totals |
| Teaching vs. Non-Teaching Cost Breakdown | Comparison of costs between employee types |
| Government Deductions Summary | SSS/PhilHealth/Pag-IBIG/BIR totals with % share |
| Monthly Payroll Trend | Line chart of monthly payroll costs |
| 13th Month Pay Cost Impact | December-specific cost analysis |

---

**8 Main Modules, 51 Submodules**
