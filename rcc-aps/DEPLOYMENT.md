# RCC Automated Payroll System (RCC-APS) — Deployment Strategy

## 1. Project Overview

The RCC Automated Payroll System (RCC-APS) is a web-based payroll application for Republic Central Colleges. It helps manage payroll-related information, employee records, attendance, deductions, and other payroll data.

## 2. Deployment Platform

### Application Hosting: Vercel

Vercel was selected to host the web application and its API because it supports GitHub integration and automated deployments. It also provides environment variables for application configuration.

### Database Hosting: TiDB Cloud

TiDB Cloud is used to host the MySQL-compatible database. This allows the application to connect to a cloud database instead of relying on a local XAMPP installation.

### Reasons for This Choice

- **GitHub integration:** The project source code is stored in GitHub.
- **Automated deployment:** Vercel can deploy the application when changes are merged into the configured production branch.
- **Cloud database:** TiDB Cloud provides a database that can be accessed by the deployed application.
- **Environment variables:** Database connection details and authentication configuration can be stored outside the source code.
- **Cost:** Free-tier services are preferred for this academic project, subject to their usage limits and current service policies.
- **Scaling:** Vercel's serverless model scales automatically with traffic and scales to zero when idle, making it cost-efficient for a school project with sporadic usage. TiDB Cloud's serverless tier also scales compute resources based on load.

## 3. Application Configuration

The application uses environment variables for its database connection:

- `DB_HOST` — database server address
- `DB_PORT` — database server port
- `DB_USER` — database username
- `DB_PASSWORD` — database password
- `DB_NAME` — database name
- `TIDB_ENABLE_SSL` — enables SSL/TLS when configured as `true`
- `JWT_SECRET` — secret used for JSON Web Token authentication

These values must be configured in the hosting platform. Passwords and authentication secrets must not be committed to the Git repository.

## 4. Continuous Integration and Continuous Deployment (CI/CD)

GitHub Actions is used for Continuous Integration (CI). The workflow is stored in `.github/workflows/ci.yml`.

The workflow:

1. Checks out the repository.
2. Sets up Node.js 22.
3. Installs dependencies using `npm ci`.
4. Runs the project's smoke tests.
5. Reports whether the tests pass or fail.

The workflow runs on:

- Pushes to `main` and to `deployment/**` branches (so deployment prep work is tested before merging)
- Pull requests targeting `main`

Vercel is configured to use GitHub for deployment. Changes merged into the configured production branch can trigger a deployment. The production deployment should be verified after the build completes.

## 5. Deployment Procedure

1. Make and test code changes locally.
2. Commit and push the changes to a feature branch.
3. Open a pull request targeting `main`.
4. Check that the GitHub Actions workflow passes.
5. Review and merge the pull request.
6. Allow Vercel to build and deploy the production version.
7. Test the deployed application and verify its database connection.

## 6. Testing and Verification

Before considering deployment complete:

- Confirm that the Vercel build succeeds.
- Open the deployed application.
- Check that the API responds correctly.
- Verify that the application can connect to TiDB Cloud.
- Test login and important payroll functions using an authorized test account.
- Review deployment logs if any errors occur.

A successful build alone does not guarantee that login, database access, or all payroll functions work correctly.

## 7. Security Considerations

- Keep database credentials and `JWT_SECRET` private.
- Use HTTPS and secure database connections.
- Do not expose sensitive employee or payroll information.
- Use authorized accounts when testing.
- Avoid running database initialization or migration scripts in production without reviewing their effects and backing up important data.

## 8. Platform Limitations

While Vercel and TiDB Cloud are well-suited for this academic project, they have inherent limitations that should be acknowledged for any production-scale deployment.

### Vercel Limitations

- **Serverless function execution limit:** Each function invocation has a maximum execution time (10 seconds on the Hobby tier). Long-running operations such as bulk payroll imports or large report generation may time out and require chunking or background job processing.
- **Read-only filesystem:** The serverless runtime mounts the deployment as a read-only filesystem. Application code cannot write files at runtime (logs, caches, uploads must use external storage such as Vercel Blob or an S3-compatible service). This project's JWT middleware was adapted to use environment variables instead of writing a local secret file.
- **Cold start latency:** The first request after a period of inactivity may experience higher latency (typically 1-2 seconds) as the serverless function initializes.
- **Hobby tier limits:** The free tier is intended for non-commercial projects. For higher traffic or commercial use, the Pro tier is required. Build minutes and bandwidth are also capped on the Hobby tier.

