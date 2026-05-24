'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios, { isAxiosError } from 'axios';

// ─── API response shapes ──────────────────────────────────────────────────────

type DeleteResumeError = { success: false; error: string };

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchDeleteResume(resumeId: string): Promise<void> {
  try {
    await axios.delete(`/api/v1/resumes/${resumeId}`);
  } catch (error) {
    if (isAxiosError<DeleteResumeError>(error)) {
      throw new Error(error.response?.data?.error ?? 'Failed to delete resume');
    }
    throw error;
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
