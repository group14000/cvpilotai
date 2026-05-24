import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { aiOptimizeLimiter } from '@/lib/ratelimit/limiters';
import { optimizeResumeRequestSchema } from '@/features/ai/schemas/aiRequestSchema';
import { optimizeResume } from '@/features/ai/services/resumeOptimizationService';
import {
  AiEmptyResponseError,
  AiParseError,
  AiValidationError,
} from '@/features/ai/types';
import {
  UnauthorizedResponseError,
  PaymentRequiredResponseError,
  NotFoundResponseError,
  BadRequestResponseError,
  TooManyRequestsResponseError,
  ProviderOverloadedResponseError,
  ServiceUnavailableResponseError,
  InternalServerResponseError,
  BadGatewayResponseError,
  RequestTimeoutResponseError,
  EdgeNetworkTimeoutResponseError,
  OpenRouterError,
} from '@openrouter/sdk/models/errors';

// ─── POST /api/v1/resumes/[id]/optimize ──────────────────────────────────────
// Run AI-powered resume optimization against a job description.
//
// Request body: { jobDescription: string (50–10,000 chars) }
//
// Response 200: { success: true, data: { optimization: PendingAiOptimization }, message }
// Response 400: validation failure or "no optimizable content"
// Response 401: unauthenticated
// Response 404: resume not found / not owned
// Response 422: AI parse/validation failure
// Response 429: rate limited
// Response 503: AI service unavailable
// Response 504: gateway timeout
//
// Auth:       Clerk (userId required)
// Rate limit: 5 AI optimizations / hour / user (sliding window)
// Ownership:  optimizeResume() calls getResumeById(id, dbUser.id) — compound WHERE
//
// IMPORTANT: This route makes NO DB writes. The AI result is returned to the
// client. The user reviews the diff and applies changes via Zustand actions.
// Persisting to DB happens only when the user clicks "Save Changes" using
// the existing PATCH endpoint.
// ─────────────────────────────────────────────────────────────────────────────

async function resolveDbUser(clerkUserId: string) {
  return prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      await aiOptimizeLimiter.limit(userId);
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

    // ── 3. Validate param ────────────────────────────────────────────────────
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    // ── 4. Parse & validate request body ────────────────────────────────────
    const body: unknown = await request.json();
    const parsed = optimizeResumeRequestSchema.safeParse(body);
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

    // ── 5. Resolve Clerk userId → DB User ────────────────────────────────────
    const dbUser = await resolveDbUser(userId);
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 }
      );
    }

    // ── 6. Run AI optimization service ──────────────────────────────────────
    const optimization = await optimizeResume(
      id,
      dbUser.id,
      parsed.data.jobDescription
    );

    return NextResponse.json({
      success: true,
      data: { optimization },
      message: 'Resume optimized successfully',
    });
  } catch (error) {
    // ── Typed AI errors (thrown by resumeOptimizationService) ─────────────────
    if (error instanceof AiEmptyResponseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI service returned no content. Please try again.',
        },
        { status: 503 }
      );
    }

    if (error instanceof AiParseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI returned an unexpected response. Please try again.',
        },
        { status: 422 }
      );
    }

    if (error instanceof AiValidationError) {
      return NextResponse.json(
        {
          success: false,
          error:
            'AI response did not match expected structure. Please try again.',
        },
        { status: 422 }
      );
    }

    // ── OpenRouter SDK typed errors ────────────────────────────────────────────
    //
    // The SDK throws OpenRouterError subclasses — they extend Error but use
    // a `.statusCode` property and class identity rather than message patterns.
    // These must be caught BEFORE the generic `instanceof Error` branch below.

    if (error instanceof UnauthorizedResponseError) {
      // Invalid or missing OPENROUTER_API_KEY — server misconfiguration
      console.error(
        '[POST /api/v1/resumes/:id/optimize] OpenRouter auth error (check OPENROUTER_API_KEY)'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'AI service configuration error. Please contact support.',
        },
        { status: 503 }
      );
    }

    if (error instanceof PaymentRequiredResponseError) {
      // OpenRouter account out of credits
      console.error(
        '[POST /api/v1/resumes/:id/optimize] OpenRouter payment required (account out of credits)'
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'AI service is temporarily unavailable. Please try again later.',
        },
        { status: 503 }
      );
    }

    if (error instanceof NotFoundResponseError) {
      // Model not found on OpenRouter (wrong model name or model removed)
      console.error(
        '[POST /api/v1/resumes/:id/optimize] OpenRouter model not found:',
        error.statusCode
      );
      return NextResponse.json(
        {
          success: false,
          error: 'AI model is currently unavailable. Please try again later.',
        },
        { status: 503 }
      );
    }

    if (error instanceof BadRequestResponseError) {
      // Bad request sent to OpenRouter (prompt too long, malformed payload, etc.)
      console.error(
        '[POST /api/v1/resumes/:id/optimize] OpenRouter bad request:',
        error.statusCode
      );
      return NextResponse.json(
        {
          success: false,
          error: 'AI returned an unexpected response. Please try again.',
        },
        { status: 422 }
      );
    }

    if (
      error instanceof TooManyRequestsResponseError ||
      error instanceof ProviderOverloadedResponseError
    ) {
      // OpenRouter / upstream provider rate limited
      return NextResponse.json(
        {
          success: false,
          error:
            'AI service is temporarily busy. Please try again in a few minutes.',
        },
        { status: 503 }
      );
    }

    if (
      error instanceof ServiceUnavailableResponseError ||
      error instanceof InternalServerResponseError ||
      error instanceof BadGatewayResponseError
    ) {
      // OpenRouter / upstream provider offline
      return NextResponse.json(
        {
          success: false,
          error:
            'AI service is temporarily unavailable. Please try again later.',
        },
        { status: 503 }
      );
    }

    if (
      error instanceof RequestTimeoutResponseError ||
      error instanceof EdgeNetworkTimeoutResponseError
    ) {
      return NextResponse.json(
        { success: false, error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }

    // Catch any remaining OpenRouter SDK error not explicitly handled above
    if (error instanceof OpenRouterError) {
      console.error(
        '[POST /api/v1/resumes/:id/optimize] Unhandled OpenRouter error:',
        error.statusCode,
        error.constructor.name
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'AI service is temporarily unavailable. Please try again later.',
        },
        { status: 503 }
      );
    }

    // ── Business logic errors (thrown by service) ─────────────────────────────
    if (error instanceof Error) {
      if (error.message === 'Resume not found') {
        return NextResponse.json(
          { success: false, error: 'Resume not found' },
          { status: 404 }
        );
      }

      if (error.message === 'Resume has no optimizable content') {
        return NextResponse.json(
          {
            success: false,
            error:
              'This resume has no content to optimize. Please add some experience or summary text first.',
          },
          { status: 400 }
        );
      }

      // Network-level errors (fetch / DNS / connection refused)
      if (
        error.name === 'AbortError' ||
        error.message.toLowerCase().includes('timeout') ||
        error.message.toLowerCase().includes('failed to fetch') ||
        error.message.toLowerCase().includes('network')
      ) {
        return NextResponse.json(
          { success: false, error: 'Request timed out. Please try again.' },
          { status: 504 }
        );
      }
    }

    // ── Catch-all ─────────────────────────────────────────────────────────────
    // Log the error class name and message (never the full stack in prod)
    console.error(
      '[POST /api/v1/resumes/:id/optimize] Unexpected error:',
      error instanceof Error
        ? `${error.constructor.name}: ${error.message}`
        : String(error)
    );
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
