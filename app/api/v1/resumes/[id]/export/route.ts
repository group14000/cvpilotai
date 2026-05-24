import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { resumeExportLimiter } from '@/lib/ratelimit/limiters';
import { getResumeById } from '@/features/resume/services/resumeService';
import { generateResumePdf } from '@/features/resume/services/exportService';

// ─── GET /api/v1/resumes/[id]/export ─────────────────────────────────────────
// Generate and download a PDF for the authenticated user's resume.
//
// Response:   binary PDF stream (application/pdf)
// Auth:       Clerk (userId required)
// Rate limit: 5 exports / hour / user  (Chromium launch is expensive)
//
// Why GET (not POST):
//   GET maps naturally to <a href download> anchor tags — the browser
//   triggers a native save-file dialog without any client JS required.
//   ExportButton also uses fetch + blob URL for the loading spinner UX.
//
// PDF pipeline:
//   1. Verify ownership via getResumeById()
//   2. Forward session cookies + print URL → Playwright headless Chromium
//   3. Playwright navigates to /resume/[id] (existing print route)
//   4. Print route handles auth, DB fetch, and template rendering
//   5. Playwright captures the rendered page as A4 PDF
//   6. Return binary response with Content-Disposition: attachment
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── 1. Authentication ──────────────────────────────────────────────────
    const { userId } = await auth();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── 2. Rate limiting ───────────────────────────────────────────────────
    const { success, reset } = await resumeExportLimiter.limit(userId);

    if (!success) {
      const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many requests. PDF export is limited to 5 per hour.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfterSeconds.toString(),
          },
        }
      );
    }

    // ── 3. Validate param ─────────────────────────────────────────────────
    const { id } = await params;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Resume ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── 4. Resolve Clerk userId → DB User ─────────────────────────────────
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!dbUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Resume not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── 5. Fetch resume with ownership enforcement ─────────────────────────
    const resume = await getResumeById(id, dbUser.id);

    if (!resume) {
      return new Response(
        JSON.stringify({ success: false, error: 'Resume not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── 6. Build the print route URL ──────────────────────────────────────
    // The print route is at /resume/[id] (route group "(print)" is invisible
    // in the URL).  We reconstruct the origin from the incoming request so
    // this works in all environments (localhost, staging, production).
    const origin = new URL(request.url).origin;
    const printUrl = `${origin}/resume/${id}`;

    // ── 7. Forward session cookies to Playwright ──────────────────────────
    // The print route uses Clerk auth(), which reads the session from cookies.
    // We pass the raw Cookie header from the original browser request so
    // Playwright's headless Chromium is seen as the authenticated user.
    const cookieHeader = request.headers.get('cookie') ?? '';

    // ── 8. Generate PDF via Playwright ────────────────────────────────────
    const pdfBuffer = await generateResumePdf(printUrl, cookieHeader);

    // ── 9. Sanitise title for use as a filename ───────────────────────────
    // Strip characters invalid in filenames across Windows / macOS / Linux.
    const safeTitle =
      resume.title.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim() || 'resume';

    // ── 10. Return binary PDF stream ──────────────────────────────────────
    // Node.js Buffer is a Uint8Array subclass; the Web Response API accepts
    // Uint8Array as BodyInit, so we slice to ensure a plain Uint8Array type.
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
        // Prevent caching — PDF reflects current resume state at export time
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[GET /api/v1/resumes/:id/export]', error);

    return new Response(
      JSON.stringify({ success: false, error: 'Failed to generate PDF' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
