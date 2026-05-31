// SERVER-ONLY — never import in client components.
// Uses mammoth for DOCX text extraction. Mammoth strips macros automatically,
// handles tables/lists/headers, and is pure JS (no native binaries).

import { ResumeExtractionError } from '@/features/ai/types';
import type { ExtractionResult } from './extractorTypes';

// ─── Magic bytes ──────────────────────────────────────────────────────────────

// DOCX is a ZIP archive — first bytes are PK\x03\x04
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];

function hasDocxMagicBytes(buffer: ArrayBuffer): boolean {
  const view = new Uint8Array(buffer, 0, 4);
  return ZIP_MAGIC.every((byte, i) => view[i] === byte);
}

// ─── Text extraction ──────────────────────────────────────────────────────────

const MAX_CHARS = 15_000;

/**
 * Extract plain text from a DOCX ArrayBuffer using mammoth.
 *
 * Security:
 *   - Mammoth parses the ZIP/XML structure only — no macro execution
 *   - File size limit enforced upstream (5 MB) prevents ZIP bomb impact
 *
 * @throws {ResumeExtractionError} if magic bytes don't match or parsing fails
 */
export async function extractDocxText(
  arrayBuffer: ArrayBuffer
): Promise<ExtractionResult> {
  if (!hasDocxMagicBytes(arrayBuffer)) {
    throw new ResumeExtractionError(
      'docx',
      'File does not appear to be a valid DOCX'
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mammoth = require('mammoth') as typeof import('mammoth');

  let result: Awaited<ReturnType<typeof mammoth.extractRawText>>;
  try {
    result = await mammoth.extractRawText({ arrayBuffer });
  } catch (err) {
    throw new ResumeExtractionError(
      'docx',
      err instanceof Error ? err.message : 'Failed to parse DOCX document'
    );
  }

  const trimmed = result.value.trim();

  if (!trimmed) {
    throw new ResumeExtractionError(
      'docx',
      'DOCX contains no extractable text'
    );
  }

  const wasTruncated = trimmed.length > MAX_CHARS;

  return {
    text: trimmed.slice(0, MAX_CHARS),
    wasTruncated,
  };
}
