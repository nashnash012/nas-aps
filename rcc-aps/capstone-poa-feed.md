# RCC-APS Potential Opportunity Analysis (POA) — AI Feed

> **Republic Central Colleges — Automated Payroll System**
> Feed/prompt to paste into an AI to generate the POA section of the thesis.

---

## Feed (copy this)

```
YOUR ROLE: Capstone thesis consultant. Write the "Potential Opportunity Analysis (POA)" section
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
Potential Opportunity Analysis (POA)
Potential Opportunity Analysis (POA) focuses on identifying positive events or unexpected
opportunities that may arise during the development of a project. In the case of the RCC-APS,
POA helps the team recognize chances to improve efficiency, reduce costs, enhance quality,
or add value to the system beyond the original expectations.

WRITE THIS TABLE (Table X. Potential Opportunity Analysis (POA)):
Column headers: Potential Opportunity | Likely Cause | Promoting Action | Contingent Action | Trigger

1. Early feedback in improving the system quality
   Likely Cause: Regular communication via Messenger, Google Meet
   Promoting Action: Conduct sprint-end demos and feedback sessions
   Contingent Action: Gather feedback through forms if meetings can't occur
   Trigger: Product Owners and the Project Adviser actively engage with updates

2. Reusability of existing equipment (computers, printers)
   Likely Cause: School already has compatible devices
   Promoting Action: Inventory existing hardware early and integrate with system
   Contingent Action: Propose phased equipment purchase or alternatives
   Trigger: ITS Department confirms hardware compatibility

3. Positive reputation of the team within the college
   Likely Cause: Delivering a high-quality, useful system
   Promoting Action: Ensure polished presentation with the Product Owners and panelist satisfaction
   Contingent Action: Gather testimonials to strengthen credibility
   Trigger: The project adviser, panelists, and product owners expressed satisfaction

4. Digitization of payslips reduces paper and printing costs for the Finance Office
   Likely Cause: The system provides downloadable PDF payslips to all employees
   Promoting Action: Market the digital payslip feature to the Finance Office; provide
   a short training on printing/saving PDF payslips
   Contingent Action: If paperless is not yet accepted, keep a batch print option for
   offices that require physical copies
   Trigger: Finance Officer and employees start using the PDF download feature regularly

6. Fewer payroll errors and faster processing turnaround
   Likely Cause: Automatic computation of SSS, PhilHealth, Pag-IBIG, BIR, and 13th-month pay
   Promoting Action: Run a parallel test payroll comparing system output vs. manual
   computation; present the accuracy results to the Finance Officer
   Contingent Action: If discrepancies are found, adjust deduction tables and re-run the test
   Trigger: The computed values match the manual payroll for two consecutive pay periods

7. Future-proofing against government rate changes
   Likely Cause: Deduction tables (SSS, PhilHealth, Pag-IBIG, BIR) are editable inside the system
   Promoting Action: Document the editing procedure and schedule a yearly rate review
   with the Finance Officer when new official rates are released
   Contingent Action: If a new rate is released mid-cycle, apply it at the next payroll
   cycle and notify affected employees
   Trigger: A new government rate circular is published (e.g., new SSS or PhilHealth bracket)

8. Integration with a real HRIS reduces manual employee data entry
   Likely Cause: HRIS sync endpoint already supports a real API via HRIS_API_URL and
   HRIS_API_KEY, with a mock fallback for development
   Promoting Action: Coordinate with the ITS department to configure the real HRIS API and
   test the sync with live employee records
   Contingent Action: If the real API is not yet available, continue using the mock fallback
   and document the setup steps for future activation
   Trigger: ITS confirms the HRIS API credentials are ready

FORMAT:
- Write in formal academic English
- Output the POA table in a clean table format (Potential Opportunity | Likely Cause | Promoting Action | Contingent Action | Trigger)
- No 'Introduction' — start directly with the "Potential Opportunity Analysis (POA)" heading
```
