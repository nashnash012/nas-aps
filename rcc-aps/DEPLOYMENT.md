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

The workflow runs on pushes and pull requests targeting the `main` branch.

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

## 8. Conclusion

Vercel, GitHub Actions, and TiDB Cloud provide a cloud-based deployment approach for RCC-APS. GitHub Actions automates testing, while Vercel handles application deployment. TiDB Cloud provides the database service. The deployment must be tested to confirm that the application and database work correctly together.