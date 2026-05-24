'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ─── API response shapes ──────────────────────────────────────────────────────

type DeleteResumeSuccess = { success: true; message: string };
type DeleteResumeError = { success: false; error: string };
type DeleteResumeResponse = DeleteResumeSuccess | DeleteResumeError;

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchDeleteResume(resumeId: string): Promise<void> {
  const res = await fetch(`/api/v1/resumes/${resumeId}`, {
    method: 'DELETE',
  });

  const json: DeleteResumeResponse = await res.json();

  if (!res.ok || !json.success) {
    const msg = (json as DeleteResumeError).error ?? 'Failed to delete resume';
    throw new Error(msg);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * TanStack Query mutation for DELETE /api/v1/resumes/[id].
 *
 * Usage:
 *   const { mutate: deleteResume, isPending } = useDeleteResume()
 *   deleteResume(resumeId)
 *
 * Handles:
 *   - Loading state via `isPending`
 *   - Success toast + ['resumes'] cache invalidation
 *   - Error toast
 *
 * @param options  - Optional onSuccess callback (e.g., close dialog, navigate away)
 */
export function useDeleteResume(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resumeId: string) => fetchDeleteResume(resumeId),

    onSuccess: () => {
      // Refresh the list so the deleted card disappears immediately
      void queryClient.invalidateQueries({ queryKey: ['resumes'] });

      toast.success('Resume deleted');
      options?.onSuccess?.();
    },

    onError: (error: Error) => {
      toast.error('Failed to delete resume', {
        description: error.message,
      });
    },
  });
}
