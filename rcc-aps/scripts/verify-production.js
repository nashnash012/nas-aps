'use strict';
const fs = require('node:fs');
async function main() {
  if (!process.env.PRODUCTION_URL) throw new Error('Set repository Actions variable PRODUCTION_URL to your public Vercel URL.');
  const base = new URL(process.env.PRODUCTION_URL);
  if (base.protocol !== 'https:') throw new Error('PRODUCTION_URL must use HTTPS.');
  const revision = process.env.GITHUB_SHA;
  if (!revision) throw new Error('GITHUB_SHA is required to verify the deployed source.');
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(new URL('/api/health', base), {cache:'no-store', signal:AbortSignal.timeout(8000)});
      const health = await response.json();
      if (response.ok && health.status === 'ok' && health.database === 'PostgreSQL' && health.revision === revision) {
        const page = await fetch(base, {signal:AbortSignal.timeout(8000)});
        if (!page.ok || !/<html/i.test(await page.text())) throw new Error('Production HTML did not load.');
        const summary = `Production verified: ${base.origin}\nSource revision: ${revision}\n\nHTTP checks passed. Verify authenticated database access and payroll flows separately.\n`;
        console.log(summary);
        if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
        return;
      }
    } catch { /* A deployment may still be building; retry within the time limit. */ }
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  throw new Error('Production did not serve this revision within 10 minutes. Check Vercel Git integration, build logs, deployment protection, and PRODUCTION_URL.');
}
main().catch(error => {console.error(error.message);process.exitCode=1;});
