/**
 * Print-ready resume page — no sidebar, no header, no decorations.
 *
 * Purpose:
 *   - Serves the resume as a clean A4 page for CSS @media print (MVP)
 *   - Will be the render target for Playwright PDF generation (future)
 *
 * URL:  /resume/[id]  (route group "(print)" is invisible in the URL)
 * Auth: Clerk — only the resume owner may view this page
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { TEMPLATE_COMPONENTS } from '@/components/templates';
import { resumeDataSchema } from '@/features/resume/schemas/resumeSchema';
import type { Resume } from '@/types/resume';

export default async function PrintResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ── Auth check ────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // ── Fetch resume with template slug ───────────────────────────────────────
  const dbResume = await prisma.resume.findUnique({
    where: { id },
    include: {
      template: { select: { slug: true } },
      user: { select: { clerkId: true } },
    },
  });

  if (!dbResume) notFound();

  // ── Ownership check (403 → 404 to avoid id enumeration) ──────────────────
  if (dbResume.user.clerkId !== userId) notFound();

  // ── Validate & parse JSON data field ─────────────────────────────────────
  const parsed = resumeDataSchema.safeParse(dbResume.data);
  if (!parsed.success) {
    // Data schema mismatch — corrupt or migrated-away record
    notFound();
  }

  // ── Build the Resume prop expected by all template components ─────────────
  const resume: Resume = {
    id: dbResume.id,
    templateId: dbResume.template.slug,
    ...parsed.data,
  };

  // ── Resolve template component ────────────────────────────────────────────
  const Template = TEMPLATE_COMPONENTS[dbResume.template.slug];
  if (!Template) notFound();

  // ── Render — A4 paper, no chrome ─────────────────────────────────────────
  return (
    <>
      {/*
       * Print-specific styles:
       *   - Remove default body margin/padding for clean A4 output
       *   - @page sets paper size and zero margins (template handles its own padding)
       *   - Hide everything except the resume on print
       */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body  { margin: 0; padding: 0; }
        }
      `}</style>

      <div className="flex min-h-screen items-start justify-center bg-zinc-200 py-8 print:bg-white print:p-0">
        <Template resume={resume} />
      </div>
    </>
  );
}
