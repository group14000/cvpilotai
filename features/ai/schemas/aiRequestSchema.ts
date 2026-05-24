import { z } from 'zod';

// ─── POST /api/v1/resumes/[id]/optimize request body ─────────────────────────

/**
 * Validates the incoming request body for the AI optimization endpoint.
 *
 * min(50): prevents trivial/accidental submissions
 * max(10000): API-layer guard against absurdly large inputs
 *   (the sanitizer further truncates to 8,000 chars at the service layer)
 */
export const optimizeResumeRequestSchema = z.object({
  jobDescription: z
    .string()
    .min(50, 'Job description must be at least 50 characters')
    .max(10000, 'Job description must not exceed 10,000 characters')
    .trim(),
});

export type OptimizeResumeRequestInput = z.infer<
  typeof optimizeResumeRequestSchema
>;
