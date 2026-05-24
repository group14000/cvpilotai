'use client';

import { useQuery } from '@tanstack/react-query';
import axios, { isAxiosError } from 'axios';

// ─── API response shapes ──────────────────────────────────────────────────────

/** Template metadata shape as returned over the wire (slug, name, thumbnail). */
type ResumeTemplateInfoJSON = {
  id: string;
  slug: string;
  name: string;
  thumbnail: string | null;
};

/**
 * Lightweight resume item as returned by GET /api/v1/resumes.
 * Date fields are ISO strings (JSON serialisation of Prisma DateTime).
 */
export type ResumeListItemJSON = {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  template: ResumeTemplateInfoJSON;
};

type ListResumesSuccess = {
  success: true;
  data: { resumes: ResumeListItemJSON[] };
};

type ListResumesError = {
  success: false;
  error: string;
};

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchResumes(): Promise<ResumeListItemJSON[]> {
  try {
    const { data } = await axios.get<ListResumesSuccess>('/api/v1/resumes');
    return data.data.resumes;
  } catch (error) {
    if (isAxiosError<ListResumesError>(error)) {
      throw new Error(error.response?.data?.error ?? 'Failed to fetch resumes');
    }
    throw error;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * TanStack Query hook for GET /api/v1/resumes.
 *
 * Usage:
 *   const { data: resumes, isPending, isError } = useResumes()
 *
 * Query key: ['resumes']
 * Invalidated by useCreateResume() onSuccess.
 */
export function useResumes() {
  return useQuery({
    queryKey: ['resumes'],
    queryFn: fetchResumes,
  });
}
