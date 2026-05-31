import { z } from 'zod';

// ─── AI Import Response Schema ────────────────────────────────────────────────
//
// This schema defines the JSON contract between the AI import prompt and the
// rest of the application. The AI returns a partial Resume structure (no IDs —
// they are generated server-side using crypto.randomUUID()).
//
// Every field uses .catch() so a missing or malformed section doesn't fail
// the entire response — we show what was successfully parsed, user fills in rest.
//
// Design decisions:
//   - No `id` fields — IDs are generated server-side, never by the AI
//   - Dates normalized from any real-world format → "YYYY-MM" or "Present"
//   - Proficiency normalized from any variant → canonical enum value
//   - Description normalized from string/string[] → [{content}] array
//   - personalInfo uses .catch({}) — empty object is handled downstream
// ─────────────────────────────────────────────────────────────────────────────

// ── Month map for date normalization ──────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalize date strings from any resume format to "YYYY-MM" or "Present".
 * Handles: "January 2020", "Jan 2020", "01/2020", "2020", "2021-03", "Present"
 */
function normaliseDate(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  const s = raw.trim();
  if (!s) return '2000-01';

  // Already correct "YYYY-MM"
  if (/^\d{4}-\d{2}$/.test(s)) return s;

  // Present variants
  const lower = s.toLowerCase();
  if (
    [
      'present',
      'current',
      'now',
      'ongoing',
      'today',
      'till date',
      'to date',
    ].includes(lower)
  ) {
    return 'Present';
  }

  // "Month YYYY" — e.g. "January 2020", "Jan 2020"
  const mY = s.match(/^([A-Za-z]+)[\s,]+(\d{4})$/);
  if (mY) {
    const month = MONTH_MAP[mY[1].toLowerCase()];
    if (month) return `${mY[2]}-${month}`;
  }

  // "YYYY Month" — e.g. "2020 January"
  const Ym = s.match(/^(\d{4})[\s,]+([A-Za-z]+)$/);
  if (Ym) {
    const month = MONTH_MAP[Ym[2].toLowerCase()];
    if (month) return `${Ym[1]}-${month}`;
  }

  // "MM/YYYY" or "M/YYYY"
  const slashMY = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMY) {
    return `${slashMY[2]}-${slashMY[1].padStart(2, '0')}`;
  }

  // "YYYY/MM"
  const slashYM = s.match(/^(\d{4})\/(\d{2})$/);
  if (slashYM) return `${slashYM[1]}-${slashYM[2]}`;

  // Just a year "YYYY"
  if (/^\d{4}$/.test(s)) return `${s}-01`;

  // "YYYY-MM-DD" — truncate
  const fullDate = s.match(/^(\d{4}-\d{2})-\d{2}$/);
  if (fullDate) return fullDate[1];

  return raw; // fallback — .catch() handles invalid result downstream
}

/**
 * Normalize proficiency strings to canonical enum values.
 * Handles: "beginner", "ADVANCED", "proficient", "working knowledge", etc.
 */
function normaliseProficiency(raw: unknown): string {
  if (typeof raw !== 'string') return 'Intermediate';
  const v = raw.toLowerCase().trim();
  if (
    [
      'beginner',
      'basic',
      'novice',
      'learning',
      'familiar',
      'elementary',
    ].includes(v)
  )
    return 'Beginner';
  if (
    ['intermediate', 'competent', 'moderate', 'working', 'average'].includes(v)
  )
    return 'Intermediate';
  if (
    ['advanced', 'experienced', 'skilled', 'strong', 'proficient'].includes(v)
  )
    return 'Advanced';
  if (
    [
      'expert',
      'master',
      'specialist',
      'fluent',
      'native',
      'extensive',
    ].includes(v)
  )
    return 'Expert';
  return 'Intermediate';
}

/**
 * Normalize description field from AI output.
 * Handles: string | string[] | {content}[] — all converted to {content}[] form.
 * IDs are NOT included — they are generated server-side.
 */
