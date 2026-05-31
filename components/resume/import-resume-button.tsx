'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportResumeDialog } from './import-resume-dialog';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  templateSlug: string;
};

/**
 * Trigger button for the Import Resume dialog.
 *
 * Placement: editor top bar on the create-resume/[slug] page, to the left
 * of the Save button.
 *
 * Renders a ghost button that opens <ImportResumeDialog>. The dialog handles
 * the full upload → AI extraction → preview → hydrate flow.
 */
export function ImportResumeButton({ templateSlug }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Upload className="h-3.5 w-3.5" />
        Import Resume
      </Button>

      <ImportResumeDialog
        templateSlug={templateSlug}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
