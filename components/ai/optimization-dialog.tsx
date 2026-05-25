'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { OptimizationResultsPanel } from './optimization-results-panel';
import { useResumeStore } from '@/store/resume-store';
import { useOptimizeResume } from '@/hooks/use-optimize-resume';

// ─── Loading messages ─────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  'Analyzing job description...',
  'Identifying keyword gaps...',
  'Rewriting experience bullets...',
  'Calculating ATS score...',
  'Finalizing optimization...',
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  resumeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Full optimization dialog with three conditional states:
 *
 * 1. Idle (input)   — Textarea for job description + "Optimize Resume" button
 * 2. Loading         — Skeleton + rotating status messages + progress bar
 * 3. Success         — Tabbed diff view (Suggestions + Analysis) + footer actions
 *
 * The dialog stays open across all states. The user can close it from any
 * state; if they close during "success", the pending optimization is preserved
 * in Zustand — they can re-open and still apply it via the Optimize button's
 * "optimization ready" badge.
 */
export function OptimizationDialog({ resumeId, open, onOpenChange }: Props) {
  const [jobDescription, setJobDescription] = useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const messageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const aiOptimization = useResumeStore((s) => s.aiOptimization);
  const clearAiOptimization = useResumeStore((s) => s.clearAiOptimization);
  const applyAllAcceptedAiChanges = useResumeStore(
    (s) => s.applyAllAcceptedAiChanges
  );

  const { mutate: optimize } = useOptimizeResume(resumeId);

  const status = aiOptimization?.status ?? 'idle';
  const pending =
    aiOptimization?.status === 'success' ? aiOptimization.pending : null;
  const sectionAcceptance =
    aiOptimization?.status === 'success'
      ? aiOptimization.sectionAcceptance
      : null;

  // ── Loading animation lifecycle ─────────────────────────────────────────────
  useEffect(() => {
    if (status === 'loading') {
      setLoadingMessageIndex(0);
      setProgress(0);

      // Rotate messages every 2s
      messageIntervalRef.current = setInterval(() => {
        setLoadingMessageIndex((i) =>
          i < LOADING_MESSAGES.length - 1 ? i + 1 : i
        );
      }, 2000);

      // Advance progress bar: fast start, slow finish (cosmetic only)
      progressIntervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return p; // Never reach 100 — that happens on completion
          const increment = p < 50 ? 8 : p < 80 ? 3 : 1;
          return Math.min(p + increment, 90);
        });
      }, 400);
    } else {
      // Clear intervals when not loading
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
        messageIntervalRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (status === 'success') setProgress(100);
    }

    return () => {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
    };
  }, [status]);

  // ── Reset to idle when dialog re-opens ──────────────────────────────────────
  useEffect(() => {
    if (open && status === 'error') {
      clearAiOptimization();
    }
  }, [open, status, clearAiOptimization]);

  // ── Accepted section count ───────────────────────────────────────────────────
  const acceptedCount = sectionAcceptance
    ? [
        sectionAcceptance.summary === 'accepted' ? 1 : 0,
        ...Object.values(sectionAcceptance.experiences).map((s) =>
          s === 'accepted' ? 1 : 0
        ),
        ...Object.values(sectionAcceptance.projects).map((s) =>
          s === 'accepted' ? 1 : 0
        ),
        sectionAcceptance.skills === 'accepted' ? 1 : 0,
      ].reduce((a, b) => a + b, 0)
    : 0;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleOptimize() {
    if (jobDescription.trim().length < 50) return;
    optimize(jobDescription.trim());
  }

  function handleApply() {
    if (acceptedCount === 0) return;
    applyAllAcceptedAiChanges();
    onOpenChange(false);
    toast.success(
      `${acceptedCount} change${acceptedCount !== 1 ? 's' : ''} applied to your resume`,
      { description: "Don't forget to save your changes." }
    );
  }

  function handleDismiss() {
    clearAiOptimization();
    onOpenChange(false);
  }

  function handleClose(open: boolean) {
    if (!open && status === 'loading') return; // Prevent closing during load
    onOpenChange(open);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-6xl flex-col gap-0 overflow-hidden p-0">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <DialogHeader className="border-border shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            AI Resume Optimization
          </DialogTitle>
        </DialogHeader>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          {status === 'idle' || status === 'error' ? (
            <IdleState
              jobDescription={jobDescription}
              onChange={setJobDescription}
              onOptimize={handleOptimize}
            />
          ) : status === 'loading' ? (
            <LoadingState
              message={LOADING_MESSAGES[loadingMessageIndex]}
              progress={progress}
            />
          ) : pending && sectionAcceptance ? (
            <OptimizationResultsPanel
              pending={pending}
              sectionAcceptance={sectionAcceptance}
            />
          ) : null}
        </div>

        {/* ── Footer (results state only) ──────────────────────────────────── */}
        {status === 'success' && (
          <div className="border-border bg-muted/30 flex shrink-0 items-center justify-between border-t px-6 py-4">
            <p className="text-muted-foreground text-sm">
              {acceptedCount === 0
                ? 'Accept changes above to apply them to your resume'
                : `${acceptedCount} change${acceptedCount !== 1 ? 's' : ''} accepted`}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDismiss}>
                Dismiss All
              </Button>
              <Button
                size="sm"
                disabled={acceptedCount === 0}
                onClick={handleApply}
                className="gap-1.5"
              >
                Apply {acceptedCount > 0 ? `${acceptedCount} ` : ''}Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-states ───────────────────────────────────────────────────────────────

function IdleState({
  jobDescription,
  onChange,
  onOptimize,
}: {
  jobDescription: string;
  onChange: (v: string) => void;
  onOptimize: () => void;
}) {
  const charCount = jobDescription.length;
  const isValid = jobDescription.trim().length >= 50;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Paste a job description below. The AI will analyze the requirements and
        optimize your resume&apos;s summary, experience bullets, and skills for
        better ATS matching.
      </p>

      <div className="space-y-1.5">
        <Textarea
          placeholder="Paste the full job description here..."
          className="h-52 resize-none font-mono text-sm"
          value={jobDescription}
          onChange={(e) => onChange(e.target.value)}
          maxLength={10000}
        />
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            Minimum 50 characters required
          </p>
          <p
            className={`text-xs ${charCount > 9000 ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {charCount.toLocaleString()} / 10,000
          </p>
        </div>
      </div>

      <Button className="gap-2" disabled={!isValid} onClick={onOptimize}>
        <Sparkles className="h-4 w-4" />
        Optimize Resume
      </Button>
    </div>
  );
}

function LoadingState({
  message,
  progress,
}: {
  message: string;
  progress: number;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
          <p className="text-foreground text-sm font-medium">{message}</p>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Skeleton preview of what's loading */}
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-3/4 rounded-lg" />
      </div>

      <p className="text-muted-foreground text-center text-xs">
        This usually takes 5–15 seconds on the free tier
      </p>
    </div>
  );
}
