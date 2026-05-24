import type { Resume as PrismaResume } from '@/generated/prisma/client';
import type { ResumeData, CreateResumeInput } from '../schemas/resumeSchema';

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type { ResumeData, CreateResumeInput };

/** The raw Prisma Resume row (DB model). */
export type DbResume = PrismaResume;

// ─── Shared sub-type ──────────────────────────────────────────────────────────

/** Template metadata joined into resume queries. */
export type ResumeTemplateInfo = {
  id: string;
  slug: string;
  name: string;
  thumbnail: string | null;
};

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

/**
 * Lightweight resume metadata returned by listResumes().
 * Does NOT include data Json — avoids fetching large payloads for the list view.
 * Includes joined template row for thumbnail / name display in the UI.
 */
export type ResumeListItem = {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  template: ResumeTemplateInfo;
};

/**
 * Full resume data returned by getResumeById().
 * Includes the data Json field — used by the editor, print route, and export.
 */
export type ResumeDetail = {
  id: string;
  title: string;
  slug: string;
  /** Raw JSON stored in Resume.data — caller must parse with resumeDataSchema. */
  data: unknown;
  createdAt: Date;
  updatedAt: Date;
  template: ResumeTemplateInfo;
};
