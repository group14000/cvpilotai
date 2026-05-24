'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FileText, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ExportButton } from '@/components/resume/export-button';
import { DeleteResumeButton } from '@/components/resume/delete-resume-button';
import { useResumes, type ResumeListItemJSON } from '@/hooks/use-resumes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function ResumeCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex gap-4 p-4">
        <Skeleton className="h-[120px] w-[88px] shrink-0 rounded-md" />
        <div className="flex flex-1 flex-col justify-between gap-3 py-1">
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Resume card ──────────────────────────────────────────────────────────────

function ResumeCard({ item }: { item: ResumeListItemJSON }) {
  const thumbnail = item.template.thumbnail ?? '/resume-templates/classic.jpg';

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="flex gap-4 p-4">
        {/* Template thumbnail */}
        <div className="bg-muted relative h-[120px] w-[88px] shrink-0 overflow-hidden rounded-md border">
          <Image
            src={thumbnail}
            alt={`${item.template.name} template preview`}
            fill
            className="object-cover object-top"
            sizes="88px"
          />
        </div>

        {/* Resume info */}
        <div className="flex flex-1 flex-col justify-between gap-2 py-1">
          <div className="space-y-1.5">
            <h3 className="text-foreground line-clamp-2 text-base leading-snug font-semibold">
              {item.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {item.template.name}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {formatDate(item.createdAt)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View — opens the print-ready page in a new tab */}
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href={`/resume/${item.id}`} target="_blank">
                <Eye className="h-3.5 w-3.5" />
                View
              </Link>
            </Button>

            {/* Download PDF — spinner while Playwright generates the PDF */}
            <ExportButton resumeId={item.id} resumeTitle={item.title} />

            {/* Edit — loads DB resume into the Zustand-powered editor */}
            <Button variant="ghost" size="sm" className="gap-1.5" asChild>
              <Link href={`/resumes/${item.id}/edit`}>Edit</Link>
            </Button>

            {/* Delete — AlertDialog confirmation before hard-delete */}
            <DeleteResumeButton resumeId={item.id} resumeTitle={item.title} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <FileText className="text-muted-foreground h-8 w-8" />
      </div>
      <h3 className="text-foreground mb-1 text-lg font-semibold">
        No resumes yet
      </h3>
      <p className="text-muted-foreground mb-6 max-w-xs text-sm">
        Create your first resume to get started. Choose from 6 professional
        templates.
      </p>
      <Button asChild>
        <Link href="/resumes/new">Create Resume</Link>
      </Button>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-destructive mb-2 text-sm font-medium">
        Failed to load resumes
      </p>
      <p className="text-muted-foreground text-xs">{message}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Client component that fetches and renders the authenticated user's
 * resume list via the useResumes() TanStack Query hook.
 *
 * States:
 *   - Loading  → 3 skeleton cards
 *   - Error    → error message
 *   - Empty    → empty state CTA
 *   - Loaded   → grid of ResumeCard components
 */
export function ResumeList() {
  const { data: resumes, isPending, isError, error } = useResumes();

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ResumeCardSkeleton />
        <ResumeCardSkeleton />
        <ResumeCardSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Unknown error'}
      />
    );
  }

  if (!resumes || resumes.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {resumes.map((item) => (
        <ResumeCard key={item.id} item={item} />
      ))}
    </div>
  );
}
