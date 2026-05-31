// SERVER-ONLY — orchestrates file extraction + AI normalization.

import { extractPdfText } from './extractors/pdfExtractor';
import { extractDocxText } from './extractors/docxExtractor';
import { ResumeExtractionError } from '@/features/ai/types';
import { normalizeImportedResume } from '@/features/ai/services/resumeImportNormalizationService';
import type { ImportedResumeData } from '@/features/ai/services/resumeImportNormalizationService';

export type { ImportedResumeData };

// ─── MIME type → format ───────────────────────────────────────────────────────

type SupportedFormat = 'pdf' | 'docx';

const MIME_TO_FORMAT: Record<string, SupportedFormat> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
};

// ─── Main service function ────────────────────────────────────────────────────

/**
 * Import and normalize a resume file into the internal schema.
 *
 * Pipeline:
 *   1. Detect format from MIME type
 *   2. Extract text (PDF via pdfjs-dist, DOCX via mammoth)
 *   3. Log truncation warning if text was capped at 15,000 chars
 *   4. Send to AI normalization pipeline
 *   5. Return ImportedResumeData
 *
 * This function makes NO database writes. The result is returned to the
 * client which displays it in the editor. The user saves it explicitly.
 *
 * @param arrayBuffer - File bytes read server-side
 * @param mimeType    - MIME type from the uploaded File object
 * @param userId      - DB user.id (for AI logging only)
 *
 * @throws {ResumeExtractionError}      if text extraction fails
 * @throws {Error}                      if MIME type is unsupported
 * @throws {AiImportEmptyResponseError} if AI returns no content
 * @throws {AiImportParseError}         if AI returns non-JSON
 * @throws {AiImportValidationError}    if AI JSON fails schema validation
 */
export async function importResume(
  arrayBuffer: ArrayBuffer,
  mimeType: string,
  userId: string
): Promise<ImportedResumeData> {
  const format = MIME_TO_FORMAT[mimeType];
  if (!format) {
    throw new ResumeExtractionError(
      'pdf',
      `Unsupported file type: ${mimeType}`
    );
  }

  // ── Extract text ──────────────────────────────────────────────────────────
  const extraction =
    format === 'pdf'
      ? await extractPdfText(arrayBuffer)
      : await extractDocxText(arrayBuffer);

  if (!extraction.text || extraction.text.trim().length === 0) {
    throw new ResumeExtractionError(
      format,
      'No text could be extracted from this file. It may be a scanned image — please upload a text-based PDF or DOCX.'
    );
  }

  if (extraction.wasTruncated) {
    console.warn(
      '[AI:import]',
      JSON.stringify({
        event: 'text_truncated',
        format,
        truncatedTo: 15000,
      })
    );
  }

  // ── AI normalization ──────────────────────────────────────────────────────
  return normalizeImportedResume(extraction.text, userId);
}
