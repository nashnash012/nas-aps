# RCC-APS — Paano I-Report ang Sitemap at Mga Diagram (Capstone Guide)

> **Republic Central Colleges — Automated Payroll System**
> Step-by-step guide kung paano i-report ang bawat required item sa inyong capstone documentation.
> Ang gabay na ito ay naka-angkla sa outline ng `2024-RCC_CCS_capstone-outline.doc`.

---

## Talaan ng mga Required Items

| # | Item | Chapter / Section | Source File (kung meron) |
|---|---|---|---|
| 1 | Sitemap | Chapter 2 (System Overview) | `sitemap.md` |
| 2 | Screen Flow Diagram | Chapter 2 / Chapter 4 | `capstone-screen-flow.md` |
| 3 | Use Case Diagram | Chapter 2 | `capstone-usecase.md` |
| 4 | Activity Diagram | Chapter 2 | `capstone-activity.md` at `process-flow.md` |
| 5 | Entity Relational Diagram (ERD) | Chapter 3 (Database Design) | `capstone-erd.md` |
| 6 | Database Structure | Chapter 3 | `capstone-datastructures.md`, `capstone-erd.md` |
| 7 | Project Profile | Chapter 1 (Intro) | — |
| 8 | Resource Requirements | Chapter 2 (Management) | `capstone-resource-requirements.md` |
| 9 | RAM (Responsibility Assignment Matrix) | Chapter 2 | `capstone-ram-feed.md` |
| 10 | PPA (Potential Problem Analysis) | Chapter 2 | `capstone-ppa-feed.md` |
| 11 | POA (Potential Opportunity Analysis) | Chapter 2 | `capstone-poa-feed.md` |
| 12 | Letter of Transmittal | Front Matter (bago ang TOC) | `capstone-letter-of-transmittal.md` |

---

## 1. SITEMAP

**Ano ito:** Isang diagram na nagpapakita ng lahat ng screens/pages ng system at kung paano sila magkaka-ugnay.

**Paano i-report:**
1. Buksan ang `rcc-aps/sitemap.md` — mayroon nang kumpletong breakdown (Login → 3 portals → screens).
2. Gumawa ng **visual sitemap diagram** gamit ang:
   - **Draw.io / diagrams.net** (libre) — pinaka-recommend
   - **Figma** (kung may wireframe na)
   - **Lucidchart** (kung meron nang account)
3. Ipakita ang sitemap bilang isang **hierarchical tree**:
   ```
   LOGIN
     ├── EMPLOYEE PORTAL (5 screens)
     │     ├── Dashboard
     │     ├── My Payslip
     │     ├── My Profile
     │     ├── Change Password
     │     └── Log Out
     ├── FINANCE OFFICER PORTAL (17 screens)
     │     ├── Dashboard, Analytics, Payroll Calculation,
     │     ├── Employee Records, Attendance/Hours, Bonus Management,
     │     ├── Reports, Deduction Tables,
     │     └── My Payslip, My Profile, Change Password
     └── SYSTEM ADMIN PORTAL (8 screens)
           ├── Dashboard, User Management, Employee Records,
           ├── Deduction Tables,
           └── My Payslip, My Profile, Change Password
   ```
4. Lagyan ng **maikling narrative** sa ilalim: "Ang system ay may isang login screen at tatlong role-based portals..."

**Format sa thesis:** Figure 1 (o kung anong numero) + caption + isang talatang paliwanag.

---

## 2. SCREEN FLOW DIAGRAM (per module and feature)

**Ano ito:** Nagpapakita kung paano dumadaloy ang user mula sa isang screen papunta sa susunod, may kasamang mga action button at decisions.

**Paano i-report:**
1. Buksan ang `rcc-aps/capstone-screen-flow.md` — per-module na ang breakdown.
2. Gumawa ng **isa (1) screen flow diagram bawat module** (hindi bawat feature):
   - **Login Module** — 1 diagram
   - **Employee Module** — 1 diagram (Dashboard → My Payslip → Payslip Detail → My Profile → Change Password)
   - **Finance Module** — 1 diagram (Dashboard → Analytics → Payroll Calculation → Bonus → Reports → Deduction Tables)
   - **Admin Module** — 1 diagram (Dashboard → User Management → Deduction Tables)
