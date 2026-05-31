'use client';

import { useMutation } from '@tanstack/react-query';
import axios, { isAxiosError } from 'axios';
import type { ImportedResumeData } from '@/features/resume/services/importService';

// ─── API response shapes ──────────────────────────────────────────────────────

type ImportResumeSuccess = {
  success: true;
  data: { resume: ImportedResumeData };
  message: string;
};

type ImportResumeError = {
  success: false;
  error: string;
};

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function postImportResume(file: File): Promise<ImportedResumeData> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const { data } = await axios.post<ImportResumeSuccess>(
      '/api/v1/resumes/import',
      formData
      // Note: do NOT set Content-Type header manually — axios sets multipart/form-data
      // with the correct boundary automatically when FormData is the body.
    );
    return data.data.resume;
  } catch (error) {
    if (isAxiosError<ImportResumeError>(error)) {
      throw new Error(error.response?.data?.error ?? 'Import failed');
    }
    throw error;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * TanStack Query mutation for POST /api/v1/resumes/import.
 *
 * Usage:
 *   const { mutate: importResume, isPending, error, data } = useImportResume()
 *   importResume(file)  // File from <input type="file"> or drag-and-drop
 *
 * On success: `data` contains ImportedResumeData (no id/templateId).
 * The caller is responsible for calling hydrateResume({ ...data, id: 'preview-draft', templateId })
 * to populate the Zustand store.
 *
 * retry: false — AI calls must not auto-retry (free-tier failures can last
 * minutes; double-requesting wastes token budget).
 *
 * No cache invalidation — import makes NO database writes.
 * The DB is only written when the user clicks Save (useCreateResume / useUpdateResume).
 */
export function useImportResume() {
  return useMutation<ImportedResumeData, Error, File>({
    mutationFn: postImportResume,
    retry: false,
  });
}
