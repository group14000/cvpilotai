'use client';

type KeywordBadgeVariant = 'matched' | 'missing' | 'neutral';

type Props = {
  keyword: string;
  variant: KeywordBadgeVariant;
};

/**
 * Reusable keyword pill used in the Analysis panel.
 *
 * - matched  → green background (keyword already in resume)
 * - missing  → orange background (keyword in JD but not in resume)
 * - neutral  → gray background (extracted from JD, not yet evaluated)
 */
export function KeywordBadge({ keyword, variant }: Props) {
  const variantClasses: Record<KeywordBadgeVariant, string> = {
    matched:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    missing:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    neutral: 'bg-muted text-muted-foreground',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {keyword}
    </span>
  );
}
