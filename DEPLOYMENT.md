RCC-APS — Deployment Architecture \& CI/CD Documentation

Project: Republic Central Colleges — Automated Payroll System (RCC-APS)Application stack: Next.js (React + Node.js), ESLint, Jest/VitestDeployment platform: VercelCI/CD provider: GitHub Actions — configuration at .github/workflows/deploy.ymlProduction trigger: every push or merge to the main branch



1\. Overview

RCC-APS is a role-based payroll management web application for Republic Central Colleges. The system serves three user roles — Employee, Finance Officer, and System Administrator — and covers employee record management, attendance and hours-worked input, monthly payroll computation with statutory government contributions (SSS, PhilHealth, Pag-IBIG) and BIR withholding tax under the TRAIN law, configurable bonus types including 13th month pay, editable deduction rate tables, government contribution reports, an analytics dashboard, and printable payslip generation.



Because the application is dynamic and data-driven — role-based dashboards, CRUD operations, computed payroll records, and persistent storage — it requires server-side rendering, an API layer, and managed environment configuration rather than simple static file hosting. These characteristics shaped every deployment decision in this document. This write-up explains the platform we selected and why, the alternatives we evaluated and rejected, how our automated CI/CD pipeline works step by step, and the limitations of the chosen platform that we accept and monitor.



2\. Deployment Platform: Vercel — and Why

2.1 First-class fit with the Next.js stack

RCC-APS is built with Next.js, and Vercel is the platform created and maintained by the team that develops Next.js itself. This gives the application first-party support for every framework feature it depends on: App Router rendering, API route handlers executed as auto-scaled serverless functions, server-side rendering for role-aware dashboards, and built-in static asset optimization. No adapters, custom build rewrites, or runtime shims are required — Vercel detects the framework automatically and applies the correct build pipeline, which minimizes configuration drift between our local development environment and production.



This fit matters concretely for RCC-APS. Authentication with role-based redirects, the payroll computation endpoints, government contribution calculations, and employee CRUD APIs are implemented as Next.js API routes; on Vercel these deploy as managed serverless functions that scale with request volume without any infrastructure work from our team. Handling sensitive salary and personal data is also simplified: every deployment is served over HTTPS on Vercel's global edge network by default, so encryption in transit is guaranteed with zero certificate management on our side.



2.2 Cost justification

Vercel's Hobby tier is free and is what our deployment currently runs on, which is appropriate for an academic project. The Hobby tier is licensed for non-commercial use, so a real institutional rollout for the college would move to the Pro tier at roughly $20 per user per month — still dramatically cheaper than the self-managed alternative we priced. A Docker-based deployment on AWS ECS (Fargate) requires an always-on container task, an Application Load Balancer, container registry storage, and networking components; even a minimal setup lands in the range of $30–70 per month before data transfer costs, plus the engineering hours to build and maintain it. An on-premise server adds one-time hardware costs, electricity, a business internet line with a static IP, and replacement cycles.



The economics of serverless also match RCC-APS's usage pattern. A college payroll system is bursty by nature: heavy activity around monthly payroll runs (and especially the December run with 13th month pay), and light traffic in between. Serverless billing follows demand, so idle periods cost essentially nothing, unlike an always-on container or physical server that is paid for 24/7 regardless of load.



2.3 Scaling model

Vercel scales each API route and page horizontally and automatically: concurrent requests spawn additional serverless function instances, and traffic spikes are absorbed without capacity planning, load balancer configuration, or auto-scaling group tuning on our part. If the college's employee count grows, or if December's payroll season produces a burst of payslip generation and report requests, the platform handles the concurrency transparently. Scaling down is equally automatic, so we never pay for provisioned capacity that sits unused. This "scale to zero, scale to spike" behavior is the single biggest architectural advantage serverless offers for this workload.



3\. Alternatives Considered and Why They Were Rejected

3.1 Netlify

Netlify is an excellent platform for static sites and single-page applications, and its free tier is generous. However, Netlify hosts Next.js applications through a framework adapter rather than first-party support, which means the newest Next.js features can lag behind, and subtle runtime differences between local development and Netlify's adapter layer can appear. Since RCC-APS depends heavily on server-side rendering and API routes rather than static export, adopting Netlify would add adapter-mediated risk for no offsetting benefit over Vercel. Rejected: weaker Next.js integration for a dynamic, server-rendered application.



3.2 Cloudflare Pages / Workers

Cloudflare's edge network and pricing are genuinely attractive, and its free tier is one of the most generous available. The decisive problem is the runtime: Workers do not run full Node.js. They run Cloudflare's own JavaScript runtime with restricted APIs, so deploying a Next.js app requires an adapter (OpenNext for Cloudflare) and careful auditing of every dependency for runtime compatibility. A payroll system built on Node.js conventions risks incompatibilities in file handling, crypto usage, and Node APIs deep inside its computation and reporting libraries. Rejected: runtime compatibility risk for a Node.js-native stack outweighs the cost savings at our scale.



3.3 Docker + AWS ECS (Fargate)

