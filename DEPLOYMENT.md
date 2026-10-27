# NAS-APS deployment strategy: Vercel + Supabase

## Status and deliverables

Code and configuration are prepared locally. **The NAS-APS Vercel project, Supabase database, live URL and GitHub Actions run are not yet provisioned or verified.** A classmate's deployment is not evidence for this project.

| Deliverable | Location / status |
| --- | --- |
| Live application | Pending setup and authenticated production testing |
| CI/CD configuration | [deploy.yml](https://github.com/nashnash012/nas-aps/blob/main/.github/workflows/deploy.yml) — available after these changes are pushed |
| Architecture document | [DEPLOYMENT.md](https://github.com/nashnash012/nas-aps/blob/main/DEPLOYMENT.md) — available after these changes are pushed |

## Architecture and infrastructure

The frontend is vanilla HTML/CSS/JavaScript in `rcc-aps/public`. A Node.js 22 Express API handles JWT authentication, bcrypt passwords, role checks and payroll persistence. `rcc-aps/api/index.js` exports the Vercel function. The current catch-all routing sends both API and static assets through Express; it does not publish static files through separate CDN-only routes.

```text
Browser -- HTTPS --> Vercel Express API -- verified TLS --> Supabase transaction pooler
                                                       --> PostgreSQL nas_aps schema
GitHub main --> Vercel Git integration --> install --> syntax/smoke tests --> publish
            --> Actions --> syntax/smoke + PostgreSQL integration tests
                        --> verify public HTML and exact deployed source revision
```

Vercel matches the existing Node handler and provides managed HTTPS, environment configuration and release history. Supabase provides managed PostgreSQL and a transaction pooler for serverless workloads. The `pg` driver connects directly from Express. Supabase Auth, browser database access, anon keys and service-role API keys are not required; existing application authentication remains in Express.

### PostgreSQL changes

The old MySQL dump cannot be imported directly. The new `rcc-aps/server/db/sql/postgres.sql` uses identity columns, quoted field names, foreign keys, unique payroll periods and case-insensitive email indexes. Queries use PostgreSQL placeholders and `ON CONFLICT`. Calendar dates remain strings, preserving existing frontend behavior.

State changes use a transaction-scoped advisory lock. Revision checks, reads, writes and password updates share one client until commit/rollback; stale submissions receive HTTP 409. Failed writes roll back. Read-only state snapshots use repeatable-read transactions. No named prepared statements or session locks are used. The pool is capped at three connections per warm function instance.

Tables live in the private `nas_aps` schema, with PUBLIC schema access revoked. Keep it outside Supabase's exposed Data API schemas. Credentials remain server-side. Use a dedicated database role with only required runtime privileges before broader institutional use.

### Cost, scaling and limitations

Eligible Vercel Hobby and Supabase Free plans are intended for a small non-commercial class demo, subject to current quotas and policies. This repository creates no paid resources. Check the dashboards before provisioning/upgrading; configure billing alerts and spending controls for any approved paid plan. Remove assignment resources after grading when no longer needed.

Function instances can scale, but every instance adds its own pool. Database compute, connections, storage, function duration and request payload limits remain constraints. The app reads broad state snapshots and serializes writes, limiting concurrent editing. Growth would need paginated endpoints, narrower transactions and object storage for photos. Serverless files are not durable storage; long-running jobs need a worker. Provider payload limits take precedence over Express's JSON limit. Internet/cloud availability and free-project inactivity policies can affect grading, so verify the deployment beforehand.

## Alternatives and trade-offs

| Alternative | Reason for this choice |
| --- | --- |
| Frontend-only Vercel/Netlify hosting | Payroll also requires a Node API, authentication and transactional storage. Vercel already supports the handler; moving to Netlify adds deployment adaptation. |
| Cloudflare Pages/Workers | Useful for static/edge traffic. Adapting conventional Node modules and SQL connectivity adds compatibility work without a measured edge requirement. |
| Docker + AWS ECS or VM | Useful for persistent processes, workers and custom dependencies. IAM, networking, patching and capacity management add operations and cost complexity for this single Node application. |
| Local/on-premise | Can suit private institutional tools, but a public class submission needs reliable uptime, HTTPS and networking beyond a developer laptop. |
| Managed MySQL/TiDB | Would preserve the original SQL dialect. Supabase is the chosen platform, so PostgreSQL conversion is an accepted implementation cost. |

## Automated CI/CD

Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Pushes to `main`, `codex/**`, `deployment/**` and pull requests to `main` run Actions.
2. Install Node.js 22 and locked dependencies with `npm ci`.
3. Run `npm run lint` for syntax checks and `npm test` for frontend/payroll and real HTTP smoke tests.
4. Run `npm run test:integration` against a disposable PostgreSQL 16 service. Tests cover setup, stable row IDs, rollback, constraints, role restrictions, passwords, Google authentication and concurrent saves. Fixtures refuse cloud hosts and create/drop only their own databases.
5. Vercel's connected Git integration automatically builds/deploys `main`. Its `vercel-build` script runs syntax/smoke tests before publication. No manual upload is used.
6. After Actions checks pass on `main`, the verification job waits for public `/api/health` to report the exact `GITHUB_SHA`, checks HTML and records URL/revision in the run summary. Missing `PRODUCTION_URL` fails with setup instructions.

Vercel and Actions start independently. **Vercel gates publication on its own syntax/smoke tests and does not automatically wait for Actions' database tests.** Require the Actions `checks` job before merging into `main` using branch protection where available, and release through pull requests. Routine deployments never seed/reset the database.

## One-time setup

### Supabase

1. Create a new NAS-APS Supabase project using synthetic demo data. Do not reuse the reference project's database.
2. In **Connect → Transaction pooler**, copy the PostgreSQL URI privately. Percent-encode special characters in the password. Keep the supplied database name, normally `postgres`; application tables are in schema `nas_aps`.
3. Copy `rcc-aps/.env.example` to `rcc-aps/.env`. Set `DATABASE_URL`, a long random `JWT_SECRET`, `DEMO_SETUP_CONFIRM=nas-aps` and three different demo passwords of at least 16 characters. Do not commit or share `.env`.
4. If needed, set `DATABASE_CA_CERT` to the Supabase root certificate PEM. Certificate verification remains enabled.
5. From `rcc-aps`, run `npm ci`, then `npm run db:bootstrap-demo`. This applies the schema, seeds an empty database and assigns bcrypt passwords to the demo accounts. Checked-in passwords are blank and cannot sign in before provisioning. Re-running bootstrap resets those three passwords intentionally; it is not a routine deployment step. Give evaluator credentials privately.

Existing XAMPP/MySQL records are not transferred by initialization. Back up and migrate them separately if required. Do not run the old MySQL `.sql` files in Supabase.

### Vercel and GitHub

1. Import **`nashnash012/nas-aps`** into your own Vercel account. Set Root Directory **`rcc-aps`**, framework Other, Node.js 22.x and production branch `main`.
2. Keep Git integration enabled. The Node builder installs dependencies and runs `vercel-build` automatically.
3. Set server-side Production variables **`DATABASE_URL`**, **`JWT_SECRET`**, and **`DATABASE_CA_CERT`** if needed. Do not add demo setup/password variables to runtime settings. Use a separate database for previews if enabling them.
4. Leave Google SSO disabled initially. The in-memory nonce store requires shared storage for reliable multi-instance operation; password login is the initial demo path. HRIS uses mock data when no integration is configured.
5. Copy the public Vercel URL. In GitHub repository Settings → Secrets and variables → Actions → **Variables**, add **`PRODUCTION_URL`** containing that HTTPS URL. No Vercel token is required with this Git integration approach.
6. Protect `main` with the `checks` job where available. Push/merge tested changes and verify Vercel and Actions complete automatically.

If Windows `npm` points to a broken per-user install, the bundled CLI can be invoked with `node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' ci`. `START.bat` now checks PostgreSQL configuration from `.env` before startup.

## Validation and recovery

Local validation on 27 October 2026: JavaScript syntax checks, all 14 smoke-test files, and both integration suites passed against an isolated PostgreSQL 18 test server. Integration coverage includes password/Google authentication, role scoping, transaction rollback and concurrent-save conflicts. GitHub Actions uses PostgreSQL 16; its remote run and the real Supabase/Vercel configuration remain unverified until setup and push.

- Open the public URL signed out; check HTML, CSS, JavaScript and logos.
- Log in as demo admin, finance and employee; verify restricted access and employee data scoping.
- Confirm authenticated `/api/db/status` returns PostgreSQL and `connected: true`.
- Exercise a small teaching-load/payroll example, refresh to verify persistence, print a payslip and export a report. Test concurrent edits for conflict handling.
- Retain a successful Actions run, Vercel deployment record and source revision. Public health verifies availability/revision, not database or payroll correctness.
- Revert bad code through Git and let it redeploy, or restore a known-good Vercel version. Code rollback does not restore data. Use PostgreSQL `pg_dump`/`pg_restore` via session/direct connection or a confirmed provider backup facility, and test restoration. Old MySQL backup/migration utilities are archival and must not be run against Supabase.
- Fill in the actual live URL and evidence in the submission table only after production checks pass.

## Reference and attribution

The PostgreSQL transaction layer, schema conversion, state writer, demo bootstrap and related tests were adapted from the user-provided [JC-APS reference repository](https://github.com/jc-rcc/jc-APS). NAS-APS uses its own repository, seed identities, private schema, hosting resources and validation results. The existing payroll application predates this deployment work. Acknowledge shared implementation according to course requirements.

Official references: [Vercel Git deployments](https://vercel.com/docs/git), [Vercel builds](https://vercel.com/docs/builds), [Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [node-postgres TLS](https://node-postgres.com/features/ssl).
