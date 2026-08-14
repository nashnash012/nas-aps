# RCC-APS Potential Problem Analysis (PPA) — AI Feed

> **Republic Central Colleges — Automated Payroll System**
> Feed/prompt to paste into an AI to generate the PPA section of the thesis.

---

## Feed (copy this)

```
YOUR ROLE: Capstone thesis consultant. Write the "Potential Problem Analysis (PPA)" section
for the thesis documentation of RCC-APS (Republic Central Colleges – Automated Payroll System).

SYSTEM CONTEXT:
• Web-based payroll system: Node.js + Express backend, Vanilla JS frontend,
  JSON file database (server/db/db.json) with REST API, 3 user roles
  (Employee / Finance Officer / Admin).
• Core features: automatic government deductions (SSS RA 11199, PhilHealth 5%,
  Pag-IBIG capped ₱100, BIR TRAIN RA 10963), 13th-month pay (RA 8515, ₱90,000
  tax-exempt pool, RR 11-2018 de minimis), editable deduction tables,
  HRIS sync (mock fallback or real API via HRIS_API_URL/HRIS_API_KEY),
  digital payslip + PDF, reports & analytics.
• Team: 3 members (John Carlo Cabigting, Jhon Gerald Batuan, Nash Valencia),
  all acting as Driver/Contributor in Development, Testing, and Review.

WRITE IN THIS FORMAT:
Potential Problem Analysis (PPA)
Potential Problem Analysis (PPA) is a proactive process used to identify possible
negative events or unplanned issues that may occur during the development of a project.
In the context of the RCC-APS, PPA helps the team foresee potential risks, such as
technical failures, delays, or miscommunication, that could disrupt development or
reduce system quality.

WRITE THIS TABLE (Table X. Potential Problem Analysis (PPA)):
Column headers: Potential Problem | Likely Cause | Preventive Action | Contingent Action | Trigger

1. Team member unavailability
   Likely Cause: Illness; power outage; personal issues; time management conflict; loss of interest
   Preventive Action: Assign overlapping responsibilities and maintain updated task documentation
   Contingent Action: Redistribute tasks to available members and adjust the timeline
   Trigger: Member misses 2+ meetings or fails to deliver assigned output

2. Internet Connectivity Issues
   Likely Cause: Unstable or slow internet, network downtime
   Preventive Action: Regularly check and maintain the school's internet connection to avoid disconnection problems
   Contingent Action: Manually re-sync data (payslips, employee records, HRIS) that failed to push once the connection is restored
   Trigger: Data not syncing to the server (POST /api/data) or HRIS sync failing; error messages in system

3. Incorrect Payroll / Deduction Computation
   Likely Cause: Outdated government rate tables (SSS brackets, PhilHealth 5%, Pag-IBIG cap, BIR TRAIN); wrong formulas; manual data entry errors
   Preventive Action: Keep the editable deduction tables up to date with official rates; validate formulas against sample pay slips; test with real employee data before release; add validation on inputs (hours, absences, salary)
   Contingent Action: Recompute affected payslips, correct the records, and issue an adjustment payslip to affected employees
   Trigger: Computed net pay differs from manual computation; employee or Finance Officer reports a discrepancy

4. Data Loss or Corruption of the JSON Database
   Likely Cause: Accidental overwrite; failed write during save; no backup in place
   Preventive Action: Schedule regular backups of server/db/db.json; use Git versioning for the file; validate data on load (read/write error handling)
   Contingent Action: Restore the last known-good backup or Git revision; rebuild missing records from printed payslips or payroll reports
   Trigger: System fails to load data or payroll records disappear after a restart

5. HRIS Integration Failure
   Likely Cause: HRIS API unreachable; invalid or expired API key; response format changed
   Preventive Action: Configure HRIS_API_URL and HRIS_API_KEY correctly; test the sync in staging; keep the mock fallback for offline demo
   Contingent Action: Add or update employee records manually; verify connection status via /api/hris/status before retrying the sync
   Trigger: Employee records not appearing after "Sync from HRIS"; /api/hris/sync returns an error

6. Budget / Resource Limitation
   Likely Cause: Unexpected hardware/software costs
   Preventive Action: Submit request to the school, reuse available resources, or seek sponsorship
   Contingent Action: Delay non-critical features and focus on core modules
   Trigger: Team cannot procure needed device or service

7. Insufficient Documentation for Handover
   Likely Cause: Focus on development over documentation; time constraints; unclear task delegation
   Preventive Action: Assign a team member solely responsible for documentation; set documentation deadlines for each sprint (e.g., user manual, admin guide, technical guide)
   Contingent Action: Schedule a documentation sprint before deployment; conduct a walkthrough session with the Product Owners
   Trigger: Product Owners express confusion; team is unable to answer questions post-deployment

8. Data Privacy Breach / Unauthorized Access
   Likely Cause: Weak passwords; improper enforcement of role-based access control; shared accounts
   Preventive Action: Enforce strong passwords; implement and test RBAC per role; deactivate unused accounts; follow RA 10173 (Data Privacy Act) for payroll records
   Contingent Action: Reset affected passwords, revoke access, review activity records, and notify affected employees
   Trigger: Unauthorized access attempt detected; account compromise; sensitive payroll data exposed

9. Final Deployment Errors (e.g., server not running properly)
   Likely Cause: Improper configuration or overlooked environment issues
   Preventive Action: Follow a detailed deployment checklist and test in a staging environment
   Contingent Action: Rollback deployment, fix issues, and redeploy after validation
   Trigger: Deployment errors found in live environment or test run fails

FORMAT:
- Write in formal academic English
- Output the PPA table in a clean table format (Potential Problem | Likely Cause | Preventive Action | Contingent Action | Trigger)
- No 'Introduction' — start directly with the "Potential Problem Analysis (PPA)" heading
```