Containerizing RCC-APS and running it on ECS would give us maximum control, infrastructure-as-code experience, and total portability — real engineering benefits worth learning. For this project, however, the operational burden is disproportionate: we would own the Dockerfile, image registry (ECR), task definitions, load balancer, VPC networking, IAM roles, health checks, and monitoring dashboards, all to run an application whose workload is small and periodic. The always-on cost (Section 2.2) buys nothing we need, and the maintenance surface multiplies the ways a student team's deployment can silently break. Rejected: operational overhead and baseline cost are unjustified for our team size and traffic profile.



3.4 On-premise / local server

Hosting the system on a campus server offers theoretical maximum data control, which has surface appeal for a system holding employee PII. In practice it requires always-on hardware, a publicly reachable static IP, power backup, OS patching, backup administration, and physical security — responsibilities that scale poorly for a small team. Availability becomes coupled to campus power and network, there is no elasticity for payroll-season spikes, and deployments would trend back toward manual uploads, which the project explicitly forbids. Rejected: reliability, maintenance burden, and incompatibility with automated delivery.



3.5 Decision summary

Criteria	Vercel	Netlify	Cloudflare Pages	Docker + ECS	On-prem

Cost at our scale	$0 (Hobby)	$0	$0	\~$30–70/mo	Hardware + utilities

Next.js SSR + API routes	First-party	Via adapter	Via adapter, non-Node runtime	Full (self-managed)	Full (self-managed)

Auto-scaling	Automatic	Automatic	Automatic	Manual config	None

Operational burden	Minimal	Minimal	Moderate	High	Very high

CI/CD friendliness	Excellent	Excellent	Good	Manual pipeline work	Manual

4\. The CI/CD Pipeline (GitHub Actions)

4.1 Trigger strategy

The pipeline lives in .github/workflows/deploy.yml and treats main as the single source of truth for production: every push or merge to main automatically runs the full pipeline, and manual runs are possible through workflow\_dispatch for testing purposes. Manual uploads to the hosting provider are never performed — the only path to production is a merge that passes the pipeline. A concurrency rule ensures that if several pushes land in quick succession, only the most recent deployment proceeds.



4.2 Job 1 — Continuous Integration (quality gate)

The first job installs, lints, and tests the application. actions/checkout clones the repository; actions/setup-node provisions Node.js 22 with an npm cache keyed on the lockfile for faster runs; npm ci performs a clean, reproducible dependency install strictly from package-lock.json; npm run lint enforces ESLint rules; and npm run test executes the Jest/Vitest suite in non-watch CI mode. If any of these steps fail — a lint violation, a failing test, an install error — the workflow stops immediately, and production is never touched.



4.3 Job 2 — Continuous Deployment (build and ship)

The deploy job declares needs: ci, so it physically cannot start unless the quality gate passed. It then uses the official Vercel CLI "prebuilt" flow in three steps. vercel pull downloads the project's production settings and environment variables from Vercel; vercel build --prod produces the framework-aware production build artifact; and vercel deploy --prebuilt --prod uploads that artifact and promotes it to the production environment. Building once and deploying the verified artifact (rather than letting the host rebuild from source) means what we validated is exactly what ships.



4.4 Secrets and credential handling

The pipeline authenticates to Vercel through three GitHub Actions repository secrets: VERCEL\_TOKEN (a personal access token), plus VERCEL\_ORG\_ID and VERCEL\_PROJECT\_ID (identifiers read from the project's .vercel/project.json after linking). Secrets are injected at runtime and are never committed to the repository. Because the two IDs are provided as environment variables, the runner does not need a checked-in .vercel directory, keeping the repo clean.



5\. Limitations of the Chosen Platform

License and usage caps on the free tier. The Hobby tier is non-commercial; a production rollout for the college requires the Pro tier, and free-tier quotas (bandwidth, function execution windows, limited scheduled/cron jobs) are generous for a class project but would need review under institutional load.



Serverless execution constraints. Vercel functions are stateless and time-limited: no long-running background processes or persistent WebSocket servers. Payroll computation for a college-sized employee roster completes in seconds, so this is acceptable today; a much larger organization would need to chunk batch runs or offload them to a queue-based worker.



Cold starts. Functions invoked after idle periods pay a small startup latency. For an internal payroll tool this is invisible in practice, but it is a real characteristic of the model.



Vendor lock-in. The convenience of Vercel's deep Next.js integration is also a coupling risk. We mitigate this by sticking to standard Next.js APIs: the application remains deployable on any Node.js host (including Docker/ECS) if we ever need to leave.



Limited infrastructure control. We cannot tune the OS, network topology, or function runtime internals, and advanced data-residency or VPC isolation requirements would push us toward Enterprise-tier features — relevant if compliance rules around employee PII tighten.



6\. Rollback, Monitoring, and Future Improvements

Every push to main produces an immutable, individually addressable deployment, which makes recovery straightforward: if a bad release reaches production, the previous deployment can be promoted back instantly from the Vercel dashboard — no rebuild required. Runtime errors and function logs are inspectable in Vercel's dashboard, while build, lint, and test outcomes are visible in the GitHub Actions tab and on each commit's status.



Three improvements are planned as the project matures. First, pull-request preview deployments, so every feature branch gets its own live URL for review before merge. Second, an end-to-end smoke test inside the pipeline (login → compute sample payroll → view payslip) executed against the fresh deployment before promotion. Third, a custom domain with additional hardening, and scheduled database backups, as the system moves from academic deployment toward institutional use.

