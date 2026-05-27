'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Error Boundary ───────────────────────────────────────────────────────────
//
// React error boundaries must be class components — hooks cannot catch render
// errors. This boundary wraps sections of the editor (ResumePreview,
// ResumeForm) so a crash in one section doesn't destroy the entire editor or
// cause users to lose unsaved work.
//
// Usage:
//   <EditorErrorBoundary label="Resume Preview">
//     <ResumePreview slug={slug} />
//   </EditorErrorBoundary>

type Props = {
  children: React.ReactNode;
  /** Short description of the failing section — shown in the fallback UI. */
  label?: string;
  /** Optional custom fallback to render instead of the default error UI. */
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage: string | null;
};

export class EditorErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Log to console in structured format — same pattern as other error logs.
    // Never log full component stacks in production (can contain user data
    // embedded in prop paths), but do log the error message and component name.
    console.error(
      '[EditorErrorBoundary]',
      JSON.stringify({
        label: this.props.label ?? 'unknown',
        errorClass: error instanceof Error ? error.constructor.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        componentStack: info.componentStack
          ?.split('\n')
          .slice(0, 5)
          .join(' | '),
      })
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <DefaultFallback
          label={this.props.label}
          message={this.state.errorMessage}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// ─── Default fallback UI ──────────────────────────────────────────────────────

function DefaultFallback({
  label,
  message,
  onReset,
}: {
  label?: string;
  message: string | null;
  onReset: () => void;
}) {
  return (
    <div className="flex h-full min-h-48 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center">
      <AlertTriangle className="text-destructive h-8 w-8" />
      <div className="space-y-1">
        <p className="text-foreground text-sm font-semibold">
          {label ? `${label} failed to render` : 'Something went wrong'}
        </p>
        {message && (
          <p className="text-muted-foreground max-w-xs text-xs">{message}</p>
        )}
      </div>
      <Button variant="outline" size="sm" className="gap-2" onClick={onReset}>
        <RefreshCw className="h-3.5 w-3.5" />
        Try again
      </Button>
    </div>
  );
}
