/**
 * Edit Resume page — loads an existing resume into the Zustand-powered editor.
 *
 * URL:    /resumes/[id]/edit
 * Auth:   Clerk (server-side — redirect before any HTML is sent)
 * Layout: (main) group — sidebar + header are present but the editor
 *         itself overrides the body with a full-height two-panel layout
 *
 * Data flow:
 *   1. Server fetches resume from DB via getResumeById (ownership-scoped)
 *   2. Parses Resume.data Json with resumeDataSchema (fail-fast on corrupt data)
 *   3. Builds the Resume prop matching the Zustand store shape
 *   4. Renders <EditResumeClient> — client wrapper that calls hydrateResume()
 *      on mount and resetResume() on unmount
 *
 * Why a server component?
 *   - Auth check + redirect runs before HTML is sent (faster, more secure)
 *   - DB fetch happens server-side — no loading flash in the editor
 *   - Ownership validation is never delegated to the client
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { getResumeById } from '@/features/resume/services/resumeService';
import { resumeDataSchema } from '@/features/resume/schemas/resumeSchema';
import { EditResumeClient } from '@/components/resume/edit-resume-client';
import type { Resume } from '@/types/resume';

export default async function EditResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ── 1. Authentication ──────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // ── 2. Resolve Clerk userId → DB User ─────────────────────────────────────
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  // User not synced to DB yet — treat as not found
  if (!dbUser) notFound();

  // ── 3. Fetch resume (ownership enforced by compound WHERE) ─────────────────
  const dbResume = await getResumeById(id, dbUser.id);

  // Not found OR not owned by this user → 404 (no id enumeration)
  if (!dbResume) notFound();

  // ── 4. Parse & validate the Json data field ────────────────────────────────
  const parsed = resumeDataSchema.safeParse(dbResume.data);
  if (!parsed.success) {
    // Corrupt or schema-migrated record — fail safely
    notFound();
  }

  // ── 5. Build the Resume prop for the Zustand store ─────────────────────────
  const resume: Resume = {
    id: dbResume.id,
    templateId: dbResume.template.slug,
    ...parsed.data,
  };

  // ── 6. Render client wrapper (handles store hydration + editor layout) ──────
  return (
    <EditResumeClient resume={resume} templateSlug={dbResume.template.slug} />
  );
}
