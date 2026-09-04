# RCC-APS — History Updates

> **Republic Central Colleges — Automated Payroll System**
> Talaan ng lahat ng pagbabago/pag-unlad ng system at documentation.
> Format: pinakabago sa itaas (reverse chronological). Nag-a-update tayo dito
> kada tapos ng task bago mag-commit sa GitHub.

---

## Log Format

| Date | Update | Details / Files Changed | Committed? |
|---|---|---|---|

---

## History

### Sep 5, 2026 — MySQL Migration (JSON → Relational Database)
- Lumipat ang persistence mula `server/db/db.json` patungong **MySQL relational tables**
  (`rcc_aps` database, MariaDB 10.4 sa XAMPP)
- 16 tables: `users`, `auth`, `profiles`, `cash_advances`, `bonus_types`,
  `bonus_payouts`, `deduction_categories`, `payroll_records`, `sss_table`,
  `phil_data`, `pag_data`, `bir_table`, `app_config`, `leave_types`,
  `leave_records`, `attendance`
- Bagong files: `server/db/sql/schema.sql`, `server/migrate-db.js`, `server/db.js`
- Bagong endpooint: `GET /api/db/status` (MySQL health + table counts)
- Migration script: `npm run migrate-db` (idempotent, transactional)
- DB config sa env vars: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  (default: localhost / root / (empty) / rcc_aps)
- Frontend ay hindi kailangang i-rewrite — ang `/api/data` bridge ay MySQL-backed
  na at shape-compatible; validated end-to-end (login page renders, HRIS sync,
  employees, leaves, full state round-trip)
- Rollback point: `git tag backup-before-mysql-migration`
- Commits: `b325675`, `98ec820`

### Aug 15, 2026 — Capstone Docs Added

### Aug 15, 2026 — Capstone Docs Added
- Resource Requirements (WBS table) — `capstone-resource-requirements.md`
- RAM feed (DACI matrix) — `capstone-ram-feed.md`
- PPA feed (9 potential problems) — `capstone-ppa-feed.md`
- POA feed (7 opportunities; inalis ang #4 Showcase to SHS) — `capstone-poa-feed.md`
- Letter of Transmittal template — `capstone-letter-of-transmittal.md`
- Commit: `a0d53d8`

### Aug 15, 2026 — Payslip Bug Fixes + Dynamic Employee Dashboard
- Na-fix ang double-counting ng 13th month sa gross
  (Nash ₱135k → ₱90k, John ₱114k → ₱76k sa Monthly Report)
- Dynamic Employee Dashboard: hero stats, stat cards, Recent Payslips —
  galing na sa aktwal na payroll records imbes na static
- Dynamic year dropdown sa payslip list (Employee / Finance / Admin)
- Rewrite ng viewPayslipDetail: gumagamit na ng stored values (no recompute)
- Inalis ang dead code: `payslips` array, `renderEmpPayslips`,
  `downloadPayslip`, `renderMyPayslips`, `payslipPeriods`
- Cache version bumped (index.html)
- Commit: `c5d8693`

### Aug 14, 2026 — Initial Commit
- Buong system: Node.js + Express backend, JSON db, 3 role portals
- Kasama ang capstone docs: usecase, activity, screen-flow, ERD,
  datastructures, sitemap, process-flow, modules
- Commit: `ceb3bd6`

---

## Future Updates (para sa susunod na session)

- [ ] I-verify ang final RAM output ng AI
- [ ] I-verify ang PPA output ng AI
- [ ] I-verify ang POA output ng AI
- [ ] Punuan ang Letter of Transmittal (adviser name, address, course/year)
- [ ] I-verify na maayos ang MySQL config sa ibang machine (START.bat)
- [ ] Idagdag ang mga susunod na tasks dito
