/**
 * exportService.ts
 *
 * Server-side PDF generation using Playwright (Chromium headless).
 *
 * Architecture:
 *   Rather than rendering templates server-side with react-dom/server
 *   (which is restricted in Next.js App Router), Playwright navigates to the
 *   existing print route (/resume/[id]) using the authenticated user's session
 *   cookies forwarded from the incoming API request.  The print route handles
 *   auth, DB fetch, and template rendering — Playwright simply captures it as
 *   a PDF.
 *
 * Cookie forwarding:
 *   The export API route passes the raw Cookie header from the original
 *   browser request.  Playwright sets those cookies on its browser context
 *   before navigation, so Clerk auth succeeds on the print route.
 *
 * Performance:
 *   Each call launches and closes a full Chromium instance (~200–800 ms).
 *   The API rate limit (5 exports / hour / user) prevents abuse.
 *
 * Deployment notes:
 *   - Local dev: uses the Chromium binary downloaded by `playwright install`.
 *   - Vercel/serverless: replace chromium.launch() with @sparticuz/chromium
 *     + playwright-core when the default binary is unavailable.
 */

import { chromium } from 'playwright';

// ─── generateResumePdf ────────────────────────────────────────────────────────

/**
 * Navigate to the given print route URL in headless Chromium and capture
 * an A4 PDF.  The user's session cookies are forwarded so the print route
 * can authenticate via Clerk.
 *
 * @param printUrl      - Full URL of the print route (e.g. http://localhost:3000/resume/cuid...)
 * @param cookieHeader  - Raw value of the Cookie header from the original request
 * @returns             - PDF binary as a Node.js Buffer
 *
 * @throws              - Re-throws Playwright errors (launch failure, timeout, auth failure)
 */
export async function generateResumePdf(
  printUrl: string,
  cookieHeader: string
): Promise<Buffer> {
  const browser = await chromium.launch({ headless: true });

  try {
    // ── Parse and forward session cookies ───────────────────────────────────
    // Split the Cookie header (";"-separated key=value pairs) and inject them
    // into the Playwright browser context so Clerk session validation succeeds
    // when the print route calls auth().
    const domain = new URL(printUrl).hostname;

    const playwrightCookies = cookieHeader
      .split(';')
      .map((pair) => pair.trim())
      .filter((pair) => pair.includes('='))
      .map((pair) => {
        const eqIdx = pair.indexOf('=');
        const name = pair.slice(0, eqIdx).trim();
        const value = pair.slice(eqIdx + 1).trim();
        return { name, value, domain, path: '/' };
      });

    const context = await browser.newContext();

    if (playwrightCookies.length > 0) {
      await context.addCookies(playwrightCookies);
    }

    const page = await context.newPage();

    // Set viewport to A4 width at 96 dpi: 794 × 1123 px
    await page.setViewportSize({ width: 794, height: 1123 });

    // Navigate to the print route.  waitUntil: 'networkidle' ensures the
    // template is fully rendered and any web fonts have loaded.
    await page.goto(printUrl, { waitUntil: 'networkidle' });

    // Switch to print media so @media print rules apply (the print route
    // already sets @page { size: A4; margin: 0 }).
    await page.emulateMedia({ media: 'print' });

    // Capture the PDF.
    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return Buffer.from(pdfBytes);
  } finally {
    // Always close the browser — even if an error occurs during rendering.
    await browser.close();
  }
}
