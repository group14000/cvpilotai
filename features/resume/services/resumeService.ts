import { prisma } from '@/lib/prisma/client';
import { generateResumeSlug } from '../utils/slugUtils';
import type {
  CreateResumeServiceInput,
  ResumeCreatedResponse,
  ResumeListItem,
  ResumeDetail,
} from '../types';

// ─── Template auto-seed ───────────────────────────────────────────────────────
//
// The Resume.templateId column is a FK → ResumeTemplate.id, so rows must
// exist before any resume can be created.  Rather than requiring a manual
// "pnpm prisma db seed" step, we upsert all 6 template rows the first time
// this module is invoked.  A module-level flag ensures the upserts only run
// once per server process (one DB round-trip per cold start, never again).

const RESUME_TEMPLATES = [
  {
    slug: 'classic',
    name: 'Classic',
    thumbnail: '/resume-templates/classic.jpg',
  },
  {
    slug: 'traditional',
    name: 'Traditional',
    thumbnail: '/resume-templates/traditional.jpg',
  },
  {
    slug: 'professional',
    name: 'Professional',
    thumbnail: '/resume-templates/Professional.jpg',
  },
  {
    slug: 'prime-ats',
    name: 'Prime ATS',
    thumbnail: '/resume-templates/prime-ats.jpg',
  },
  { slug: 'clean', name: 'Clean', thumbnail: '/resume-templates/Clean.jpg' },
  {
    slug: 'precision-ats',
    name: 'Precision ATS',
    thumbnail: '/resume-templates/precission-ats.jpg', // intentional typo — matches public/
  },
] as const;

let templatesSeedChecked = false;

async function ensureResumeTemplates(): Promise<void> {
  if (templatesSeedChecked) return;

  await Promise.all(
    RESUME_TEMPLATES.map((tpl) =>
      prisma.resumeTemplate.upsert({
        where: { slug: tpl.slug },
        update: { name: tpl.name, thumbnail: tpl.thumbnail },
        create: { slug: tpl.slug, name: tpl.name, thumbnail: tpl.thumbnail },
      })
    )
  );

  templatesSeedChecked = true;
}

// ─── createResume ─────────────────────────────────────────────────────────────

/**
 * Persist a new resume to the database.
 *
 * This function trusts its input — Zod validation is performed at the
 * API route layer before this function is called.
 *
 * Slug collision strategy:
 *   The @@unique([userId, slug]) constraint means two resumes from the
 *   same user cannot share a slug. generateResumeSlug() appends a random
 *   6-character suffix to make collisions astronomically unlikely.
 */
export async function createResume(
  input: CreateResumeServiceInput
): Promise<ResumeCreatedResponse> {
  // 1. Ensure the ResumeTemplate table is populated (idempotent, once per process)
  await ensureResumeTemplates();

  // 2. Resolve templateSlug → ResumeTemplate.id (DB primary key)
  const template = await prisma.resumeTemplate.findUnique({
    where: { slug: input.templateSlug },
    select: { id: true },
  });

  if (!template) {
    // Slug not in the RESUME_TEMPLATES list above — client sent a bad value
    throw new Error(`Unknown template slug: "${input.templateSlug}"`);
  }

  // 3. Generate a unique URL-safe slug for this resume
  const slug = generateResumeSlug(input.title);

  // 4. Persist to database
  const resume = await prisma.resume.create({
    data: {
      userId: input.userId,
      title: input.title,
      slug,
      templateId: template.id,
      data: input.data,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      templateId: true,
      createdAt: true,
    },
  });

  return resume;
}

// ─── listResumes ──────────────────────────────────────────────────────────────

/**
 * Return lightweight metadata for all resumes owned by a user.
 *
 * Does NOT select the data Json column — avoids transferring large payloads
 * when only the list view needs to be rendered.
 *
 * Ownership is enforced by the WHERE userId = input.userId clause — no
 * additional check needed.
 */
export async function listResumes(userId: string): Promise<ResumeListItem[]> {
  return prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      template: {
        select: { id: true, slug: true, name: true, thumbnail: true },
      },
    },
  });
}

// ─── getResumeById ────────────────────────────────────────────────────────────

/**
 * Return the full resume (including data Json) for a specific resume.
 *
 * Ownership is enforced at the query level: combining id AND userId in a
 * single WHERE clause means a non-owner receives null — indistinguishable
 * from "not found".  This prevents ID enumeration attacks.
 *
 * Uses findFirst (not findUnique) because the (id, userId) pair is not a
 * declared @@unique constraint — id alone is the PK, but we want both
 * conditions in one DB round-trip.
 *
 * Returns null if the resume does not exist or is owned by a different user.
 */
export async function getResumeById(
  resumeId: string,
  userId: string
): Promise<ResumeDetail | null> {
  return prisma.resume.findFirst({
    where: { id: resumeId, userId },
    select: {
      id: true,
      title: true,
      slug: true,
      data: true,
      createdAt: true,
      updatedAt: true,
      template: {
        select: { id: true, slug: true, name: true, thumbnail: true },
      },
    },
  });
}
