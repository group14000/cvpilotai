import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { resumeImportLimiter } from '@/lib/ratelimit/limiters';
import { importRequestSchema } from '@/features/resume/schemas/importRequestSchema';
import { importResume } from '@/features/resume/services/importService';
import {
  AiImportEmptyResponseError,
  AiImportParseError,
  AiImportValidationError,
  ResumeExtractionError,
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

// ─── POST /api/v1/resumes/import ─────────────────────────────────────────────
// Parse an uploaded PDF or DOCX resume file into the internal schema using AI.
//
// Request: multipart/form-data with a single "file" field (PDF or DOCX, max 5MB)
//
// Response 200: { success: true, data: { resume: ImportedResumeData }, message }
// Response 400: invalid file (type, size, magic bytes mismatch, no text)
// Response 401: unauthenticated
// Response 422: AI parse/validation failure or empty extracted text
// Response 429: rate limited (3 imports per hour)
// Response 503: AI service unavailable
// Response 504: gateway timeout
//
// Auth:       Clerk (userId required)
// Rate limit: 3 imports / hour / user (sliding window)
//
// IMPORTANT: This route makes NO database writes. The normalized resume data
// is returned to the client. The user reviews in the editor and saves explicitly
// using the existing POST /api/v1/resumes endpoint.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
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
      await resumeImportLimiter.limit(userId);
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Import limit reached. Please try again in 1 hour.',
        },
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

    // ── 3. Parse multipart form data ───────────────────────────────────────
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid form data' },
        { status: 400 }
      );
    }

    const fileValue = formData.get('file');

    // ── 4. Validate file (type + size) ────────────────────────────────────
    const parsed = importRequestSchema.safeParse({ file: fileValue });
    if (!parsed.success) {
      const firstError =
        parsed.error.flatten().fieldErrors.file?.[0] ?? 'Invalid file';
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const file = parsed.data.file;
    const arrayBuffer = await file.arrayBuffer();

    // ── 5. Import + normalize (extraction → AI → validation) ─────────────
    const resume = await importResume(arrayBuffer, file.type, userId);

    return NextResponse.json({
      success: true,
      data: { resume },
      message: 'Resume imported successfully',
    });
  } catch (error) {
    // ── Extraction errors ─────────────────────────────────────────────────
    if (error instanceof ResumeExtractionError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 422 }
      );
    }

    // ── Typed AI import errors ────────────────────────────────────────────
    if (error instanceof AiImportEmptyResponseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI service returned no content. Please try again.',
        },
        { status: 503 }
      );
    }

    if (error instanceof AiImportParseError) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI returned an unexpected response. Please try again.',
        },
        { status: 422 }
      );
    }

    if (error instanceof AiImportValidationError) {
      return NextResponse.json(
        {
          success: false,
          error:
            'AI response did not match expected structure. Please try again.',
        },
        { status: 422 }
      );
    }

    // ── OpenRouter SDK typed errors (same mapping as optimize route) ──────
    if (error instanceof UnauthorizedResponseError) {
      console.error('[POST /api/v1/resumes/import] OpenRouter auth error');
      return NextResponse.json(
        {
          success: false,
          error: 'AI service configuration error. Please contact support.',
        },
        { status: 503 }
      );
    }

    if (error instanceof PaymentRequiredResponseError) {
      console.error(
        '[POST /api/v1/resumes/import] OpenRouter payment required'
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
      return NextResponse.json(
        {
          success: false,
          error: 'AI model is currently unavailable. Please try again later.',
        },
        { status: 503 }
      );
    }

    if (error instanceof BadRequestResponseError) {
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

    if (error instanceof OpenRouterError) {
      console.error(
        '[POST /api/v1/resumes/import] Unhandled OpenRouter error:',
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

    // ── Business logic errors ─────────────────────────────────────────────
    if (error instanceof Error) {
      if (error.message.includes('too short to parse')) {
        return NextResponse.json(
          {
            success: false,
            error:
              'This file does not contain enough text to import. It may be a scanned image. Please upload a text-based PDF or DOCX.',
          },
          { status: 422 }
        );
      }

      if (
        error.name === 'AbortError' ||
        error.message.toLowerCase().includes('timeout') ||
        error.message.toLowerCase().includes('failed to fetch')
      ) {
        return NextResponse.json(
          { success: false, error: 'Request timed out. Please try again.' },
          { status: 504 }
        );
      }
    }

    // ── Catch-all ─────────────────────────────────────────────────────────
    console.error(
      '[POST /api/v1/resumes/import] Unexpected error:',
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
