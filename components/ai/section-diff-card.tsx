'use client';

import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useResumeStore } from '@/store/resume-store';
import type { SectionStatus } from '@/features/ai/types';
import type { DescriptionBlock } from '@/types/resume';

// ─── Summary diff card ────────────────────────────────────────────────────────

type SummaryDiffCardProps = {
  original: string;
  optimized: string;
  status: SectionStatus;
};

export function SummaryDiffCard({
  original,
  optimized,
  status,
}: SummaryDiffCardProps) {
  const accept = useResumeStore((s) => s.acceptAiSection);
  const reject = useResumeStore((s) => s.rejectAiSection);

  return (
    <DiffCardWrapper
      label="Summary"
      status={status}
      onAccept={() => accept('summary')}
      onReject={() => reject('summary')}
    >
      <DiffColumns
        original={<p className="text-sm leading-relaxed">{original}</p>}
        optimized={<p className="text-sm leading-relaxed">{optimized}</p>}
        status={status}
      />
    </DiffCardWrapper>
  );
}

// ─── Experience diff card ─────────────────────────────────────────────────────

type ExperienceDiffCardProps = {
  experienceId: string;
  companyName: string;
  role: string;
  originalDescription: DescriptionBlock[];
  optimizedDescription: DescriptionBlock[];
  status: SectionStatus;
};

export function ExperienceDiffCard({
  experienceId,
  companyName,
  role,
  originalDescription,
  optimizedDescription,
  status,
}: ExperienceDiffCardProps) {
  const accept = useResumeStore((s) => s.acceptAiSection);
  const reject = useResumeStore((s) => s.rejectAiSection);

  return (
    <DiffCardWrapper
      label={`${companyName} — ${role}`}
      labelPrefix="Experience"
      status={status}
      onAccept={() => accept('experiences', experienceId)}
      onReject={() => reject('experiences', experienceId)}
    >
      <DiffColumns
        original={
          <BulletList items={originalDescription.map((d) => d.content)} />
        }
        optimized={
          <BulletList items={optimizedDescription.map((d) => d.content)} />
        }
        status={status}
      />
    </DiffCardWrapper>
  );
}

// ─── Project diff card ────────────────────────────────────────────────────────

type ProjectDiffCardProps = {
  projectId: string;
  projectName: string;
  originalDescription: DescriptionBlock[];
  optimizedDescription: DescriptionBlock[];
  status: SectionStatus;
};

export function ProjectDiffCard({
  projectId,
  projectName,
  originalDescription,
  optimizedDescription,
  status,
}: ProjectDiffCardProps) {
  const accept = useResumeStore((s) => s.acceptAiSection);
  const reject = useResumeStore((s) => s.rejectAiSection);

  return (
    <DiffCardWrapper
      label={projectName}
      labelPrefix="Project"
      status={status}
      onAccept={() => accept('projects', projectId)}
      onReject={() => reject('projects', projectId)}
    >
      <DiffColumns
        original={
          <BulletList items={originalDescription.map((d) => d.content)} />
        }
        optimized={
          <BulletList items={optimizedDescription.map((d) => d.content)} />
        }
        status={status}
      />
    </DiffCardWrapper>
  );
}

// ─── Skills suggestion card ───────────────────────────────────────────────────

type SkillsSuggestionCardProps = {
  suggestedSkills: Array<{ name: string; proficiency: string; reason: string }>;
  status: SectionStatus;
};

export function SkillsSuggestionCard({
  suggestedSkills,
  status,
}: SkillsSuggestionCardProps) {
  const accept = useResumeStore((s) => s.acceptAiSection);
  const reject = useResumeStore((s) => s.rejectAiSection);

  return (
    <DiffCardWrapper
      label={`${suggestedSkills.length} skill${suggestedSkills.length !== 1 ? 's' : ''} suggested`}
      labelPrefix="Skills"
      status={status}
      onAccept={() => accept('skills')}
      onReject={() => reject('skills')}
    >
      <div className="space-y-2 p-3">
        {suggestedSkills.map((sk) => (
          <div key={sk.name} className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-foreground text-sm font-medium">
                {sk.name}
              </span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {sk.proficiency}
              </Badge>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {sk.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </DiffCardWrapper>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

type DiffCardWrapperProps = {
  children: React.ReactNode;
  label: string;
  labelPrefix?: string;
  status: SectionStatus;
  onAccept: () => void;
  onReject: () => void;
};

function DiffCardWrapper({
  children,
  label,
  labelPrefix,
  status,
  onAccept,
  onReject,
}: DiffCardWrapperProps) {
  const borderClass =
    status === 'accepted'
      ? 'border-emerald-300 dark:border-emerald-700'
      : status === 'rejected'
        ? 'border-muted'
        : 'border-border';

  return (
    <div className={`rounded-lg border ${borderClass} overflow-hidden`}>
      {/* Card header */}
      <div className="bg-muted/50 flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {labelPrefix && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {labelPrefix}
            </Badge>
          )}
          <span className="text-foreground truncate text-sm font-medium">
            {label}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant={status === 'accepted' ? 'default' : 'outline'}
            size="sm"
            className={`h-7 gap-1.5 text-xs ${
              status === 'accepted'
                ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
            }`}
            onClick={onAccept}
          >
            <Check className="h-3 w-3" />
            Accept
          </Button>
          <Button
            variant={status === 'rejected' ? 'destructive' : 'outline'}
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={onReject}
          >
            <X className="h-3 w-3" />
            Reject
          </Button>
        </div>
      </div>

      {/* Diff content */}
      <div className={status === 'rejected' ? 'opacity-40' : ''}>
        {children}
      </div>
    </div>
  );
}

type DiffColumnsProps = {
  original: React.ReactNode;
  optimized: React.ReactNode;
  status: SectionStatus;
};

function DiffColumns({ original, optimized, status }: DiffColumnsProps) {
  return (
    <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
      {/* Current (original) */}
      <div className="bg-muted/20 border-border p-3 md:border-r">
        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
          Current
        </p>
        <div className="text-foreground">{original}</div>
      </div>

      {/* Optimized */}
      <div
        className={`p-3 transition-colors ${
          status === 'accepted'
            ? 'bg-emerald-50 dark:bg-emerald-950/20'
            : 'bg-background'
        }`}
      >
        <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
          Optimized
        </p>
        <div className="text-foreground">{optimized}</div>
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm italic">No content</p>;
  }

  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-1.5">
          <span className="text-muted-foreground mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
          <span className="text-sm leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
