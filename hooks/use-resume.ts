'use client';

import { useQuery } from '@tanstack/react-query';
import axios, { isAxiosError } from 'axios';

// ─── API response shapes ──────────────────────────────────────────────────────

/** Template metadata shape as returned over the wire. */
type ResumeTemplateInfoJSON = {
  id: string;
  slug: string;
  name: string;
  thumbnail: string | null;
};

/**
 * Full resume detail as returned by GET /api/v1/resumes/[id].
 * Includes the `data` Json field (untyped — parse with resumeDataSchema if needed).
 * Date fields are ISO strings (JSON serialisation of Prisma DateTime).
 */
export type ResumeDetailJSON = {
  id: string;
  title: string;
  slug: string;
  data: unknown;
  createdAt: string;
  updatedAt: string;
  template: ResumeTemplateInfoJSON;
};

type GetResumeSuccess = {
  success: true;
  data: { resume: ResumeDetailJSON };
};

type GetResumeError = {
  success: false;
  error: string;
};

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchResume(id: string): Promise<ResumeDetailJSON> {
  try {
    const { data } = await axios.get<GetResumeSuccess>(`/api/v1/resumes/${id}`);
    return data.data.resume;
  } catch (error) {
    if (isAxiosError<GetResumeError>(error)) {
      throw new Error(error.response?.data?.error ?? 'Failed to fetch resume');
    }
    throw error;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * TanStack Query hook for GET /api/v1/resumes/[id].
 *
 * Usage:
 *   const { data: resume, isPending, isError } = useResume(id)
 *
 * Query key: ['resume', id]
 * Only fires when `id` is non-empty.
 */
export function useResume(id: string) {
  return useQuery({
    queryKey: ['resume', id],
    queryFn: () => fetchResume(id),
    enabled: Boolean(id),
  });
}
