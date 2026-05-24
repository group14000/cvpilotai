import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import {
  resumeCreateLimiter,
  resumeListLimiter,
} from '@/lib/ratelimit/limiters';
import { createResumeSchema } from '@/features/resume/schemas/resumeSchema';
import {
  createResume,
  listResumes,
} from '@/features/resume/services/resumeService';
import { syncUser } from '@/features/user/services/userService';

// ─── GET /api/v1/resumes ──────────────────────────────────────────────────────
// List all resumes for the authenticated user.
//
// Response 200: { success: true, data: { resumes: ResumeListItem[] } }
//
// Auth:       Clerk (userId required)
// Rate limit: 30 reads / minute / user (shared with GET /[id])
//
// User resolution:
//   If the DB user row doesn't exist yet, the user has no resumes —
//   return an empty list immediately without attempting sync.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
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

    // ── 3. Resolve Clerk userId → DB User ─────────────────────────────────
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    // User not yet synced → no resumes exist, return empty list
    if (!dbUser) {
      return NextResponse.json({ success: true, data: { resumes: [] } });
    }

    // ── 4. Fetch resume list (service layer) ───────────────────────────────
    const resumes = await listResumes(dbUser.id);

    return NextResponse.json({ success: true, data: { resumes } });
  } catch (error) {
    console.error('[GET /api/v1/resumes]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── POST /api/v1/resumes ─────────────────────────────────────────────────────
// Create a new resume for the authenticated user.
//
// Request body: { title, templateSlug, data: ResumeData }
// Response 201: { success: true, data: { resume }, message }
//
// Auth:       Clerk (userId required)
// Rate limit: 10 creates / minute / user
// Validation: Zod (createResumeSchema)
//
// User resolution strategy:
//   Try DB lookup first (fast path). If the user row doesn't exist yet
//   (e.g. first action after sign-up before /user/sync fires), call
//   syncUser() on-demand using Clerk's currentUser() data, then continue.
//   This makes the route self-healing — no pre-requisite sync call needed.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // ── 1. Authentication ────────────────────────────────────────────────────
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ── 2. Rate limiting ─────────────────────────────────────────────────────
    const { success, limit, remaining, reset } =
      await resumeCreateLimiter.limit(userId);

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

    // ── 3. Parse & validate request body ────────────────────────────────────
    const body: unknown = await request.json();
    const parsed = createResumeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { title, templateSlug, data } = parsed.data;

    // ── 4. Resolve Clerk userId → DB User (with on-demand sync) ─────────────
    //
    // Fast path: user row already exists (99% of requests after first login).
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    // Slow path: user hasn't been synced yet (first action after sign-up).
    // Fetch the full Clerk user and upsert into the DB — same logic as
    // /api/v1/user/sync — so this route is self-healing.
    if (!dbUser) {
      const clerkUser = await currentUser();

      if (!clerkUser) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const email = clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) {
        return NextResponse.json(
          { success: false, error: 'No email address found on Clerk account' },
          { status: 400 }
        );
      }

      const synced = await syncUser({
        clerkId: userId,
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      });

      dbUser = { id: synced.id };
    }

    // ── 5. Create resume (service layer) ─────────────────────────────────────
    const resume = await createResume({
      userId: dbUser.id,
      title,
      templateSlug,
      data,
    });

    // ── 6. Success response (201 Created) ────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        data: { resume },
        message: 'Resume created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    // Surface a 400 for known client errors (bad template slug)
    if (
      error instanceof Error &&
      error.message.startsWith('Unknown template slug')
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.error('[POST /api/v1/resumes]', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
