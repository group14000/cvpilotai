'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios, { isAxiosError } from 'axios';
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

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function postCreateResume(
  payload: CreateResumeInput
): Promise<CreateResumeSuccess> {
  try {
    const { data } = await axios.post<CreateResumeSuccess>(
      '/api/v1/resumes',
      payload
    );
    return data;
  } catch (error) {
    if (isAxiosError<CreateResumeError>(error)) {
      throw new Error(error.response?.data?.error ?? 'Failed to save resume');
    }
    throw error;
  }
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
