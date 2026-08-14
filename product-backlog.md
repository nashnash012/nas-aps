# RCC-APS Product Backlog

**Project:** Republic Central Colleges — Automated Payroll System
**Format:** User Stories — ilipat sa Trello, isang card bawat item.
**Trello Lists:** `Product Backlog` → `To Do (Sprint)` → `In Progress` → `Review` → `Done`

---

## Authentication & Accounts

1. **Login System** *(High | 3 pts)*
   - As a user, I can log in using my email and password.
   - AC: Login page; maliitang credentials → error message; role-based redirect (Employee / Finance / Admin).
   - Demo: employee@rcc.edu.ph, finance@rcc.edu.ph, admin@rcc.edu.ph

2. **Change Password** *(Medium | 2 pts)*
   - As a user, I can change my current password.
   - AC: Kailangan ang kasalukuyang password bago mapalitan; validation sa bagong password; nai-save ang bagong password.

3. **User Management** *(High | 5 pts)*
   - As a System Admin, I can add, edit, and deactivate user accounts.
   - AC: Pwedeng mag-add ng user na may role (Employee/Finance/Admin); i-edit ang impormasyon; i-deactivate (hindi na makakapag-login).

## Employee Management

4. **Employee Records CRUD** *(High | 5 pts)*
   - As a System Admin, I can add and edit employee records.
   - AC: Fields: first/last name, email, role, status, department, classification (Teaching/Non-Teaching), basic salary, hire date.

5. **Attendance / Hours Worked Input** *(High | 3 pts)*
   - As a Finance Officer, I can enter hours worked (Teaching) or absences (Non-Teaching) per employee per pay period.

6. **My Profile & Payslip View** *(Medium | 3 pts)*
   - As an Employee, I can view my profile and my payslip.
   - AC: Tanging sariling payslip lamang ang nakikita; tampok ang gross, deductions, at net pay.

## Payroll Computation (Core)

7. **Monthly Payroll Calculation** *(High | 8 pts)*
   - As a Finance Officer, I can compute the monthly payroll for each employee.
   - AC: Pinagsama ang gross pay (salary + bonuses + 13th month) minus deductions; per pay period (January–December).

8. **SSS Contribution (2025)** *(High | 5 pts)*
   - Compute SSS employee share gamit ang editable SSS bracket table (MSC ₱5,000–₱35,000).

9. **PhilHealth Contribution (5%)** *(High | 3 pts)*
   - Compute PhilHealth — 5% of basic (2.5% employee share), min ₱500 / max ₱5,000.

10. **Pag-IBIG Contribution (2025)** *(High | 3 pts)*
    - Compute Pag-IBIG — 2% of compensation (1% for ≤₱1,500), max ₱100 employee share.

11. **BIR Withholding Tax (TRAIN Law)** *(High | 5 pts)*
    - Compute withholding tax gamit ang RA 10963 monthly/quarterly/annual tables.

12. **Cash Advance Deduction** *(Medium | 3 pts)*
    - As a Finance Officer, I can deduct an employee's cash advance from the payroll.

13. **Payroll Records Persistence** *(High | 5 pts)*
    - Save computed payroll per employee per month; hindi mawawala pagka-refresh.

14. **Payslip Generation** *(High | 5 pts)*
    - Generate at i-print/i-download ang payslip per employee per pay period.

## Bonus Management

15. **Configurable Bonus Types** *(High | 5 pts)*
    - As a Finance Officer, I can add, edit, enable/disable bonus types.

16. **13th Month Pay (RA 8515)** *(High | 5 pts)*
    - Awtomatikong kasama sa December payroll run; may opt-out checkbox; deadline Dec 24.

17. **De Minimis & ₱90,000 Tax-Exempt Pool** *(High | 5 pts)*
    - De minimis (BIR RR 11-2018) excluded sa ₱90,000 pool; taxable bonus lamang ang sumasama sa pool.

## Deduction Tables (Configuration)

18. **Editable Government Rate Tables** *(High | 5 pts)*
    - As a System Admin/Finance, I can update SSS/PhilHealth/Pag-IBIG rate tables.
    - AC: Pagbabago ay kailangang mag-apply sa susunod na payroll cycle.

## Reports & Analytics

19. **Government Contribution Report** *(High | 5 pts)*
    - Generate report ng kabuuang SSS/PhilHealth/Pag-IBIG contributions.

20. **Analytics Dashboard** *(Medium | 5 pts)*
    - Monthly gross payroll trend chart at government deduction summary.

## Dashboard

21. **Role-Based Dashboard** *(Medium | 3 pts)*
    - Bilang user, makakakita ako ng summary dashboard ayon sa aking role (Employee/Finance/Admin).

---

## Legend
- **Priority:** High / Medium / Low
- **Story Points:** 1–8 (estimation ng effort)
- **AC:** Acceptance Criteria — ilagay sa card description sa Trello
