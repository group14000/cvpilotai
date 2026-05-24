import type { DescriptionBlock } from '@/types/resume';
import type { AiOptimizationResponse } from '../schemas/aiResponseSchema';

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type { AiOptimizationResponse };

// ─── Zustand AI optimization state types ─────────────────────────────────────

/**
 * The pending AI suggestions stored in the Zustand store while the user
 * reviews the diff view. This mirrors AiOptimizationResponse but uses
 * proper DescriptionBlock[] instead of the raw AI schema types.
 *
 * The service layer converts AI schema types → these store-compatible types
 * (generating proper crypto.randomUUID() ids) before returning.
 */
export type PendingAiOptimization = {
  optimizedSummary: string;
  optimizedExperiences: Array<{
    id: string;
    description: DescriptionBlock[];
  }>;
  optimizedProjects: Array<{
    id: string;
    description: DescriptionBlock[];
  }>;
  suggestedSkills: Array<{
    name: string;
    proficiency: string;
    reason: string;
  }>;
  analysis: {
    extractedKeywords: string[];
    matchedKeywords: string[];
    missingKeywords: string[];
    atsScore: number;
    seniorityLevel: string;
    improvementSuggestions: string[];
  };
};

/**
 * Tracks whether the user has accepted, rejected, or not yet acted on
 * each optimizable section in the pending AI result.
 *
 * `experiences` and `projects` are keyed by their existing item ids.
 * `summary` and `skills` are treated as single accept/reject units.
 */
export type SectionStatus = 'pending' | 'accepted' | 'rejected';

export type SectionAcceptanceMap = {
  summary: SectionStatus;
  experiences: Record<string, SectionStatus>;
  projects: Record<string, SectionStatus>;
  skills: SectionStatus;
};

/**
 * The complete AI optimization state slice stored in the Zustand store.
 * Null when no optimization is in progress (initial state or after clearing).
 */
export type AiOptimizationState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  pending: PendingAiOptimization | null;
  sectionAcceptance: SectionAcceptanceMap | null;
} | null;

// ─── Typed error classes ──────────────────────────────────────────────────────

/** AI returned an empty or null `choices[0].message.content`. */
export class AiEmptyResponseError extends Error {
  constructor() {
    super('AI service returned no content');
    this.name = 'AiEmptyResponseError';
  }
}

/** AI returned content that was not valid JSON. */
export class AiParseError extends Error {
  constructor(contentLength: number) {
    super(`AI response could not be parsed as JSON (length: ${contentLength})`);
    this.name = 'AiParseError';
  }
}

/** AI returned valid JSON but it did not match the expected Zod schema. */
export class AiValidationError extends Error {
  constructor(issuesSummary: string) {
    super(`AI response failed schema validation: ${issuesSummary}`);
    this.name = 'AiValidationError';
  }
}