3. Sa diagram, gamitin ang **standard notation**:
   - ▭ Rectangle = screen/page
   - ◆ Diamond = decision (hal. "May laman ba ang fields?")
   - → Arrow = navigation flow
   - Label ang arrows ng action (hal. "Click View", "Click Save")
4. Sa bawat screen box, ilista ang **key features** ng screen na iyon.

**Format sa thesis:** Figure bawat module + caption + narrative na naglalarawan ng flow.

**Tips:**
- Magsimula sa Login, tapos i-branch sa 3 portals.
- Sa Payroll Calculation, ipakita ang 7 steps (Select Period → 13th Month → Filter → Search → Inputs → Auto-compute → Confirm).

---

## 3. USE CASE DIAGRAM (per module and feature)

**Ano ito:** Nagpapakita kung **sino** (actor) ang gumagawa ng **ano** (use case) sa system. Wala itong sequence, puro "sino-pwede-gumawa-ng-anong-function".

**Paano i-report:**
1. Buksan ang `rcc-aps/capstone-usecase.md` — mayroon nang 28 use cases (UC-01 hanggang UC-28).
2. Gumawa ng **use case diagram bawat module**:
   - **Common Module** (UC-01 Log In, UC-02 Log Out, UC-03 My Payslip, UC-04 My Profile, UC-05 Change Password)
   - **Employee Module** (UC-06 View Employee Dashboard)
   - **Finance Module** (UC-07 hanggang UC-16)
   - **Admin Module** (UC-17 hanggang UC-24)
   - **System Module** (UC-25 hanggang UC-28 — automatic, walang human actor)
3. Sa diagram:
   - 🧍 **Stick figure** = Actor (Employee, Finance Officer, Admin, HRIS System)
   - ⭕ **Ellipse** = Use case (function)
   - ▭ **Rectangle** = System boundary
   - — → Solid line = actor participates in use case
   - ◂▸ **«include»** = laging kasama (hal. Log In «include» Validate Credentials)
   - ◂▸ **«extend»** = optional (hal. Download PDF «extend» View Payslip)
4. Lagyan ng **use case narrative** para sa mga CORE use cases (UC-09 Compute Payroll, UC-18 Add User) gamit ang format:
   ```
   Actor · Precondition · Trigger · Main Flow · Alternate · Result
   ```

**Format sa thesis:** Figure bawat module + table ng use cases (ID, Name, Actor, Description) + narratives para sa core use cases.

---

## 4. ACTIVITY DIAGRAM (per module and feature)

**Ano ito:** Nagpapakita ng **sequence ng activities** mula simula hanggang katapusan, kasama ang mga decisions at parallel processes.

**Paano i-report:**
1. Buksan ang `rcc-aps/capstone-activity.md` (per module) at `rcc-aps/process-flow.md` (kumpletong flows).
2. Gumawa ng **activity diagram bawat major feature** (mas detalyado kaysa screen flow):
   - **Login Activity** — ipakita ang validation branches
   - **Compute Employee Payroll ★CORE** — ito ang pinakamahalaga; ipakita ang buong flow (Select period → inputs → auto-compute deductions → confirm)
   - **Add New User ★CORE** — ipakita ang validations
   - **Generate Reports** — month vs full year branch
   - **Sync from HRIS** — real API vs mock fallback
   - **Auto-Compute Government Deductions** — parallel fork (SSS ∥ PhilHealth ∥ Pag-IBIG ∥ BIR)
3. Sa diagram, gamitin ang **standard UML activity notation**:
   - ● = Start / End node
   - ⬭ Rounded rectangle = Activity
   - ◆ Diamond = Decision (with guard condition [Yes/No])
   - ▬ Thick bar = Fork / Join (parallel)
   - Swimlanes (optional): Employee | Finance | Admin | System | HRIS
4. I-convert ang text-based flows sa `process-flow.md` gamit ang **Draw.io** para may visual na activity diagram.

**Format sa thesis:** Figure bawat feature + narrative.

**Tips:**
- Ang notation na nasa `process-flow.md` ay may katumbas na UML na notation (○→●, ◈→◆, ∥→fork).
- Para sa payroll, gamitin ang swimlane para ipakita kung saang actor nabibilang ang bawat hakbang.

