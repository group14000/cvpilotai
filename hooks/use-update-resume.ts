'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { UpdateResumeInput } from '@/features/resume/schemas/resumeSchema';
import type { ResumeUpdatedResponse } from '@/features/resume/types';

// ─── API response shapes ──────────────────────────────────────────────────────

type UpdateResumeSuccess = {
  success: true;
  data: { resume: ResumeUpdatedResponse };
  message: string;
};

type UpdateResumeError = {
  success: false;
  error: string;
  details?: unknown;
};

type UpdateResumeResponse = UpdateResumeSuccess | UpdateResumeError;

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function patchResume(
  resumeId: string,
  payload: UpdateResumeInput
): Promise<UpdateResumeSuccess> {
  const res = await fetch(`/api/v1/resumes/${resumeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json: UpdateResumeResponse = await res.json();

  if (!res.ok || !json.success) {
    const msg = (json as UpdateResumeError).error ?? 'Failed to save changes';
    throw new Error(msg);
  }

  return json as UpdateResumeSuccess;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * TanStack Query mutation for PATCH /api/v1/resumes/[id].
 *
 * Usage:
 *   const { mutate: updateResume, isPending } = useUpdateResume(resumeId)
 *   updateResume({ data })
 *
 * Handles:
 *   - Loading state via `isPending`
 *   - Success toast "Changes saved!"
 *   - Invalidates ['resumes'] (list page) and ['resume', resumeId] (detail cache)
 *   - Error toast
 *
 * @param resumeId  - The DB resume id to update (from URL params / Zustand store)
 * @param options   - Optional onSuccess callback for post-save navigation
 */
export function useUpdateResume(
  resumeId: string,
  options?: { onSuccess?: (resume: ResumeUpdatedResponse) => void }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateResumeInput) => patchResume(resumeId, payload),

    onSuccess: (data) => {
      // Refresh list page cards (title, updatedAt may have changed)
      void queryClient.invalidateQueries({ queryKey: ['resumes'] });
      // Refresh any cached detail view for this specific resume
      void queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });

      toast.success('Changes saved!', {
        description: `"${data.data.resume.title}" has been updated.`,
      });
      options?.onSuccess?.(data.data.resume);
    },

    onError: (error: Error) => {
      toast.error('Failed to save changes', {
        description: error.message,
      });
    },
  });
}
