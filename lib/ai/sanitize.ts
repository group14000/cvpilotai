// ─── Input / output sanitizers ────────────────────────────────────────────────
//
// SERVER-ONLY utilities. Called before user content enters a prompt and after
// AI content exits the model. Never import in client components.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sanitize a raw job description before embedding it in an AI prompt.
 *
 * Defends against prompt injection by:
 *   1. Stripping all HTML tags (removes <script>, styled text, etc.)
 *   2. Removing null bytes and dangerous control characters
 *   3. Removing Unicode direction-override characters (LRO/RLO injection)
 *   4. Normalizing excessive whitespace (collapses 3+ newlines → 2)
 *   5. Hard-truncating to 8,000 characters after all other transformations
 *
 * The job description is also wrapped in <job_description> XML delimiters
 * by the prompt builder — this sanitizer is a pre-pass, not the only defense.
 */
export function sanitizeJobDescription(raw: string): string {
  let text = raw;

  // Strip all HTML tags
  text = text.replace(/<[^>]*>/g, ' ');

  // Remove null bytes
  text = text.replace(/\x00/g, '');

  // Remove control characters except tab, newline, carriage return
  // eslint-disable-next-line no-control-regex
  text = text.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Remove Unicode direction-override characters (U+202A–U+202E, U+2066–U+2069)
  // These are used in "bidirectional text injection" attacks
  text = text.replace(/[‪-‮⁦-⁩]/g, '');

  // Normalize excessive newlines (collapse 3+ → 2)
  text = text.replace(/\n{3,}/g, '\n\n');

  // Collapse multiple consecutive spaces to single space on each line
  text = text.replace(/ {2,}/g, ' ');

  // Trim and hard-truncate to 8,000 characters
  text = text.trim().slice(0, 8000);

  return text;
}

/**
 * Sanitize raw text extracted from an uploaded resume file before it is
 * embedded in an AI import prompt.
 *
 * Same defensive transforms as sanitizeJobDescription plus a hard-truncation
 * at 15,000 characters (covers even verbose 3-page CVs while capping token cost).
 *
 * Applied BEFORE the text is wrapped in <resume_text> XML delimiters.
 */
export function sanitizeResumeText(raw: string): string {
  let text = raw;

  // Strip all HTML tags
  text = text.replace(/<[^>]*>/g, ' ');

  // Remove null bytes
  text = text.replace(/\x00/g, '');

  // Remove control characters except tab, newline, carriage return
  // eslint-disable-next-line no-control-regex
  text = text.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Remove Unicode direction-override characters (bidirectional injection)
  text = text.replace(/[‪-‮⁦-⁩]/g, '');

  // Normalize excessive newlines
  text = text.replace(/\n{3,}/g, '\n\n');

  // Collapse multiple consecutive spaces
  text = text.replace(/ {2,}/g, ' ');

  // Trim and hard-truncate to 15,000 characters
  text = text.trim().slice(0, 15000);

  return text;
}

/**
 * Sanitize a string from AI output before it reaches the Zustand store or UI.
 *
 * Defense-in-depth: even if the AI returns unexpected content, this strips:
 *   1. All HTML tags (prevents stored XSS if content is ever rendered as HTML)
 *   2. Markdown syntax (bold, italic, headers) — UI renders plain text
 *   3. Null bytes and control characters
 *   4. Multiple consecutive spaces
 *
 * Applied to EVERY string field in the validated AI response object.
 */
export function sanitizeAiTextOutput(raw: string): string {
  let text = raw;

  // Strip HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Strip markdown bold (**text** or __text__)
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');

  // Strip markdown italic (*text* or _text_) — careful not to strip bullets
  // Only strip when surrounded by word-boundary-like context
  text = text.replace(/(?<!\w)\*((?!\s).*?(?<!\s))\*(?!\w)/g, '$1');
  text = text.replace(/(?<!\w)_((?!\s).*?(?<!\s))_(?!\w)/g, '$1');

  // Strip markdown headers (# ## ### etc. at line start)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Strip markdown code fences
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove null bytes and control characters except tab, newline, carriage return
  // eslint-disable-next-line no-control-regex
  text = text.replace(/\x00/g, '');
  // eslint-disable-next-line no-control-regex
  text = text.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Collapse multiple consecutive spaces
  text = text.replace(/ {2,}/g, ' ');

  // Trim
  text = text.trim();

  return text;
}
