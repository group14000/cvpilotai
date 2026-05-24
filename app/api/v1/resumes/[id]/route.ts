import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { resumeListLimiter } from '@/lib/ratelimit/limiters';
import { getResumeById } from '@/features/resume/services/resumeService';

// ─── GET /api/v1/resumes/[id] ─────────────────────────────────────────────────
// Fetch a single resume by ID for the authenticated user.
//
// Response 200: { success: true, data: { resume: ResumeDetail } }
// Response 404: { success: false, error: "Resume not found" }
//
// Auth:       Clerk (userId required)
// Rate limit: 30 reads / minute / user (shared resumeListLimiter)
//
// Ownership:
//   getResumeById() combines id AND userId in a single WHERE clause.
//   A non-owner receives null — indistinguishable from "not found" —
//   which prevents ID enumeration attacks.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── 1. Authentication ──────────────────────────────────────────────────
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ── 2. Rate limiting ───────────────────────────────────────────────────
    const { success, limit, remaining, reset } =
      await resumeListLimiter.limit(userId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }

    // ── 3. Validate param ─────────────────────────────────────────────────
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    // ── 4. Resolve Clerk userId → DB User ─────────────────────────────────
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    // User not yet synced → they own no resumes
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    // ── 5. Fetch resume with ownership enforcement (service layer) ─────────
    const resume = await getResumeById(id, dbUser.id);

    if (!resume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { resume } });
  } catch (error) {
    console.error('[GET /api/v1/resumes/:id]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
