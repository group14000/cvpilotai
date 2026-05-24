import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResumeList } from '@/components/resume/resume-list';
import { Plus } from 'lucide-react';
import Link from 'next/link';

/**
 * /resumes — authenticated user's resume list.
 *
 * Server component shell: renders static header + "New Resume" button,
 * then delegates the data-fetching list to <ResumeList /> (client component).
 */
export default function ResumesPage() {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)] px-6 md:px-8">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <header className="border-border flex flex-col gap-6 border-b py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">
            Resumes
          </h1>
          <p className="text-muted-foreground text-sm font-medium md:text-base">
            Manage every version, tailored to every role.
          </p>
        </div>

        <Button
          asChild
          className="w-fit gap-2 rounded-lg px-4 py-2 font-semibold shadow-sm transition-all duration-200 hover:shadow-md md:px-6 md:py-2.5"
        >
          <Link href="/resumes/new">
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            <span>New Resume</span>
          </Link>
        </Button>
      </header>

      {/* ── Resume list (client component — handles fetch + states) ───────── */}
      <div className="py-8">
        <ResumeList />
      </div>
    </ScrollArea>
  );
}
