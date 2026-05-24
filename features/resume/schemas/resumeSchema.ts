import { z } from 'zod';

// ─── Layer 1: Leaf / primitive schemas ────────────────────────────────────────
// Mirror types/resume.ts exactly so the API validates the same shape
// the Zustand store produces.

const descriptionBlockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['paragraph', 'bullet']),
  content: z.string(),
});

const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  location: z.string().min(1, 'Location is required'),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional(),
});

const experienceSchema = z.object({
  id: z.string().min(1),
  companyName: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role is required'),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.array(descriptionBlockSchema).optional(),
});

const skillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Skill name is required'),
  proficiency: z.string(),
  level: z.number().optional(),
});

const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Project name is required'),
  website: z.string().optional(),
  sourceCode: z.string().optional(),
  description: z.array(descriptionBlockSchema).optional(),
});

const educationSchema = z.object({
  id: z.string().min(1),
  institution: z.string().min(1, 'Institution is required'),
  areaOfStudy: z.string(),
  degree: z.string().min(1, 'Degree is required'),
  grade: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  website: z.string().optional(),
  description: z.array(descriptionBlockSchema).optional(),
});

const certificationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Certification title is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  date: z.string(),
  website: z.string().optional(),
  description: z.array(descriptionBlockSchema).optional(),
});

// ─── Layer 2: Full resume content ─────────────────────────────────────────────
// This is what gets stored in Resume.data (Json field).
// Does NOT include top-level metadata (id, templateId) — those are
// separate DB columns.

export const resumeDataSchema = z.object({
  personalInfo: personalInfoSchema,
  summary: z.string().max(2000),
  experiences: z.array(experienceSchema).max(20),
  skills: z.array(skillSchema).max(50),
  projects: z.array(projectSchema).max(20),
  education: z.array(educationSchema).max(10),
  certifications: z.array(certificationSchema).max(20),
});

// ─── Layer 3: API request body ────────────────────────────────────────────────

export const createResumeSchema = z.object({
  /** Human-readable title for the resume list page. */
  title: z.string().min(1, 'Title is required').max(255).trim(),

  /** Slug of the chosen template (e.g. "classic", "prime-ats"). */
  templateSlug: z.string().min(1, 'Template slug is required'),

  /** Full resume content — stored as-is in Resume.data (Json). */
  data: resumeDataSchema,
});

// ─── Layer 3b: PATCH /api/v1/resumes/[id] request body ───────────────────────

export const updateResumeSchema = z.object({
  /**
   * Optional title update. If omitted, the service preserves the existing title.
   * Forward-compatible: when a rename UI is added, the client just starts sending this.
   */
  title: z
    .string()
    .min(1, 'Title must not be empty')
    .max(255)
    .trim()
    .optional(),

  /** Full resume content — replaces the stored Resume.data Json. */
  data: resumeDataSchema,
});

// ─── Exported types ───────────────────────────────────────────────────────────

export type ResumeData = z.infer<typeof resumeDataSchema>;
export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
