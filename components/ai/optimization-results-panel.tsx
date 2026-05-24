'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SummaryDiffCard,
  ExperienceDiffCard,
  ProjectDiffCard,
  SkillsSuggestionCard,
} from './section-diff-card';
import { AnalysisPanel } from './analysis-panel';
import { useResumeStore } from '@/store/resume-store';
import type {
  PendingAiOptimization,
  SectionAcceptanceMap,
} from '@/features/ai/types';

type Props = {
  pending: PendingAiOptimization;
  sectionAcceptance: SectionAcceptanceMap;
};

/**
 * Tabbed results panel shown inside the OptimizationDialog after a successful
 * AI optimization call.
 *
 * Tabs:
 *   - "Suggestions" — section-by-section diff cards with Accept/Reject buttons
 *   - "Analysis"    — ATS score, keyword matching, improvement suggestions
 *
 * Reads current resume from Zustand to get original content for diff display.
 */
export function OptimizationResultsPanel({
  pending,
  sectionAcceptance,
}: Props) {
  const resume = useResumeStore((s) => s.resume);

  return (
    <Tabs defaultValue="suggestions" className="flex h-full flex-col">
      <TabsList className="shrink-0">
        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        <TabsTrigger value="analysis">Analysis</TabsTrigger>
      </TabsList>

      {/* ── Suggestions tab ────────────────────────────────────────────────── */}
      <TabsContent value="suggestions" className="mt-0 min-h-0 flex-1">
        <ScrollArea className="h-[420px] pr-1">
          <div className="space-y-3 py-3">
            {/* Summary */}
            <SummaryDiffCard
              original={resume.summary}
              optimized={pending.optimizedSummary}
              status={sectionAcceptance.summary}
            />

            {/* Experiences */}
            {pending.optimizedExperiences.map((optimizedExp) => {
              const originalExp = resume.experiences.find(
                (e) => e.id === optimizedExp.id
              );
              if (!originalExp) return null;

              return (
                <ExperienceDiffCard
                  key={optimizedExp.id}
                  experienceId={optimizedExp.id}
                  companyName={originalExp.companyName}
                  role={originalExp.role}
                  originalDescription={originalExp.description ?? []}
                  optimizedDescription={optimizedExp.description}
                  status={
                    sectionAcceptance.experiences[optimizedExp.id] ?? 'pending'
                  }
                />
              );
            })}

            {/* Projects */}
            {pending.optimizedProjects.map((optimizedProj) => {
              const originalProj = resume.projects.find(
                (p) => p.id === optimizedProj.id
              );
              if (!originalProj) return null;

              return (
                <ProjectDiffCard
                  key={optimizedProj.id}
                  projectId={optimizedProj.id}
                  projectName={originalProj.name}
                  originalDescription={originalProj.description ?? []}
                  optimizedDescription={optimizedProj.description}
                  status={
                    sectionAcceptance.projects[optimizedProj.id] ?? 'pending'
                  }
                />
              );
            })}

            {/* Suggested skills */}
            {pending.suggestedSkills.length > 0 && (
              <SkillsSuggestionCard
                suggestedSkills={pending.suggestedSkills}
                status={sectionAcceptance.skills}
              />
            )}

            {/* Empty state */}
            {pending.optimizedExperiences.length === 0 &&
              pending.optimizedProjects.length === 0 &&
              pending.suggestedSkills.length === 0 && (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  No additional suggestions beyond the summary.
                </div>
              )}
          </div>
        </ScrollArea>
      </TabsContent>

      {/* ── Analysis tab ───────────────────────────────────────────────────── */}
      <TabsContent value="analysis" className="mt-0 min-h-0 flex-1">
        <ScrollArea className="h-[420px] pr-1">
          <AnalysisPanel analysis={pending.analysis} />
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
