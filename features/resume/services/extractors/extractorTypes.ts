// ─── Extractor result type ────────────────────────────────────────────────────

export type ExtractionResult = {
  /** Raw plain text extracted from the file. */
  text: string;
  /** Whether the text was truncated to the 15,000-char limit. */
  wasTruncated: boolean;
  /** Number of pages (PDF) or undefined (DOCX). */
  pageCount?: number;
};
