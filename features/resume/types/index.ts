import type { Resume as PrismaResume } from '@/generated/prisma/client';
import type { ResumeData, CreateResumeInput } from '../schemas/resumeSchema';

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type { ResumeData, CreateResumeInput };

/** The raw Prisma Resume row (DB model). */
export type DbResume = PrismaResume;

// ─── Service layer input / output ─────────────────────────────────────────────

/** Input accepted by createResume() service function. */
export type CreateResumeServiceInput = {
  /** DB User.id (NOT the Clerk userId string — must be looked up first). */
  userId: string;
  /** Human-readable title shown in the resume list. */
  title: string;
  /** Template slug (e.g. "classic"). Resolved to ResumeTemplate.id internally. */
  templateSlug: string;
  /** Validated resume content — stored in Resume.data (Json). */
  data: ResumeData;
};

/** Minimal resume metadata returned in the API 201 response. */
export type ResumeCreatedResponse = {
  id: string;
  title: string;
  slug: string;
  templateId: string;
  createdAt: Date;
};
