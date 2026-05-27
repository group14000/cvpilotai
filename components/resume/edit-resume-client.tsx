'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResumeForm } from '@/components/resume/resume-form';
import { ResumePreview } from '@/components/resume/resume-preview';
import { UpdateResumeButton } from '@/components/resume/update-resume-button';
import { OptimizeResumeButton } from '@/components/ai/optimize-resume-button';
import { EditorErrorBoundary } from '@/components/ui/editor-error-boundary';
import { useResumeStore } from '@/store/resume-store';
import { resumeTemplates } from '@/components/constants/resume-templates';
import type { Resume } from '@/types/resume';

type Props = {
  /**
   * Pre-fetched resume — built by the server component page from the DB row.
   * Passed as a prop so `hydrateResume` runs once on mount (no loading flash).
   */
  resume: Resume;
  /** Template slug (e.g. "classic") — drives ResumePreview's template selection. */
  templateSlug: string;
};

/**
 * Client wrapper for the edit page.
 *
 * Responsibilities:
 *   - Hydrate the Zustand store with the server-fetched resume on mount
 *   - Reset the store to INITIAL_RESUME ("preview-draft") on unmount,
 *     so navigating back to create-resume doesn't inherit a stale id
 *   - Render the same two-panel layout as create-resume/[slug]/page.tsx
 *     but with UpdateResumeButton instead of SaveResumeButton
 *
 * Why useEffect?
 *   Zustand runs client-side only. Using useEffect ensures hydration runs
 *   after React mounts the component — no SSR/CSR mismatch.
 *
 * Why separate from page.tsx?
 *   `useEffect` requires 'use client'. The page is a server component that
 *   pre-fetches data; this component is the correct App Router seam between
 *   "server data" and "client editing state".
 */
export function EditResumeClient({ resume, templateSlug }: Props) {
  const hydrateResume = useResumeStore((s) => s.hydrateResume);
  const resetResume = useResumeStore((s) => s.resetResume);

  useEffect(() => {
    // Populate the store with DB-fetched resume data on mount.
    // The empty dependency array means this runs exactly once — on mount.
    hydrateResume(resume);

    // On unmount (navigating away from edit page), restore the sentinel id
    // so SaveResumeButton on create-resume works correctly.
    return () => {
      resetResume();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const template = resumeTemplates.find((t) => t.id === templateSlug);

  return (
    /*
     * Full-height editor layout — mirrors create-resume/[slug]/page.tsx:
     * - Top bar:  fixed height (h-14) — back button, resume title, save button
     * - Body:     two columns filling the remaining viewport height
     *   - Left:   scrollable form panel (bg-background)
     *   - Right:  scrollable A4 preview panel (bg-muted/50)
     */
    <div className="bg-background flex h-screen flex-col overflow-hidden">
      {/* ── Editor top bar ─────────────────────────────────────────────── */}
      <header className="border-border bg-background/95 flex h-14 shrink-0 items-center gap-3 border-b px-5 backdrop-blur-sm">
        {/* Left — back navigation to resume list */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground gap-1.5 pl-0"
        >
          <Link href="/resumes">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">My Resumes</span>
          </Link>
        </Button>

        <div className="bg-border mx-2 h-5 w-px" />

        {/* Center — template name */}
        <span className="text-foreground flex-1 text-sm font-semibold">
          {template?.name ?? templateSlug} Template
        </span>

        {/* AI optimization (opens dialog with JD input → diff view) */}
        <OptimizeResumeButton resumeId={resume.id} />

        {/* Right — save action (PATCH mutation) */}
        <UpdateResumeButton resumeId={resume.id} />
      </header>

      {/* ── Two-panel editor body ─────────────────────────────────────── */}
      <div className="grid min-h-0 flex-1 grid-cols-[380px_1fr]">
        {/* Left — Form (error boundary: crashes here don't kill the preview) */}
        <aside className="border-border bg-background h-full overflow-hidden border-r">
          <EditorErrorBoundary label="Resume Form">
            <ResumeForm />
          </EditorErrorBoundary>
        </aside>

        {/* Right — Preview (error boundary: template crashes don't kill the form) */}
        <main className="bg-muted/50 h-full overflow-auto p-8">
          <EditorErrorBoundary label="Resume Preview">
            <ResumePreview slug={templateSlug} />
          </EditorErrorBoundary>
        </main>
      </div>
    </div>
  );
}
