'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CreateResumeInput } from '@/features/resume/schemas/resumeSchema';
import type { ResumeCreatedResponse } from '@/features/resume/types';

// ─── API response shapes ──────────────────────────────────────────────────────

type CreateResumeSuccess = {
  success: true;
  data: { resume: ResumeCreatedResponse };
  message: string;
};

type CreateResumeError = {
  success: false;
  error: string;
  details?: unknown;
};

type CreateResumeResponse = CreateResumeSuccess | CreateResumeError;

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function postCreateResume(
  payload: CreateResumeInput
): Promise<CreateResumeSuccess> {
  const res = await fetch('/api/v1/resumes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json: CreateResumeResponse = await res.json();

  if (!res.ok || !json.success) {
    const msg = (json as CreateResumeError).error ?? 'Failed to save resume';
    throw new Error(msg);
  }

  return json as CreateResumeSuccess;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * TanStack Query mutation for POST /api/v1/resumes.
 *
 * Usage:
 *   const { mutate: saveResume, isPending } = useCreateResume()
 *   saveResume({ title, templateSlug, data })
 *
 * Handles:
 *   - Loading state via `isPending`
 *   - Success toast + callback
 *   - Error toast
 *   - Invalidates ['resumes'] query so the list page refreshes automatically
 */
export function useCreateResume(options?: {
  onSuccess?: (resume: ResumeCreatedResponse) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postCreateResume,

    onSuccess: (data) => {
      // Invalidate the resumes list so /resumes page shows the new entry.
      void queryClient.invalidateQueries({ queryKey: ['resumes'] });

      toast.success('Resume saved!', {
        description: `"${data.data.resume.title}" has been saved to your account.`,
      });
      options?.onSuccess?.(data.data.resume);
    },

    onError: (error: Error) => {
      toast.error('Failed to save resume', {
        description: error.message,
      });
    },
  });
}
