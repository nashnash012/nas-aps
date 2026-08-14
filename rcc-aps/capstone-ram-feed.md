# RCC-APS Responsibility Assignment Matrix (RAM) — AI Feed

> **Republic Central Colleges — Automated Payroll System**
> Feed/prompt to paste into an AI to generate the RAM section of the thesis.

---

## Feed (copy this)

```
YOUR ROLE: Capstone thesis consultant. Write the "Responsibility Assignment Matrix (RAM)" section
for the thesis documentation of RCC-APS (Republic Central Colleges – Automated Payroll System).

SYSTEM CONTEXT:
• Web-based payroll system: Node.js + Express backend, Vanilla JS frontend,
  JSON file database (server/db/db.json), 3 user roles (Employee / Finance Officer / Admin).
• Team: only 3 members
  - John Carlo Cabigting
  - Jhon Gerald Batuan
  - Nash Valencia
• Shared division of labor: the whole team acts as Driver and Contributor in
  Development, Testing, and Review; Jhon Gerald Batuan is the Approver in Requirements and Design.

WRITE IN THIS FORMAT:
Responsibility Assignment Matrix (RAM)
The Responsibility Assignment Matrix (RAM) is a project management tool used to
clearly assign roles to team members for each task. It ensures everyone knows
their responsibilities and helps avoid confusion.

One common type of RAM is the DACI Matrix, where:
D = Driver – the person who pushes the task forward and ensures progress
A = Approver – the person who makes the final decision or has ultimate ownership
C = Contributor – people who provide input, suggestions, or expertise
I = Informed – people who need to be kept updated on progress and decisions

This matrix works well for decision-making in Agile or Scrum teams.

WRITE THIS TABLE (Table X. Responsibility Assignment Matrix (RAM)):
Column headers: Work Breakdown Structure | John Carlo Cabigting | Jhon Gerald Batuan | Nash Valencia

1. Requirements
1.1 Identifying the Product Owners ......... I | I | I
1.2 Conducting Research & Observation ....... D/C | A/C | C
1.3 Observing Previous Payroll & Attendance Process ...... D/I | A/I | I
1.4 Reviewing Government & Legal Compliance (RA 8515, RA 11199, RA 10963, RA 10173, RR 11-2018) .... C/I | A/I | D/C
1.5 Analyzing & Defining System Requirements ............ C | A/C | C

2. Design
2.1 Designing System Modules ................ D/C | A/C | C
2.2 Designing System Diagrams ............... D/C | I | C
2.3 Finalizing Database Schema (JSON structure ng server/db/db.json) .... C | I | D/C
2.4 Presenting Diagrams and Prototypes ...... C | A | C

3. Development (all members act as Driver & Contributor)
3.1 Core Setup: Login & Auth (RBAC, 3 roles) .............. D/C | D/C | D/C
3.2 User Management & HRIS Sync ........................... D/C | D/C | D/C
3.3 Payroll Calculation Engine (SSS/PhilHealth/Pag-IBIG/BIR/13th month) ... D/C | D/C | D/C
3.4 Employee Self-Service: Dashboard, Digital Payslip & PDF ... D/C | D/C | D/C
3.5 Reports & Analytics (Summary, Gov Contribution, Charts) ... D/C | D/C | D/C
3.6 Bonus & Deduction Table Management (13th month, custom bonuses) ... D/C | D/C | D/C

4. Testing
4.1 Unit Testing ............................ D/C | D/C | D/C
4.2 Integration Testing (Frontend↔REST API↔JSON DB) ... D/C | D/C | D/C
4.3 System Testing ........................... D/C | D/C | D/C
4.4 User Acceptance Testing (UAT) ............ D/C | D/C | D/C
4.5 Performance Testing ...................... D/C | D/C | D/C
4.6 Security Testing (RBAC, Data Privacy RA 10173) ... D/C | D/C | D/C

5. Deployment
5.1 Final System Testing, Fixes, Deployment, User Training, Documentation Signing ... D/C | D/C | D/C

6. Review
6.1 Review Meetings, Feedback Collection, Final Refinement ... D/C | D/C | D/C
6.2 Post-Sprint: System monitoring, follow-up trainings, issue tracking, final documentation ... D/C | D/C | D/C

FORMAT:
- Write in formal academic English
- Output the RAM table in a clean table format
- No 'Introduction' — start directly with the "Responsibility Assignment Matrix (RAM)" heading
```