### TiDB Cloud Limitations

- **Free tier capacity:** The free Serverless Tier has a fixed storage and compute allowance sufficient for development and small academic projects, but not for production-scale workloads with high concurrency.
- **Region availability:** The free tier is restricted to specific cloud regions. The project uses `ap-southeast-1` (Singapore), which adds slight latency for users connecting from other regions.
- **No direct shell access:** Unlike a self-hosted MySQL instance, there is no SSH or shell access to the database server. All operations must go through SQL queries or the TiDB Cloud web console.
- **Connection limits:** The number of concurrent connections is capped on the free tier, requiring careful connection management (connection pooling, short-lived connections) to avoid exhaustion.

### Combined Considerations

- Both platforms are cloud-managed, meaning outages or scheduled maintenance on Vercel or TiDB Cloud can affect availability without the team's control.
- Free tier features may change over time. A migration plan should exist in case a feature used by this project becomes paid-only.

## 9. Rejected Alternatives

During platform selection, several alternatives discussed in class were considered and rejected. The table below summarizes the comparison.

| Platform | Reason for Rejection |
|---|---|
| XAMPP / Local MySQL | Suitable only for local development. The database is bound to a single machine and cannot be accessed by the deployed Vercel function over the internet. Does not meet the deployment requirement of a live, publicly accessible application. |
| Render | Offers free-tier web service hosting, but free-tier instances spin down after 15 minutes of inactivity, causing 30-50 second cold starts on the next request. Less integrated with GitHub than Vercel for static/edge deployment workflows. |
| Railway | Provides easy full-stack deployment but the free trial expires quickly and the persistent free tier is limited. Lacks Vercel's mature edge network and automatic static asset optimization. |
| Heroku | Discontinued its free tier in November 2022. Monthly cost would be required for even a basic deployment, which is not justified for an academic project. |
| AWS EC2 / RDS | Powerful but requires significant operational overhead (security groups, IAM, patching, monitoring). Cost is usage-based and unpredictable for an academic budget. Overkill for a single-application deployment. |
| Google App Engine | Capable of hosting Node.js applications but configuration is more complex than Vercel. Free tier quotas are tighter than Vercel's for serverless function invocations. |
| Self-hosted MySQL on a VPS | Requires manual server administration, backups, security patching, and uptime monitoring. Not feasible within the scope of an academic assignment. |

Vercel and TiDB Cloud were selected because they offer the best combination of free-tier capacity, GitHub integration, and zero operational overhead for a Node.js + Express + MySQL stack deployed as a serverless function.

## 10. Production Deployment Notes

### Environment Variables

All seven environment variables listed in section 3 must be configured in the Vercel project (Settings → Environment Variables), each enabled for Production, Preview, and Development environments:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `TIDB_ENABLE_SSL` (TiDB connection)
- `JWT_SECRET` (JWT signing)

Missing `JWT_SECRET` causes the function to throw a clear error at startup. Without it, JWT-based authentication cannot work.

### Serverless-Specific Code Notes

Vercel's serverless runtime mounts the deployment as a read-only filesystem. Code must not write files at runtime. The JWT middleware (`server/middleware/jwt.js`) detects serverless environments via `process.env.VERCEL` and throws a clear error if `JWT_SECRET` is missing, instead of attempting to write a fallback file and crashing with `EROFS`. Local development still uses the lazy `.jwt-secret` file fallback.

### Verified Production Endpoint

- Production URL: `https://jhon-rcc-rcc-aps.vercel.app/`
- Verified: HTTP 200 OK, login page renders, TiDB-backed user profile data loads correctly.

The original `2b70212` deployment crashed with `FUNCTION_INVOCATION_FAILED` due to the EROFS error described above. The fix was landed in PR #2.

## 11. Deliverable URLs

### Deployed Application