---

## 5. ENTITY RELATIONAL DIAGRAM (ERD)

**Ano ito:** Nagpapakita ng **mga entities** (tables) at ang **relasyon** nila (one-to-one, one-to-many).

**Paano i-report:**
1. Buksan ang `rcc-aps/capstone-erd.md` — may kumpletong listahan ng entities, attributes, at relationships.
2. Gumawa ng **Crow's Foot ERD** gamit ang Draw.io o Lucidchart.
3. Kasama sa diagram:
   - **USERS** (PK: id) — master employee table
   - **AUTH** (PK: id = USERS.id) — 1:1
   - **CASH ADVANCES** (PK: key = USERS.id) — 1:1
   - **PAYROLL RECORDS** (FK: empId → USERS.id) — 1:M
   - **BONUS TYPES** — reference table (M:N via payroll records bonuses[])
   - **BONUS PAYOUTS** (PK: {empId}_{year}) — 1:1 per year
   - **DEDUCTION CATEGORIES** — reference table
   - **PROFILE** — employee contact info
4. Ipakita ang **cardinality** nang malinaw:
   - USERS `1 ──── M` PAYROLL RECORDS (isang employee, maraming payslip)
   - USERS `1 ──── 1` AUTH (isang employee, isang login)
   - BONUS TYPES `M ──── N` PAYROLL RECORDS (marami-sa-marami)
5. Markahan ang PK at FK ng mga simbolo (🔑 PK, FK).

**Format sa thesis:** Figure + table ng entities (Entity, Description, Attributes, Keys) + relationship matrix.

---

## 6. DATABASE STRUCTURE

**Ano ito:** Detalyadong paglalarawan ng bawat table/entity — columns, data types, constraints.

**Paano i-report:**
1. Buksan ang `rcc-aps/capstone-datastructures.md` at `rcc-aps/capstone-erd.md` (§3 Entities).
2. Gumawa ng **table para sa bawat entity**:
   ```
   Table: USERS
   | Column | Data Type | Constraint | Description |
   | id | Integer | PRIMARY KEY, AUTO INCREMENT | Unique ID ng employee |
   | first | String | NOT NULL | First name |
   | email | String | UNIQUE, NOT NULL | Login email |
   | role | String | NOT NULL | System Admin / Finance / Employee |
   | salary | Number | | Monthly base salary |
   | ... | ... | ... | ... |
   ```
3. Ilista ang mga **reference/rate tables** (SSS 63 brackets, PhilHealth, Pag-IBIG, BIR TRAIN) na nasa JS code, hindi sa database.
4. Idagdag ang **REST API** table (mula sa `sitemap.md` §7):
   | Method | Endpoint | Description |
   |---|---|---|
   | GET | /api/health | Server status |
   | GET | /api/data | Fetch state |
   | POST | /api/data | Save state |
   | GET | /api/hris/sync | Pull employees mula sa HRIS |

**Format sa thesis:** §Database Structure na may bawat entity table + relationship narrative.

---

## 7. PROJECT PROFILE

**Ano ito:** Impormasyon tungkol sa proyekto — pamagat, proponent, institution, duration, at buod.

**Paano i-report (gawing table):**
```
| Field | Details |
|---|---|
| Project Title | RCC-APS: Republic Central Colleges Automated Payroll System |
| Proponents | John Carlo Cabigting, Jhon Gerald Batuan, Nash Valencia |
| Institution | Republic Central Colleges |
| Department | College of Computer Studies |
| System Type | Web-based Automated Payroll System |
| Platform | Web (Node.js + Express backend, Vanilla JS frontend) |
| Database | JSON file (server/db/db.json) |
| Users | Employee, Finance Officer, System Administrator |
| Core Features | Payroll computation (SSS, PhilHealth, Pag-IBIG, BIR, 13th month), digital payslip, reports, user management, HRIS sync |
| Status | [Ongoing / Completed] |
```

**Format sa thesis:** Sa Chapter 1 (Introduction) o Appendix — table + maikling narrative.

---

## 8. RESOURCE REQUIREMENTS

**Ano ito:** Ang mga resources na kailangan (tao, facility, device, mode of use, materials) bawat activity sa project.

