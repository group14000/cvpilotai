import { z } from 'zod';

// ─── AI Optimization Response Schema ─────────────────────────────────────────
//
// This schema is the CONTRACT between the AI prompt and the rest of the
// application. Every field uses z.preprocess() + .catch() so that variations
// in model output (different enum casing, floats, string descriptions, markdown
// fences) are normalised before Zod validates — rather than hard-failing.
//
// Design decisions:
//   - experiences/projects use IDs for matching back to Zustand store items
//   - AI only returns description text — never companyName, role, or dates
//   - suggestedSkills is separate from modified skills (no proficiency changes)
//   - analysisSchema uses .transform(Math.round) for atsScore — clamped too
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalise a potential seniority string to one of our canonical enum values.
 * Many models return "mid-level", "Senior-Level", "jr", etc. — all handled here.
 */
function normaliseSeniority(raw: unknown): string {
  if (typeof raw !== 'string') return 'Mid';
  const v = raw.toLowerCase().trim();
  if (
    v === 'entry' ||
    v.includes('entry') ||
    v.includes('junior') ||
    v === 'jr' ||
    v.includes('grad')
  )
    return 'Entry';
  if (
    v === 'mid' ||
    v.includes('mid-level') ||
    v.includes('associate') ||
    v === 'ii' ||
    v === 'middle'
  )
    return 'Mid';
  if (
    v === 'senior' ||
    v.includes('senior') ||
    v === 'sr' ||
    v === 'sr.' ||
    v.includes('iii')
  )
    return 'Senior';
  if (
    v === 'lead' ||
    v.includes('lead') ||
    v.includes('principal') ||
    v.includes('staff') ||
    v.includes('iv')
  )
    return 'Lead';
  if (
    v === 'executive' ||
    v.includes('exec') ||
    v.includes('director') ||
    v.includes('vp') ||
    v.includes('chief') ||
    v.includes('c-level')
  )
    return 'Executive';
  return 'Mid'; // safe default
}

/**
 * Normalise a potential proficiency string to one of our canonical enum values.
 * Models may return "beginner", "ADVANCED", "proficient", etc.
 */
function normaliseProficiency(raw: unknown): string {
  if (typeof raw !== 'string') return 'Intermediate';
  const v = raw.toLowerCase().trim();
  if (
    v === 'beginner' ||
    v === 'basic' ||
    v === 'novice' ||
    v === 'learning' ||
    v === 'familiar'
  )
    return 'Beginner';
  if (
    v === 'intermediate' ||
    v === 'competent' ||
    v === 'moderate' ||
    v === 'working'
  )
    return 'Intermediate';
  if (
    v === 'advanced' ||
    v === 'experienced' ||
    v === 'skilled' ||
    v === 'strong'
  )
    return 'Advanced';
  if (
    v === 'expert' ||
    v === 'master' ||
    v === 'specialist' ||
    v === 'fluent' ||
    v === 'proficient'
  )
    return 'Expert';
  return 'Intermediate'; // safe default
}

/**
 * Normalise the `description` field of an experience/project.
 *
 * Models sometimes return:
 *   - An array of {id, content} objects  ← canonical
 *   - An array of plain strings           ← wrap each as {id: "new-N", content: s}
 *   - A single plain string               ← wrap as [{id: "new-1", content: s}]
 *
 * All three are converted to the canonical form before Zod validates.
 */
function normaliseDescriptionField(val: unknown): unknown {
  if (typeof val === 'string') {
    return [{ id: 'new-1', content: val.slice(0, 500) }];
  }
  if (Array.isArray(val)) {
    return val.map((item, i) => {
      if (typeof item === 'string') {
        return { id: `new-${i + 1}`, content: item.slice(0, 500) };
      }
      return item; // already an object — let Zod validate the shape
    });
  }
  return val;
}

// ── Description block returned by AI ─────────────────────────────────────────

const aiDescriptionBlockSchema = z.object({
  id: z.string().min(1),
  content: z.string().min(1).max(500),
});

// ── Experience optimization (description only) ────────────────────────────────

const optimizedExperienceSchema = z.object({
  /** Must match an existing Experience.id in the resume — validated in service. */
  id: z.string().min(1),
  description: z.preprocess(
    normaliseDescriptionField,
    z.array(aiDescriptionBlockSchema).min(1).max(10)
  ),
});

// ── Project optimization (description only) ───────────────────────────────────

const optimizedProjectSchema = z.object({
  /** Must match an existing Project.id in the resume — validated in service. */
  id: z.string().min(1),
  description: z.preprocess(
    normaliseDescriptionField,
    z.array(aiDescriptionBlockSchema).min(1).max(8)
  ),
});

// ── Suggested new skill ───────────────────────────────────────────────────────

const suggestedSkillSchema = z.object({
  name: z.string().min(1).max(80),
  /** Case-insensitive normalisation — models rarely match the exact enum case. */
  proficiency: z.preprocess(
    normaliseProficiency,
    z
      .enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
      .catch('Intermediate')
  ),
  /** Why this skill is suggested — shown to user in the diff view. */
  reason: z.string().max(200).catch(''),
});

// ── ATS analysis ──────────────────────────────────────────────────────────────

const analysisSchema = z.object({
  extractedKeywords: z.array(z.string().max(60)).max(40).catch([]),
  matchedKeywords: z.array(z.string().max(60)).max(40).catch([]),
  missingKeywords: z.array(z.string().max(60)).max(30).catch([]),
  /**
   * Accept float or string ATS scores — transform to integer.
   * z.preprocess handles "72" (string) → 72 before z.number() validates.
   * Service clamps after validation as additional safety.
   */
  atsScore: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0).max(100).transform(Math.round).catch(50)
  ),
  /** Case-insensitive normalisation — models return "mid-level", "Senior-Level", etc. */
  seniorityLevel: z.preprocess(
    normaliseSeniority,
    z.enum(['Entry', 'Mid', 'Senior', 'Lead', 'Executive']).catch('Mid')
  ),
  improvementSuggestions: z.array(z.string().max(300)).max(10).catch([]),
});

// ── Root response schema ──────────────────────────────────────────────────────

export const aiOptimizationResponseSchema = z.object({
  /**
   * Use .catch('') so a missing/null summary doesn't fail the whole response.
   * The UI shows this field — an empty string is handled gracefully.
   */
  optimizedSummary: z.string().max(1000).catch(''),
  /** Only includes experiences the AI actually modified (may be empty). */
  optimizedExperiences: z.array(optimizedExperienceSchema).max(20).catch([]),
  /** Only includes projects the AI actually modified (may be empty). */
  optimizedProjects: z.array(optimizedProjectSchema).max(20).catch([]),
  suggestedSkills: z.array(suggestedSkillSchema).max(15).catch([]),
  analysis: analysisSchema,
});

export type AiOptimizationResponse = z.infer<
  typeof aiOptimizationResponseSchema
>;
