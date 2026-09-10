# RCC-APS — Automated Payroll System

**Republic Central Colleges (RCC)** — Web-based payroll system for employees, finance officers, and system administrators.

## Project Structure

```
rcc-aps/
├── public/                 # Frontend (static files)
│   ├── index.html          # Single-page application
│   ├── css/
│   │   └── style.css       # All styling
│   ├── js/                 # Application modules
│   │   ├── core.js         # State, persistence, auth constants, format helpers
│   │   ├── auth.js         # Login, profile, page navigation, payslip data
│   │   ├── employees.js    # Employee portal functions
│   │   ├── payroll.js      # Payroll calculator, records, users data
│   │   ├── reports.js      # Government contribution report, analytics
│   │   ├── bonus.js        # Bonus management (13th month, de minimis)
│   │   ├── deductions.js   # Deduction categories, user management, modals
│   │   └── ui.js           # Modal helpers, toasts
│   └── assets/             # Brand images (RCC / APS logos)
├── server/
│   ├── server.js           # Express server + REST API
│   ├── db.js               # MySQL data-access layer (assemble/persist state)
│   ├── migrate-db.js       # db.json -> MySQL migration script
│   ├── hris-mock.js        # Fallback HRIS demo data
│   └── db/
│       ├── db.json         # Legacy JSON export (source for `npm run migrate-db`)
│       └── sql/schema.sql  # MySQL relational schema (rcc_aps database)
└── package.json
```

## Requirements

- Node.js 18+ (comes with `npm`)
- MySQL / MariaDB (XAMPP default: `localhost:3306`, user `root`, no password)

## Database Setup (MySQL)

The RCC-APS stores all data in the `rcc_aps` MySQL database (16 relational
tables). First-time setup:

1. Start MySQL (XAMPP Control Panel → Start MySQL, or run `mysqld`).
2. Create the schema:
   ```bash
   mysql -u root < server/db/sql/schema.sql
   ```
3. (Optional) Import the legacy JSON data:
   ```bash
   npm run migrate-db
   ```

Database connection is configured through environment variables with these
defaults:

| Variable      | Default     |
|---------------|-------------|
| `DB_HOST`     | `localhost` |
| `DB_USER`     | `root`      |
| `DB_PASSWORD` | *(empty)*   |
| `DB_NAME`     | `rcc_aps`   |

## Running the System

```bash
npm install
npm start
```

Then open **http://localhost:3000**

The frontend keeps a copy of its state in `localStorage` and syncs it to MySQL
through the REST API at `/api/data`. If the server is not running, the app still
works fully from `localStorage`; when the server returns, the newer copy wins.

## Demo Accounts

| Role            | Email                   | Password      |
|-----------------|-------------------------|---------------|
| Employee        | employee@rcc.edu.ph    | employee123   |
| Finance Officer | finance@rcc.edu.ph     | finance123    |
| System Admin    | admin@rcc.edu.ph       | admin123      |

## API Endpoints

| Method | Endpoint          | Description                            |
|--------|-------------------|----------------------------------------|
| GET    | `/api/health`     | Server status                          |
| GET    | `/api/db/status`  | MySQL connection health + table counts |
| GET    | `/api/data`       | Full persisted application state       |
| POST   | `/api/data`       | Persist application state              |
| GET    | `/api/employees`  | List of employee records               |
| GET    | `/api/leaves`     | Leave types and records                |
| GET    | `/api/hris/sync`  | Sync employee/attendance/leave from HRIS (mock fallback) |

## Compliance Highlights

- **SSS** 2025 contribution table (employee share)
- **PhilHealth** 2025 rate (5%)
- **Pag-IBIG** 2025 table (employee share)
- **BIR Withholding Tax** — TRAIN Law (RA 10963) monthly/quarterly/annual tables
- **13th Month Pay** — RA 8515 (full withholding tax applied)
- **De Minimis Benefits** — BIR RR 11-2018 (tax-exempt, excluded from the ₱90,000 pool)
- **₱90,000 tax-exempt pool** — for 13th month and other benefits per TRAIN

See `RCC-APS_System_Modules_and_Features.docx` for the full module catalog.
