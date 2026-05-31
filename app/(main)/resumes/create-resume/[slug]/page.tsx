import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResumeForm } from '@/components/resume/resume-form';
import { ResumePreview } from '@/components/resume/resume-preview';
import { SaveResumeButton } from '@/components/resume/save-resume-button';
import { ImportResumeButton } from '@/components/resume/import-resume-button';
import { resumeTemplates } from '@/components/constants/resume-templates';

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const template = resumeTemplates.find((t) => t.id === slug);

  return (
    /*
     * Full-height editor layout:
     * - Top bar:    fixed height (h-14) — back button, template name, save button
     * - Body:       two columns filling the remaining viewport height
     *   - Left:     scrollable form panel (bg-background)
     *   - Right:    scrollable A4 preview panel (bg-muted)
     */
    <div className="bg-background flex h-screen flex-col overflow-hidden">
      {/* ── Editor top bar ─────────────────────────────────────────────── */}
      <header className="border-border bg-background/95 flex h-14 shrink-0 items-center gap-3 border-b px-5 backdrop-blur-sm">
        {/* Left — back navigation */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground gap-1.5 pl-0"
        >
          <Link href="/resumes/new">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Templates</span>
          </Link>
        </Button>

        <div className="bg-border mx-2 h-5 w-px" />

        {/* Center — template name */}
        <span className="text-foreground flex-1 text-sm font-semibold">
          {template?.name ?? slug} Template
        </span>

        {/* Right — import + save actions */}
        <div className="flex items-center gap-2">
          <ImportResumeButton templateSlug={slug} />
          <SaveResumeButton templateSlug={slug} />
        </div>
      </header>

      {/* ── Two-panel editor body ─────────────────────────────────────── */}
      <div className="grid min-h-0 flex-1 grid-cols-[380px_1fr]">
        {/* Left — Form */}
        <aside className="border-border bg-background h-full overflow-hidden border-r">
          <ResumeForm />
        </aside>

        {/* Right — Preview */}
        <main className="bg-muted/50 h-full overflow-auto p-8">
          <ResumePreview slug={slug} />
        </main>
      </div>
    </div>
  );
}
