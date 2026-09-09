# RCC-APS — Automated Payroll System

**Republic Central Colleges (RCC)** — Web-based payroll system for employees, finance officers, and system administrators.

## Project Structure

```
rcc-aps/
├── client/                 # React production app (Vite), full faithful UI
│   ├── src/
│   │   ├── api/            # Axios API layer (auth, data, leaves)
│   │   ├── components/     # Layout, Sidebar, Navbar, ui (Modal/Toast), ProtectedRoute
│   │   ├── hooks/          # useAuth (AuthProvider / JWT session)
│   │   ├── lib/            # Payroll math (ported from Vanilla JS — unchanged)
│   │   │   ├── payroll.js  # SSS/PhilHealth/Pag-IBIG/BIR, 13th Month, bonuses
│   │   │   └── utils.js    # Format helpers (₱, escaping)
│   │   ├── pages/          # admin/, finance/, employee/, shared pages
│   │   └── styles/         # style.css + responsive.css (the approved design)
│   ├── public/             # Brand images (RCC / APS logos)
│   ├── index.html
│   └── vite.config.js      # base '/', dev proxy /api → :3000, port 5173
├── server/
│   ├── server.js           # Express server + REST API + JWT-protected routes
│   ├── db.js               # MySQL data-access layer (assemble/persist state)
│   ├── migrate-db.js       # db.json -> MySQL migration (bcrypt-hashed auth)
│   ├── auth-router.js      # /api/auth login, me, change-password (JWT)
│   ├── middleware/jwt.js   # requireAuth / requireRole / JWT_SECRET
│   ├── hris-mock.js        # Fallback HRIS demo data
│   └── db/
│       ├── db.json         # Legacy JSON export (source for `npm run migrate-db`)
│       └── sql/schema.sql  # MySQL relational schema (rcc_aps database)
└── package.json
```

> `public_old/` (original Vanilla JS frontend — the panelist-approved design)
> is kept as a **backup only** at the repository root and is git-ignored.
> The live system is the React app above.

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

## Authentication (JWT)

The backend issues a signed JWT on login (`/api/auth/login`). The `/api/data`,
`/api/employees`, `/api/leaves`, `/api/leave-types`, `/api/leave-records` and
`/api/hris/sync` routes require a valid `Authorization: Bearer <token>` header
(401 otherwise); `/api/auth/*` and the health/status endpoints are public.
The React app attaches the token via an Axios interceptor and redirects to
`/login` on 401. Sessions expire after 8 hours.

Demo account passwords are stored as **bcrypt hashes**; legacy plain-text
passwords are auto-upgraded to hashes on first successful login.

## Running the System

### Production at :3000

```bash
npm install
npm --prefix client install
npm --prefix client run build   # compile React into client/dist (base /)
npm start                       # Express serves the React build at
                                # http://localhost:3000
```

The React build is served at the **root** (`http://localhost:3000`) — a full
faithful reproduction of the panelist-approved design. After any UI change,
rebuild with `npm --prefix client run build` so `client/dist` stays in sync.

### Development (Vite hot-reload, API proxied to :3000)

```bash
npm start                       # backend (API) on :3000
npm --prefix client run dev     # React app on http://localhost:5173
```

The frontend keeps a copy of its state in MySQL through the REST API at
`/api/data`.

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
| POST   | `/api/auth/login` | Log in → returns a JWT token          |
| GET    | `/api/auth/me`    | Current user from token (requires auth)|
| POST   | `/api/auth/change-password` | Change own password (requires auth)|
| GET    | `/api/data`       | Full persisted application state (requires auth) |
| POST   | `/api/data`       | Persist application state (requires auth)         |
| GET    | `/api/employees`  | List of employee records (requires auth)          |
| GET    | `/api/leaves`     | Leave types and records (requires auth)           |
| GET    | `/api/hris/sync`  | Sync employee/attendance/leave from HRIS (mock fallback, requires auth) |

## Compliance Highlights

- **SSS** 2025 contribution table (employee share)
- **PhilHealth** 2025 rate (5%)
- **Pag-IBIG** 2025 table (employee share)
- **BIR Withholding Tax** — TRAIN Law (RA 10963) monthly/quarterly/annual tables
- **13th Month Pay** — RA 8515 (full withholding tax applied)
- **De Minimis Benefits** — BIR RR 11-2018 (tax-exempt, excluded from the ₱90,000 pool)
- **₱90,000 tax-exempt pool** — for 13th month and other benefits per TRAIN

See `RCC-APS_System_Modules_and_Features.docx` for the full module catalog.
