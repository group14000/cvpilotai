/**
 * Generate a URL-safe slug for a resume.
 *
 * Strategy:
 * 1. Lowercase and strip non-alphanumeric characters from the title
 * 2. Replace whitespace with hyphens, collapse multiple hyphens
 * 3. Trim to 50 characters max (to stay well under DB limits)
 * 4. Append a random 6-character suffix so two resumes with the same
 *    title never collide (the @@unique([userId, slug]) constraint on
 *    Resume would otherwise cause a Prisma P2002 error)
 *
 * Example: "My Senior Dev Resume" → "my-senior-dev-resume-a3k9f2"
 */
export function generateResumeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // strip special chars
    .replace(/\s+/g, '-') // spaces → hyphens
    .replace(/-{2,}/g, '-') // collapse repeated hyphens
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .slice(0, 50);

  // crypto is available in Node 14.17+ — Next.js runs on Node 18+
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 6);

  return base ? `${base}-${suffix}` : suffix;
}
