'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios, { isAxiosError } from 'axios';

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
 * Uses axios with responseType: 'arraybuffer' so the binary PDF is received
 * intact. On error (JSON body), the ArrayBuffer is decoded back to text and
 * parsed to extract the user-facing error message.
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
      // responseType: 'arraybuffer' — receives binary PDF data intact.
      // Axios throws on non-2xx status; the error body (JSON) is also an
      // ArrayBuffer in this mode and is decoded in the catch block below.
      const { data } = await axios.get<ArrayBuffer>(
        `/api/v1/resumes/${resumeId}/export`,
        { responseType: 'arraybuffer' }
      );

      // Convert ArrayBuffer → Blob → object URL → trigger download
      const blob = new Blob([data], { type: 'application/pdf' });
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
    } catch (error) {
      // When responseType is 'arraybuffer', Axios error bodies are also
      // ArrayBuffers — decode them back to text to extract the JSON message.
      if (isAxiosError(error) && error.response?.data instanceof ArrayBuffer) {
        try {
          const text = new TextDecoder().decode(error.response.data);
          const json = JSON.parse(text) as { error?: string };
          toast.error('Export failed', {
            description: json.error ?? 'Failed to generate PDF',
          });
          return;
        } catch {
          // JSON parsing failed — fall through to generic message
        }
      }

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
