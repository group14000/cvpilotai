/**
 * Current resume optimization prompt version.
 *
 * Increment this string whenever the system prompt or user prompt template
 * changes in a way that affects AI output quality or schema expectations.
 *
 * This value is:
 *   1. Logged with every AI call for production observability
 *   2. Included in the AI cache key — changing the version automatically
 *      invalidates all cached responses from the previous prompt
 *   3. Stored in the future OptimizationHistory DB table for analytics
 */
export const RESUME_OPTIMIZATION_PROMPT_VERSION = 'v1' as const;

export type PromptVersion = typeof RESUME_OPTIMIZATION_PROMPT_VERSION;
