# RCC-APS Modules & Features (Complete Breakdown)

> Updated version — reflects everything implemented in the system.

---

## [M1] Login & Authentication Module
- User Authentication & Session Management
- Role-Based Access Control (RBAC)
- Account status check (blocks deactivated users)
- Welcome/redirect screen per role
- Change Password

## [M2] User Management Module
- Create / Read / Update / Delete User Accounts
- Deactivate / Reactivate Accounts
- View User profile
- Search / Filter users (by role, status)
- Sync Employees from HRIS (real API or mock fallback)

## [M3] Payroll Calculation Module
- Teaching Personnel Computation (Hours Worked × Hourly Rate)
- Non-Teaching Personnel Computation (Fixed Monthly Salary − Absences ÷ 22)
- SSS Contribution Computation (editable 63-bracket table, RA 11199)
- PhilHealth Premium Computation (5%, min ₱500 / max ₱5,000)
- Pag-IBIG Contribution Computation (capped, max ₱100)
- BIR Withholding Tax Computation (TRAIN Law RA 10963, annualized)
- Net Pay Computation
- Cash Advance deduction
- 13th Month Pay Computation (December run, RA 8515)
- Configurable Bonus Types applied to earnings
- De Minimis benefit split (BIR RR 11-2018 — tax-exempt)
- ₱90,000 tax-exempt bonus pool (RA 10963 / CREATE Act)
- 13th Month excess tax (withholding on amount over ₱90,000)

## [M4] Employee Dashboard Module
- View Digital Payslip
- Download / Print Payslip (PDF)
- Update Personal Contact Information
- View payroll overview (Basic Pay, Net Pay, Next Payout)

## [M5] Reporting Module
- Payroll Summary Report Generation (Monthly + Full Year)
- Government Contribution Report Generation
- PDF Export

## [M6] Deduction Table Management Module
- Update SSS / PhilHealth / Pag-IBIG / BIR Rates
- Other Deduction Categories (custom fixed ₱ or % of gross deductions)

## [M7] Bonus Table Management Module
- 13th Month Pay Computation (Total Basic Salary Earned / 12)
- Proration for New Hires / Resignees (Months-Worked Basis)
- Configurable Bonus Type Setup (Extensible for Future Use)
- De Minimis flag per bonus type
- Eligibility check (no-service year = no 13th month)
- 13th Month payout tracking (Mark Paid)
- Payout window banner (Dec 1–24 statutory deadline)

## [M8] Analytics Dashboard Module
- Total Payroll Cost per Cycle
- YTD gross payroll
- Teaching vs. Non-Teaching Cost Breakdown
- Government Deductions Summary (SSS/PhilHealth/Pag-IBIG/BIR) with % share
- Monthly Payroll Trend
- 13th Month Pay Cost Impact (December)
