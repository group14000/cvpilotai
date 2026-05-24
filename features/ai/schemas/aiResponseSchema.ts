import { z } from 'zod';

// ─── AI Optimization Response Schema ─────────────────────────────────────────
//
// This schema is the CONTRACT between the AI prompt and the rest of the
// application. Every string field limit mirrors the constraints stated
// explicitly in the system prompt.
//
// Key design decisions:
//   - experiences/projects use IDs for matching back to Zustand store items
//   - AI only returns description text — never companyName, role, or dates
//   - suggestedSkills is separate from modified skills (no proficiency changes)
//   - analysisSchema uses z.number().int() for atsScore — clamped post-validation
// ─────────────────────────────────────────────────────────────────────────────

// ── Description block returned by AI ─────────────────────────────────────────
//
// AI reuses existing DescriptionBlock ids for modified bullets.
// New bullets use "new-1", "new-2", etc. as temporary ids.
// The service layer replaces all ids with crypto.randomUUID() after validation.

const aiDescriptionBlockSchema = z.object({
  id: z.string().min(1),
  content: z.string().min(1).max(500),
});

// ── Experience optimization (description only) ────────────────────────────────

const optimizedExperienceSchema = z.object({
  /** Must match an existing Experience.id in the resume — validated in service. */
  id: z.string().min(1),
  description: z.array(aiDescriptionBlockSchema).min(1).max(10),
});

// ── Project optimization (description only) ───────────────────────────────────

const optimizedProjectSchema = z.object({
  /** Must match an existing Project.id in the resume — validated in service. */
  id: z.string().min(1),
  description: z.array(aiDescriptionBlockSchema).min(1).max(8),
});

// ── Suggested new skill ───────────────────────────────────────────────────────

const suggestedSkillSchema = z.object({
  name: z.string().min(1).max(80),
  proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  /** Why this skill is suggested — shown to user in the diff view. */
  reason: z.string().max(200),
});

// ── ATS analysis ──────────────────────────────────────────────────────────────

const analysisSchema = z.object({
  extractedKeywords: z.array(z.string().max(60)).max(40),
  matchedKeywords: z.array(z.string().max(60)).max(40),
  missingKeywords: z.array(z.string().max(60)).max(30),
  /** Integer 0–100. Service clamps after validation as additional safety. */
  atsScore: z.number().int().min(0).max(100),
  seniorityLevel: z.enum(['Entry', 'Mid', 'Senior', 'Lead', 'Executive']),
  improvementSuggestions: z.array(z.string().max(300)).max(10),
});

// ── Root response schema ──────────────────────────────────────────────────────

export const aiOptimizationResponseSchema = z.object({
  optimizedSummary: z.string().min(1).max(1000),
  /** Only includes experiences the AI actually modified (may be empty). */
  optimizedExperiences: z.array(optimizedExperienceSchema).max(20),
  /** Only includes projects the AI actually modified (may be empty). */
  optimizedProjects: z.array(optimizedProjectSchema).max(20),
  suggestedSkills: z.array(suggestedSkillSchema).max(15),
  analysis: analysisSchema,
});

export type AiOptimizationResponse = z.infer<
  typeof aiOptimizationResponseSchema
>;