**Paano i-report:**
1. Buksan ang `rcc-aps/capstone-resource-requirements.md` — handa na ang buong WBS table (22 activities, 6 phases).
2. Ipasok ang table na may columns:
   `Activity | Human (Skills & #) | Facility | Device | Mode of Use | Materials/Resources`
3. Siguraduhing tugma ang activities sa RAM/PPA/POA (same numbering).

**Format sa thesis:** Table + maikling introduction kung ano ang resource requirements.

---

## 9. RAM (Responsibility Assignment Matrix)

**Ano ito:** DACI matrix na nagpapakita kung sino ang Driver (D), Approver (A), Contributor (C), at Informed (I) bawat activity.

**Paano i-report:**
1. Buksan ang `rcc-aps/capstone-ram-feed.md` — i-paste ang feed sa AI para i-generate, o i-copy ang table na nasa loob.
2. Ipasok ang table na may columns:
   `Work Breakdown Structure | John Carlo Cabigting | Jhon Gerald Batuan | Nash Valencia`
3. Sa ilalim ng table, ipaliwanag ang **DACI legend**:
   - D = Driver (nagtutulak sa task)
   - A = Approver (may huling desisyon)
   - C = Contributor (nagbibigay input)
   - I = Informed (ina-update lang)

**Format sa thesis:** Table + DACI explanation paragraph.

---

## 10. PPA (Potential Problem Analysis)

**Ano ito:** Listahan ng mga **posibleng problema** (risks), sanhi, preventive action, contingent action, at trigger.

**Paano i-report:**
1. Buksan ang `rcc-aps/capstone-ppa-feed.md` — may 9 na problems na (team unavailability, internet issues, incorrect computation, data loss, HRIS failure, budget, documentation, privacy, deployment).
2. Ipasok ang table na may columns:
   `Potential Problem | Likely Cause | Preventive Action | Contingent Action | Trigger`

**Format sa thesis:** Table + introduction paragraph (ano ang PPA at bakit mahalaga).

---

## 11. POA (Potential Opportunity Analysis)

**Ano ito:** Listahan ng mga **posibleng oportunidad** (positive events), sanhi, promoting action, contingent action, at trigger.

**Paano i-report:**
1. Buksan ang `rcc-aps/capstone-poa-feed.md` — may 7 opportunities na.
2. Ipasok ang table na may columns:
   `Potential Opportunity | Likely Cause | Promoting Action | Contingent Action | Trigger`

**Format sa thesis:** Table + introduction paragraph.

---

## 12. LETTER OF TRANSMITTAL

**Ano ito:** Pormal na liham na nag-susubmit ng thesis sa adviser/dean.

**Paano i-report:**
1. Buksan ang `rcc-aps/capstone-letter-of-transmittal.md` — template na may placeholders.
2. Punuan ang:
   - Pangalan at address ng school
   - Petsa
   - Pangalan/title ng adviser
   - Course/year/section ng bawat miyembro
3. Ilagay sa **front matter** ng thesis (bago ang Table of Contents, pagkatapos ng title page).

**Format:** Standard business letter format (school letterhead, date, recipient, body, signatures, notation).

---

## Quick Workflow (Step-by-Step)

1. **Gumawa ng Figures gamit ang Draw.io** — ERD, Screen Flow, Use Case, Activity, Sitemap.
   - Downloads: https://app.diagrams.net (web) o desktop app
2. **Kunin ang content** mula sa existing `capstone-*.md` files (lahat ay nakasulat na).
3. **I-paste ang AI feeds** (`capstone-ram-feed.md`, `capstone-ppa-feed.md`, `capstone-poa-feed.md`) sa ChatGPT/Gemini para sa polished na text at tables.
4. **I-copy ang tables** sa inyong documentation document.
5. **I-render ang mga diagram** at i-export bilang PNG/PDF para i-insert sa thesis.

## Recommended Diagram Tools

| Tool | Use | Price |
|---|---|---|
| Draw.io (diagrams.net) | ERD, Use Case, Activity, Screen Flow, Sitemap | Libre |
| Lucidchart | Same diagrams (mas polished) | Free tier |
| Figma | Wireframe / prototypes | Free tier |
| Canva | Sitemap / visual layout | Free tier |
| Word/Google Docs | Tables (RAM, PPA, POA) | Libre |