- **Production URL:** https://jhon-rcc-rcc-aps.vercel.app/
- **Status:** Live, accessible 24/7, auto-deploys on every merge to `main`.

### Source Code Repository

- **Upstream (canonical):** https://github.com/jc-rcc/rcc-aps
- **Fork (deployment source):** https://github.com/JGerald18/jhon-rcc-rcc-aps
- **Production branch:** `main`

### CI/CD Configuration File

The GitHub Actions workflow that defines the CI pipeline is located at:

- **Direct link to `ci.yml`:** https://github.com/jc-rcc/rcc-aps/blob/main/.github/workflows/ci.yml
- **Workflow file path in repository:** `.github/workflows/ci.yml`
- **Workflow name (as defined in the file):** `RCC-APS CI`

### Vercel Project

- **Vercel dashboard:** https://vercel.com/jhon-batuaan-7148/jhon-rcc-rcc-aps
- **Production deployment:** Auto-built on every commit to `main`.

## 12. Architecture Justification

The RCC-APS deployment architecture follows a serverless, cloud-native pattern optimized for an academic project that must remain publicly accessible without ongoing infrastructure maintenance.

### Architecture Layers

1. **Presentation Layer (Frontend):** Static HTML, CSS, and JavaScript served by Vercel's edge network. The frontend uses vanilla JavaScript with no framework, communicating with the backend through `fetch` calls to `/api/*` endpoints.
2. **Application Layer (Backend):** Node.js + Express serverless function deployed as `api/index.js`. Each request is handled in an isolated function invocation. JWT-based authentication protects sensitive routes; a separate middleware enforces role-based access (admin, finance, employee).
3. **Data Layer:** MySQL-compatible database hosted on TiDB Cloud (Singapore region). The application connects using the `mysql2/promise` driver over TLS (TLSv1.2 minimum) for in-transit encryption. SQL queries use parameterized statements to prevent injection.

### Justification

- **Serverless over traditional server:** A persistent Node.js process (e.g., on an EC2 instance or VPS) would require continuous operation, monitoring, and cost. The serverless model scales to zero when idle, paying only for actual invocations. For a school project with sporadic traffic, this is significantly more cost-efficient.
- **Edge-hosted static assets:** Vercel automatically serves the frontend's static HTML/CSS/JS from a global edge CDN, reducing latency for users regardless of location. This is included at no additional cost on the Hobby tier.
- **Cloud database over local MySQL:** A self-hosted MySQL (XAMPP) would bind the database to the developer's machine, making the deployed application unable to reach it. TiDB Cloud provides a publicly reachable, MySQL-compatible endpoint with managed backups and SSL, satisfying both the access and security requirements.
- **GitHub-triggered CI/CD:** Every push or pull request runs an automated smoke-test suite via GitHub Actions. Only merges into `main` trigger a production deployment. This enforces a minimum quality gate (all tests must pass) before code reaches production, without requiring any manual deployment step.
- **Environment-variable configuration:** All credentials (database password, JWT secret, TiDB SSL toggle) are stored as Vercel environment variables encrypted at rest. No secrets are committed to the Git repository, and the same codebase runs identically in Preview and Production environments by switching only the environment variables.

### Request Flow

A typical request flow is:

1. User opens `https://jhon-rcc-rcc-aps.vercel.app/` in a browser.
2. Vercel's edge network serves the cached static HTML/CSS/JS.
3. The frontend JavaScript sends a `fetch` request to `/api/auth/login` (or other `/api/*` endpoint).
4. Vercel routes the request to the Node.js serverless function (`api/index.js`).
5. The function validates the request, executes the corresponding Express route handler, and queries the TiDB Cloud database over TLS.
6. The function returns a JSON response to the frontend.
7. The frontend updates the UI based on the response.

For authenticated requests, a JWT Bearer token (issued at login) is sent in the `Authorization` header. The `requireAuth` or `optionalAuth` middleware verifies the token before the route handler runs.

## 13. Conclusion

Vercel, GitHub Actions, and TiDB Cloud provide a cloud-based deployment approach for RCC-APS. GitHub Actions automates testing, while Vercel handles application deployment. TiDB Cloud provides the database service. The deployment must be tested to confirm that the application and database work correctly together.