function normaliseImportDescriptionField(val: unknown): unknown {
  if (typeof val === 'string') {
    return val ? [{ content: val.slice(0, 500) }] : [];
  }
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') {
          return item ? { content: item.slice(0, 500) } : null;
        }
        if (item && typeof item === 'object') {
          const content =
            'content' in item
              ? String((item as { content: unknown }).content)
              : '';
          return content ? { content: content.slice(0, 500) } : null;
        }
        return null;
      })
      .filter(Boolean);
  }
  return [];
}

// ── Description item (no id — generated server-side) ─────────────────────────

const aiImportDescriptionItemSchema = z.object({
  content: z.string().min(1).max(500),
});

const aiImportDescriptionSchema = z.preprocess(
  normaliseImportDescriptionField,
  z.array(aiImportDescriptionItemSchema).max(10).catch([])
);

// ── Personal info ─────────────────────────────────────────────────────────────

const aiImportPersonalInfoSchema = z
  .object({
    firstName: z.string().max(100).catch(''),
    middleName: z.string().max(100).optional().catch(undefined),
    lastName: z.string().max(100).catch(''),
    email: z.string().max(255).catch(''),
    phone: z.string().max(50).catch(''),
    location: z.string().max(200).catch(''),
    linkedin: z.string().max(500).optional().catch(undefined),
    github: z.string().max(500).optional().catch(undefined),
    portfolio: z.string().max(500).optional().catch(undefined),
  })
  .catch({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
  });

// ── Experience (no id) ────────────────────────────────────────────────────────

const aiImportExperienceSchema = z.object({
  companyName: z.string().max(200).catch(''),
  role: z.string().max(200).catch(''),
  location: z.string().max(200).catch(''),
  startDate: z.preprocess(normaliseDate, z.string().catch('2000-01')),
  endDate: z.preprocess(normaliseDate, z.string().catch('Present')),
  description: aiImportDescriptionSchema,
});

// ── Skill (no id) ─────────────────────────────────────────────────────────────

const aiImportSkillSchema = z.object({
  name: z.string().min(1).max(80).catch(''),
  proficiency: z.preprocess(
    normaliseProficiency,
    z
      .enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
      .catch('Intermediate')
  ),
});

// ── Project (no id) ───────────────────────────────────────────────────────────

const aiImportProjectSchema = z.object({
  name: z.string().max(200).catch(''),
  website: z.string().max(500).optional().catch(undefined),
  sourceCode: z.string().max(500).optional().catch(undefined),
  description: aiImportDescriptionSchema,
});

// ── Education (no id) ─────────────────────────────────────────────────────────

const aiImportEducationSchema = z.object({
  institution: z.string().max(300).catch(''),
  degree: z.string().max(200).catch(''),
  areaOfStudy: z.string().max(200).catch(''),
  grade: z.string().max(100).catch(''),
  location: z.string().max(200).catch(''),
  startDate: z.preprocess(normaliseDate, z.string().catch('2000-01')),
  endDate: z.preprocess(normaliseDate, z.string().catch('Present')),
  website: z.string().max(500).optional().catch(undefined),
  description: aiImportDescriptionSchema,
});

// ── Certification (no id) ─────────────────────────────────────────────────────

const aiImportCertificationSchema = z.object({
  title: z.string().max(200).catch(''),
  issuer: z.string().max(200).catch(''),
  date: z.preprocess(normaliseDate, z.string().catch('2000-01')),
  website: z.string().max(500).optional().catch(undefined),
});

// ── Root schema ───────────────────────────────────────────────────────────────

export const aiImportResponseSchema = z.object({
  personalInfo: aiImportPersonalInfoSchema,
  summary: z.string().max(2000).catch(''),
  experiences: z.array(aiImportExperienceSchema).max(20).catch([]),
  skills: z
    .array(aiImportSkillSchema)
    .max(50)
    .catch([])
    .transform((skills) => skills.filter((s) => s.name.trim().length > 0)),
  projects: z.array(aiImportProjectSchema).max(20).catch([]),
  education: z.array(aiImportEducationSchema).max(10).catch([]),
  certifications: z.array(aiImportCertificationSchema).max(20).catch([]),
});

export type AiImportResponse = z.infer<typeof aiImportResponseSchema>;
