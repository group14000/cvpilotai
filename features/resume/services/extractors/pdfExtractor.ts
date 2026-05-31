// SERVER-ONLY — never import in client components.
// pdfjs-dist is in serverExternalPackages (next.config.ts).
// We use the LEGACY build which is designed for Node.js environments and
// does not require browser APIs like DOMMatrix.

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { ResumeExtractionError } from '@/features/ai/types';
import type { ExtractionResult } from './extractorTypes';

// ─── Magic bytes ──────────────────────────────────────────────────────────────

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF

function hasPdfMagicBytes(buffer: ArrayBuffer): boolean {
  const view = new Uint8Array(buffer, 0, 4);
  return PDF_MAGIC.every((byte, i) => view[i] === byte);
}

// ─── Text extraction ──────────────────────────────────────────────────────────

const MAX_CHARS = 15_000;

/**
 * Extract plain text from a PDF ArrayBuffer using pdfjs-dist legacy build.
 *
 * Uses the legacy build (pdfjs-dist/legacy) which is Node.js compatible and
 * does not require browser-only APIs (DOMMatrix, OffscreenCanvas, etc.).
 *
 * Security:
 *   - disableFontFace: true — skips font loading (text-only extraction)
 *   - verbosity: 0          — suppress pdfjs console output
 *   - Magic bytes checked before parsing to reject non-PDF uploads
 *
 * @throws {ResumeExtractionError} if magic bytes don't match or parsing fails
 */
export async function extractPdfText(
  arrayBuffer: ArrayBuffer
): Promise<ExtractionResult> {
  if (!hasPdfMagicBytes(arrayBuffer)) {
    throw new ResumeExtractionError(
      'pdf',
      'File does not appear to be a valid PDF'
    );
  }

  // Dynamic import with turbopackIgnore so the bundler skips static resolution.
  // At runtime, Node.js loads the ESM file directly from node_modules.
  // The legacy build is required for Node.js — main build requires DOMMatrix.
  const pdfjsLib = (await import(
    /* webpackIgnore: true */
    /* turbopackIgnore: true */
    'pdfjs-dist/legacy/build/pdf.mjs' as string
  )) as unknown as typeof import('pdfjs-dist');

  // pdf.js needs GlobalWorkerOptions.workerSrc set to a real worker file.
  // In Node.js it runs a "fake worker" on the main thread, but it still
  // dynamically imports the worker module from this path. An empty string is
  // falsy and triggers: "Setting up fake worker failed: No workerSrc specified".
  // Resolve the legacy worker module from node_modules at runtime, then convert
  // to a file:// URL — Windows absolute paths fail ESM dynamic import otherwise.
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    const requireFromHere = createRequire(import.meta.url);
    // Build the specifier at runtime so the bundler can't statically resolve
    // it — pdfjs-dist is ESM-only and in serverExternalPackages, so a static
    // require()/require.resolve() of it makes Turbopack warn/fail. .resolve()
    // only returns a path string; the module is never require()'d.
    const workerSpecifier = [
      'pdfjs-dist',
      'legacy',
      'build',
      'pdf.worker.mjs',
    ].join('/');
    const workerPath = requireFromHere.resolve(workerSpecifier);
    pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  }

  let doc: Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']>;
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      disableFontFace: true,
      verbosity: 0,
    });
    doc = await loadingTask.promise;
  } catch (err) {
    throw new ResumeExtractionError(
      'pdf',
      err instanceof Error ? err.message : 'Failed to load PDF document'
    );
  }

  let extractedText = '';
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .join(' ');
    extractedText += pageText + '\n';
  }

  const trimmed = extractedText.trim();
  const wasTruncated = trimmed.length > MAX_CHARS;

  return {
    text: trimmed.slice(0, MAX_CHARS),
    wasTruncated,
    pageCount: doc.numPages,
  };
}
