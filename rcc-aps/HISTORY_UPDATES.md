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

### Sep 9, 2026 — Full Faithful React UI (ang React na mismo ang live system)
- Ang **React app (`client/`)** na ngayon ang live system at sineserve mismo sa
  **root** (`http://localhost:3000`) — full faithful restyle sa panelist-approved
  design: parehong `style.css` + `responsive.css` (inilipat sa
  `client/src/styles/`), parehong sidebar sections, topbar date chip,
  stat-cards, hero banners, tables, modals, at login screen (43% maroon panel).
- **Reversal ng serving setup:** Vite `base` pabalik sa `'/'`
  (`client/vite.config.js`), re-build ng `client/dist`; `server/server.js`
  ngayon sineserve `client/dist` sa root + SPA fallback, at bumalik ang
  **`requireAuth`** sa lahat ng `/api/*` (walang token → 401; tinanggal ang
  `optionalAuth`). Verified: `/` 200, `/api/data` nang walang token 401, may
  token 200, pagkatapos ng login OK.
- **Bagong pages na idinagdag** para match sa buong feature set ng original:
  `finance/Analytics.jsx` (cost trends, teaching vs non-teaching, 13th impact,
  govt summary), `pages/finance/FinanceDeductions.jsx` (4 agency tables + edit
  modals para sa SSS/PhilHealth/Pag-IBIG/BIR, working-days basis, deduction
  categories CRUD, leave types config, leave records CRUD, attendance + HRIS
  sync), `pages/ProfilePage.jsx` (shared My Profile), `pages/ChangePasswordPage.jsx`
  (shared Change Password), at **My Payslip** para sa finance/admin (reuse
  `PayslipViewer`).
- **Sidebar** per role na may sections na "Main Menu" at "My Employee Info".
- **Na-restyle** ang lahat ng 9 dating pages sa faithful markup: admin
  (Dashboard, User Management, Deduction Tables), finance (Dashboard, Payroll
  Calculator, Bonus Management, Reports na may landing + payroll summary +
  gov contribution sub-reports + CSV export), employee (Dashboard hero,
  Payslip Viewer na may official payslip document + signatures).
- **Backup:** inilipat ang `public_old/` (original Vanilla JS) mula
  `rcc-aps/` patungo sa repository root bilang git-ignored backup
  (idagdag ang `public_old/` sa `.gitignore`).
- **START.bat** na-update para sa bagong setup: hard block kung hindi
  ma-reach ang MySQL (kailangan na sa login at lahat ng data, wala nang
  localStorage fallback); auto-install ng React dependencies
  (`npm --prefix client install`) at auto-rebuild ng `client/dist`
  (`npm --prefix client run build`) kung kulang o outdated ang build —
  may per-file timestamp check (`dir /s /b` + `%%~tF` vs `dist\index.html`)
  at artifact verification pagkatapos ng install/build.
- Files: lahat ng `client/src/pages/**`, `client/src/components/{ui,Layout,
  Sidebar,Navbar}.jsx`, `client/src/App.jsx`, `client/LoginPage.jsx`,
  `client/vite.config.js`, `server/server.js`, `.gitignore`, `README.md`,
  `HISTORY_UPDATES.md`, `START.bat`; rebuilt: `client/dist`
- Commits: *(pending)*

### Sep 9, 2026 — Original Design Restored as Primary UI (panelist-approved look)
- Binalik ang **original Vanilla JS frontend** (`public_old/`) bilang pangunahing
  UI — sineserve na naman sa **root** (`http://localhost:3000`), ang eksaktong
  design na na-approve ng mga panelists. ZERO changes sa mismong app.
- Ang **React build** (`client/dist`) ay nanatili pero nilipat sa
  `http://localhost:3000/app` (bagong Vite `base: '/app/'` sa
  `client/vite.config.js`, ni-rebuild ang bundle)
- **Optional auth** sa `/api/data`, `/api/employees`, `/api/leaves`,
  `/api/hris/sync`, `/api/leave-types`, `/api/leave-records`: walang token →
  pinapayagan (gumagana ang orihinal na app); may mali/masamang token → 401;
  may valid token → authenticated (gumagana pa rin ang React app sa `/app`).
  Bagong middleware: `optionalAuth` sa `server/middleware/jwt.js`
- Tinanggal ang dating `/legacy` mount at ang root SPA fallback (ora lang sa
  `/app/*`)
- **MySQL backend + lahat ng data ay buo** — ang pagbabago ay nasa serving/auth
  lang, hindi sa data o sa original na design
- Edited: `server/server.js`, `server/middleware/jwt.js`,
  `client/vite.config.js`, `README.md`; rebuilt: `client/dist`
- Commits: *(pending)*

### Sep 9, 2026 — Frontend Rewrite (Vanilla JS → React + Tailwind) + JWT Auth
- Kumpletong rewrite ng frontend bilang **React.js + Vite + Tailwind CSS SPA** sa
  bagong `client/` folder (Plan Phase 2)
- 9 pages: Login, Admin (Dashboard, User Management, Deduction Tables), Finance
  (Dashboard, Payroll Calculator, Bonus Management, Reports), Employee
  (Dashboard, Payslip Viewer) — role-based routing via `ProtectedRoute`
- Ported ang lahat ng payroll math **walang pinagbago** galing
  `public_old/js/payroll.js` + `bonus.js` papunta `client/src/lib/payroll.js`:
  SSS bracket table, PhilHealth, Pag-IBIG, BIR TRAIN (RA 10963), 13th Month
  (RA 8515 / DOLE proration), de minimis, ₱90k tax-exempt pool
- Nahati ang lib bilang **pure functions** (walang DOM) — parehas na resulta
  sa DOM-driven na computation ng lumang app
- JWT authentication (complete end-to-end): `POST /api/auth/login` issues token,
  lahat ng `/api/data|employees|leaves|hris/sync` ay nangangailangan ng `requireAuth`
- Passwords: bcrypt hash sa DB, auto-upgrade ng legacy plain-text sa login
- Static serving: `client/dist` (React) sa root, `public_old/` backup sa
  `/legacy/`, + SPA fallback para sa client-side routes
- Dev: Vite port 5173, proxy `/api` → Express :3000
- New files: `client/` (buong React app); edited: `server/server.js`,
  `server/migrate-db.js`, `README.md`
- Commits: *(pending)*

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
