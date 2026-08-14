# RCC-APS Resource Requirements (Work Breakdown Structure)

> **Republic Central Colleges — Automated Payroll System**
> Work breakdown structure of the resources required to develop, test, deploy, and review the system.

The system is built with **Node.js + Express** (backend), **Vanilla JavaScript / HTML5 / CSS3** (frontend), and a **JSON file database** (`server/db/db.json`) with a REST API. The breakdown below shows each activity, the required skills and number of persons, facility, device, mode of use, and the materials or resources needed for each step.

---

## Resource Requirements

| # | Activity | Human (Skills & #) | Facility | Device | Mode of Use | Materials/Resources |
|---|---|---|---|---|---|---|
| **1. Requirements** | | | | | | |
| 1.1 | Identifying Product Owners | Informed (1 person) | Computer Lab | Computer | Onsite | MS Excel, Product owner list |
| 1.2 | Conducting Research & Observation | Researching Skills (1 person) | Home & Computer Lab | Laptop/Computer | Both | Articles, Related Studies, Sample Payroll Systems |
| 1.3 | Observing Previous Payroll & Attendance Process | Basic knowledge of payroll/attendance systems (1 person) | School (Finance Office & ITS/CCS Office) | Laptop/smartphone | Onsite | Notebook, pen, insights from Finance Office staff, previous payslips & payroll records |
| 1.4 | Reviewing Government & Legal Compliance | Knowledgeable in payroll/legal compliance & data privacy (1 person) | Home | Laptop | Online | RA 8515 (13th month), RA 11199 (SSS), RA 10963 (TRAIN), RA 10173 (Data Privacy Act), RR 11-2018 (de minimis) |
| 1.5 | Analyzing & Defining System Requirements | Documentation & Designing Skills (1 person) | Home | Laptop | Online | Previous System Documentations (SDP and SRS) |
| **2. Design** | | | | | | |
| 2.1 | Designing System Modules | Designing Skills (1 person) | Home/Computer Lab | Laptop/Computer | Both | Design tools like Figma, Design Modules for Guide |
| 2.2 | Designing System Diagrams | Designing Skills (1 person) | Home | Laptop | Online | DFD / ERD Templates, Diagramming Tools like Lucidchart |
| 2.3 | Finalizing Database Schema | Skilled in Database Design (1 person) | Home | Laptop | Online | Normalization Guidelines, JSON structure of `server/db/db.json`, Lucidchart |
| 2.4 | Presenting Diagrams and Prototypes | Presentation Skills (1 person) | Computer Lab | Computer, Projector | Onsite | Link from Figma |
| **3. Development** | | | | | | |
| 3.1 | Core Setup: Login & Auth (RBAC, 3 roles) | Programming Skills (1 person) | Home/Computer Lab | Laptop/Computer | Both | Source Code: `public/js/core.js`, `auth.js`, `public/index.html`, `server/server.js`, package.json |
| 3.2 | User Management & HRIS Sync | Programming Skills (1 person) | Home/Computer Lab | Laptop/Computer | Both | Source Code: `public/js/deductions.js`, `server/hris-mock.js`, HRIS API scripts (`/api/hris/sync`) |
| 3.3 | Payroll Calculation Engine (SSS/PhilHealth/Pag-IBIG/BIR/13th month) | Programming Skills (1 person) | Home/Computer Lab | Laptop/Computer | Both | Source Code: `public/js/payroll.js`, government deduction tables (SSS 63 brackets, PhilHealth 5%, Pag-IBIG cap, TRAIN brackets) |
| 3.4 | Employee Self-Service: Dashboard, Digital Payslip & PDF | Programming Skills (1 person) | Home/Computer Lab | Laptop/Computer | Both | Source Code: `public/js/employees.js`, `auth.js`, payslip rendering, print/PDF |
| 3.5 | Reports & Analytics (Summary, Gov Contribution, Charts) | Programming Skills (1 person) | Home/Computer Lab | Laptop/Computer | Both | Source Code: `public/js/reports.js`, SVG chart rendering, export logic |
| 3.6 | Bonus & Deduction Table Management (13th month, custom bonuses) | Programming Skills (1 person) | Home/Computer Lab | Laptop/Computer | Both | Source Code: `public/js/bonus.js`, `deductions.js`, RA 8515 rules |
| **4. Testing** | | | | | | |
| 4.1 | Unit Testing | Testing Skills (1 person) | Computer Lab | Computer | Onsite | Source code files (`public/js/*`), checklist/notes, `node --check`, manual observation |
| 4.2 | Integration Testing (Frontend↔REST API↔JSON DB) | Testing Skills (1 person) | Computer Lab | Computer | Onsite | Source code files, API scripts, checklist/notes, manual observation, browser DevTools |
| 4.3 | System Testing | Testing Skills (1 person) | Computer Lab | Computer | Onsite | Complete source code, checklist, manual observation, access to `server/db/db.json`, revised mockups/design documents |
| 4.4 | User Acceptance Testing (UAT) | Testing Skills (1 person) | School | Laptop/Computer | Online | Google Forms, ISO and TAM evaluation results |
| 4.5 | Performance Testing | Testing Skills (1 person) | Computer Lab | Laptop/Computer | Onsite | Manual observation, browser DevTools (network/latency) |
| 4.6 | Security Testing | Testing Skills (1 person) | Computer Lab | Laptop/Computer | Onsite | Manual observation, RBAC check, Data Privacy (RA 10173) checklist |
| **5. Deployment** | | | | | | |
| 5.1 | Final System Testing, Fixes, Deployment, User Training, Documentation Signing | Testing Skills (1 person) | School (Finance Office / ITS) | Computer | Onsite | Access to the full system and its modules |
| **6. Review** | | | | | | |
| 6.1 | Review Meetings, Feedback Collection, Final Refinement | Project Management Skills (1 person) | Home/Computer Lab | Laptop/Computer | Both | Sprint Reports, progress updates |
| 6.2 | Post-Sprint: System monitoring, follow-up trainings, issue tracking, final documentation | Communication, Analysis & Planning Skills (1 person) | Home/Computer Lab | Laptop/Computer | Both | Feedback Forms or Survey Tools (Google Forms) |

---

## Summary

- **6 phases**: Requirements · Design · Development · Testing · Deployment · Review
- **22 activities**
- **1 person** per activity (solo developer workflow)
- **Mode of use**: Onsite, Online, and Both (mixed team setup)
