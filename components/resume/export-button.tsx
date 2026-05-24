'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Props = {
  /** The DB resume id used to construct the export URL. */
  resumeId: string;
  /** The resume title, used for the default download filename hint in the toast. */
  resumeTitle: string;
};

/**
 * "Download PDF" button for a saved resume.
 *
 * Triggers GET /api/v1/resumes/[id]/export which returns a binary PDF stream.
 * Uses a programmatic fetch so we can show a loading spinner while Playwright
 * is generating the PDF (typically 1–3 seconds).
 *
 * On success: creates a temporary <a> element to trigger the browser save
 * dialog.  On error (e.g. rate limit): shows a sonner error toast.
 *
 * Usage:
 *   <ExportButton resumeId={resume.id} resumeTitle={resume.title} />
 */
export function ExportButton({ resumeId, resumeTitle }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleExport() {
    if (isGenerating) return;

    setIsGenerating(true);

    try {
      const res = await fetch(`/api/v1/resumes/${resumeId}/export`);

      if (!res.ok) {
        // Try to parse the JSON error body
        const json = await res.json().catch(() => null);
        const msg =
          (json as { error?: string } | null)?.error ??
          'Failed to generate PDF';
        toast.error('Export failed', { description: msg });
        return;
      }

      // Convert binary response to an object URL and trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${resumeTitle || 'resume'}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();

      // Clean up the temporary DOM element and object URL
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success('PDF downloaded!');
    } catch {
      toast.error('Export failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button
      size="sm"
      className="gap-1.5"
      onClick={handleExport}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {isGenerating ? 'Generating…' : 'Download PDF'}
    </Button>
  );
}
