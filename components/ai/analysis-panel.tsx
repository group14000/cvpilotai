'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { KeywordBadge } from './keyword-badge';

type Analysis = {
  extractedKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  atsScore: number;
  seniorityLevel: string;
  improvementSuggestions: string[];
};

type Props = {
  analysis: Analysis;
};

/**
 * Analysis panel shown in the "Analysis" tab of the optimization dialog.
 *
 * Sections:
 *   1. ATS Score — circular SVG indicator, color-coded (red/yellow/green)
 *   2. Seniority Match — detected level badge
 *   3. Matched Keywords — green KeywordBadge list
 *   4. Missing Keywords — orange KeywordBadge list
 *   5. Improvement Suggestions — numbered list in ScrollArea
 */
export function AnalysisPanel({ analysis }: Props) {
  const {
    atsScore,
    seniorityLevel,
    matchedKeywords,
    missingKeywords,
    improvementSuggestions,
  } = analysis;

  return (
    <div className="space-y-6 py-2">
      {/* ── ATS Score + Seniority ─────────────────────────────────────────── */}
      <div className="flex items-center gap-6">
        <AtsScoreRing score={atsScore} />
        <div className="space-y-1">
          <p className="text-foreground text-sm font-semibold">
            ATS Match Score
          </p>
          <p className="text-muted-foreground text-xs">
            How well your resume matches this job description
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Seniority:</span>
            <Badge variant="secondary" className="text-xs">
              {seniorityLevel}
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Matched Keywords ──────────────────────────────────────────────── */}
      {matchedKeywords.length > 0 && (
        <div className="space-y-2">
          <p className="text-foreground text-sm font-medium">
            Matched Keywords
            <span className="text-muted-foreground ml-1.5 font-normal">
              ({matchedKeywords.length})
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {matchedKeywords.map((kw) => (
              <KeywordBadge key={kw} keyword={kw} variant="matched" />
            ))}
          </div>
        </div>
      )}

      {/* ── Missing Keywords ──────────────────────────────────────────────── */}
      {missingKeywords.length > 0 && (
        <div className="space-y-2">
          <p className="text-foreground text-sm font-medium">
            Missing Keywords
            <span className="text-muted-foreground ml-1.5 font-normal">
              ({missingKeywords.length})
            </span>
          </p>
          <p className="text-muted-foreground text-xs">
            Keywords from the job description not found in your resume
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missingKeywords.map((kw) => (
              <KeywordBadge key={kw} keyword={kw} variant="missing" />
            ))}
          </div>
        </div>
      )}

      {/* ── Improvement Suggestions ───────────────────────────────────────── */}
      {improvementSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-foreground text-sm font-medium">
            Improvement Suggestions
          </p>
          <ScrollArea className="h-48">
            <ol className="space-y-2 pr-4">
              {improvementSuggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="bg-muted text-muted-foreground mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                    {i + 1}
                  </span>
                  <p className="text-foreground text-sm leading-relaxed">
                    {suggestion}
                  </p>
                </li>
              ))}
            </ol>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

// ─── ATS Score Ring ───────────────────────────────────────────────────────────

function AtsScoreRing({ score }: { score: number }) {
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 70
      ? '#10b981' // emerald-500
      : score >= 40
        ? '#f59e0b' // amber-500
        : '#ef4444'; // red-500

  const label = score >= 70 ? 'Good' : score >= 40 ? 'Fair' : 'Low';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-foreground text-lg leading-none font-bold">
          {score}
        </span>
        <span className="text-muted-foreground text-xs">{label}</span>
      </div>
    </div>
  );
}
