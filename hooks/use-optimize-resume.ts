'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useResumeStore } from '@/store/resume-store';
import type { PendingAiOptimization } from '@/features/ai/types';

// ─── API response shapes ──────────────────────────────────────────────────────

type OptimizeResumeSuccess = {
  success: true;
  data: { optimization: PendingAiOptimization };
  message: string;
};

type OptimizeResumeError = {
  success: false;
  error: string;
};

type OptimizeResumeResponse = OptimizeResumeSuccess | OptimizeResumeError;

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function postOptimizeResume(
  resumeId: string,
  jobDescription: string
): Promise<OptimizeResumeSuccess> {
  const res = await fetch(`/api/v1/resumes/${resumeId}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription }),
  });

  const json: OptimizeResumeResponse = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(
      (json as OptimizeResumeError).error ?? 'Optimization failed'
    );
  }

  return json as OptimizeResumeSuccess;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * TanStack Query mutation for POST /api/v1/resumes/[id]/optimize.
 *
 * Usage:
 *   const { mutate: optimize, isPending } = useOptimizeResume(resumeId)
 *   optimize(jobDescription)
 *
 * Handles:
 *   - Loading state: calls setAiOptimizationLoading() before request fires
 *   - Success: calls setAiOptimizationResult() — opens the diff view in the dialog
 *   - Error: calls setAiOptimizationError() + Sonner toast with specific message
 *
 * Note: No TanStack cache invalidation — this mutation makes NO DB writes.
 * The AI result lives in Zustand until the user accepts changes and then
 * clicks "Save Changes" (which triggers the existing useUpdateResume hook).
 *
 * retry: false — AI calls must not auto-retry (would double token usage,
 * confuse users, and won't help for most failure modes).
 *
 * @param resumeId - The DB resume id to optimize (from URL params / Zustand store)
 */
export function useOptimizeResume(resumeId: string) {
  const setAiOptimizationLoading = useResumeStore(
    (s) => s.setAiOptimizationLoading
  );
  const setAiOptimizationResult = useResumeStore(
    (s) => s.setAiOptimizationResult
  );
  const setAiOptimizationError = useResumeStore(
    (s) => s.setAiOptimizationError
  );

  return useMutation({
    mutationFn: (jobDescription: string) =>
      postOptimizeResume(resumeId, jobDescription),

    // Show loading state in Zustand immediately (before network response)
    onMutate: () => {
      setAiOptimizationLoading();
    },

    onSuccess: (data) => {
      setAiOptimizationResult(data.data.optimization);
      // No toast on success — the dialog results panel IS the success feedback
    },

    onError: (error: Error) => {
      setAiOptimizationError();

      // Map specific error messages to appropriate toast types
      const message = error.message;

      if (
        message.toLowerCase().includes('nothing to optimize') ||
        message.toLowerCase().includes('no content')
      ) {
        toast.warning('Nothing to Optimize', {
          description: 'Add work experience or a summary before optimizing.',
        });
      } else if (
        message.toLowerCase().includes('rate limit') ||
        message.toLowerCase().includes('too many requests')
      ) {
        toast.error('Rate Limit Reached', {
          description: message,
        });
      } else if (
        message.toLowerCase().includes('busy') ||
        message.toLowerCase().includes('unavailable')
      ) {
        toast.error('AI Unavailable', {
          description: message,
        });
      } else if (
        message.toLowerCase().includes('timed out') ||
        message.toLowerCase().includes('timeout')
      ) {
        toast.error('Connection Timeout', {
          description:
            'The optimization request timed out. Check your connection.',
        });
      } else if (
        message.toLowerCase().includes('session') ||
        message.toLowerCase().includes('unauthorized')
      ) {
        toast.error('Session Expired', {
          description: 'Please sign in again to continue.',
        });
      } else {
        toast.error('Optimization Failed', {
          description: message || 'Please try again.',
        });
      }
    },

    // Never auto-retry AI calls — see JSDoc above for reasoning
    retry: false,
  });
}
