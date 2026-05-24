'use client';

import { useQuery } from '@tanstack/react-query';

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

type ListResumesResponse = ListResumesSuccess | ListResumesError;

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchResumes(): Promise<ResumeListItemJSON[]> {
  const res = await fetch('/api/v1/resumes');
  const json: ListResumesResponse = await res.json();

  if (!res.ok || !json.success) {
    const msg = (json as ListResumesError).error ?? 'Failed to fetch resumes';
    throw new Error(msg);
  }

  return (json as ListResumesSuccess).data.resumes;
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
