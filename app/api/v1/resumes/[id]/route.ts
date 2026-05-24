import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import {
  resumeListLimiter,
  resumeUpdateLimiter,
  resumeDeleteLimiter,
} from '@/lib/ratelimit/limiters';
import { updateResumeSchema } from '@/features/resume/schemas/resumeSchema';
import {
  getResumeById,
  updateResume,
  deleteResume,
} from '@/features/resume/services/resumeService';

// ─── Shared helper: resolve Clerk userId → DB user.id ─────────────────────────

async function resolveDbUser(clerkUserId: string) {
  return prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
}

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    const dbUser = await resolveDbUser(userId);
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

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

// ─── PATCH /api/v1/resumes/[id] ───────────────────────────────────────────────
// Update resume content (and optional title) for the authenticated user.
//
// Request body: { data: ResumeData, title?: string }
// Response 200: { success: true, data: { resume: ResumeUpdatedResponse }, message }
//
// Auth:       Clerk (userId required)
// Rate limit: 10 updates / minute / user
// Validation: Zod (updateResumeSchema)
//
// Ownership:
//   updateResume() verifies ownership via findFirst before the update.
//   "Resume not found" is returned for both missing and not-owned cases.
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: Request,
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
      await resumeUpdateLimiter.limit(userId);
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

    // ── 4. Parse & validate request body ─────────────────────────────────
    const body: unknown = await request.json();
    const parsed = updateResumeSchema.safeParse(body);
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

    const { data, title } = parsed.data;

    // ── 5. Resolve Clerk userId → DB User ─────────────────────────────────
    const dbUser = await resolveDbUser(userId);
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    // ── 6. Update resume (service layer) ─────────────────────────────────
    const resume = await updateResume(id, dbUser.id, { data, title });

    return NextResponse.json({
      success: true,
      data: { resume },
      message: 'Resume updated successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Resume not found') {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    console.error('[PATCH /api/v1/resumes/:id]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/v1/resumes/[id] ─────────────────────────────────────────────
// Hard-delete a resume owned by the authenticated user.
//
// Response 200: { success: true, message: "Resume deleted" }
// Response 404: { success: false, error: "Resume not found" }
//
// Auth:       Clerk (userId required)
// Rate limit: 10 deletes / minute / user
//
// Ownership:
//   deleteResume() uses deleteMany({ where: { id, userId } }) in one atomic
//   DB round-trip.  Returns false for both missing and not-owned — mapped
//   to 404 to prevent ID enumeration.
//
// Hard delete for MVP.  Future soft-delete: change deleteResume() service
// only — this route handler stays unchanged.
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(
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
      await resumeDeleteLimiter.limit(userId);
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
    const dbUser = await resolveDbUser(userId);
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    // ── 5. Delete resume (service layer) ─────────────────────────────────
    const deleted = await deleteResume(id, dbUser.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    console.error('[DELETE /api/v1/resumes/:id]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
