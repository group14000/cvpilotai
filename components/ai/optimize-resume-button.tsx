'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizationDialog } from './optimization-dialog';
import { useResumeStore } from '@/store/resume-store';

type Props = {
  /** The DB resume id — passed from EditResumeClient. */
  resumeId: string;
};

/**
 * "Optimize Resume" trigger button shown in the edit page header.
 *
 * States:
 *   - idle    → "Optimize" button (outline variant, sparkles icon)
 *   - loading → spinner, button disabled (prevents double-click during AI call)
 *   - success → shows "1 optimization ready" badge to draw user back to dialog
 *   - error   → button resets to idle (error toast was shown by the hook)
 *
 * Clicking the button opens the OptimizationDialog (which handles all three
 * dialog states: input → loading → results).
 */
export function OptimizeResumeButton({ resumeId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const aiOptimization = useResumeStore((s) => s.aiOptimization);

  const status = aiOptimization?.status ?? 'idle';
  const isLoading = status === 'loading';
  const hasResult = status === 'success';

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isLoading}
          onClick={() => setDialogOpen(true)}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          )}
          {isLoading ? 'Optimizing…' : 'Optimize'}
        </Button>

        {/* "Optimization ready" badge — shown when results are waiting */}
        {hasResult && (
          <Badge
            variant="default"
            className="absolute -top-1.5 -right-1.5 h-4 min-w-4 cursor-pointer bg-violet-600 px-1 text-[10px] hover:bg-violet-600"
            onClick={() => setDialogOpen(true)}
          >
            1
          </Badge>
        )}
      </div>

      <OptimizationDialog
        resumeId={resumeId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
