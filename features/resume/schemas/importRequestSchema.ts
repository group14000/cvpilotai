import { z } from 'zod';

// ─── Allowed MIME types ───────────────────────────────────────────────────────

export const ALLOWED_IMPORT_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type AllowedImportMimeType = (typeof ALLOWED_IMPORT_MIME_TYPES)[number];

// ─── Max file size ────────────────────────────────────────────────────────────

/** 5 MB — real resumes are 50–500 KB; this is a very generous upper bound. */
export const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// ─── Zod schema ───────────────────────────────────────────────────────────────

export const importRequestSchema = z.object({
  file: z
    .instanceof(File, { message: 'A file is required' })
    .refine(
      (f) => f.size <= MAX_IMPORT_FILE_SIZE_BYTES,
      'File must be under 5 MB'
    )
    .refine(
      (f) => (ALLOWED_IMPORT_MIME_TYPES as readonly string[]).includes(f.type),
      'Only PDF and DOCX files are supported'
    ),
});

export type ImportRequestInput = z.infer<typeof importRequestSchema>;
