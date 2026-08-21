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
- [ ] Idagdag ang mga susunod na tasks dito
