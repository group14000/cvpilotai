'use client';

import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDeleteResume } from '@/hooks/use-delete-resume';

type Props = {
  /** DB resume id — passed from ResumeCard. */
  resumeId: string;
  /** Resume title — shown in the confirmation dialog for context. */
  resumeTitle: string;
};

/**
 * "Delete" button with an AlertDialog confirmation step.
 *
 * Flow:
 *   1. User clicks the trigger button → AlertDialog opens
 *   2. "Cancel"  → dialog closes, no action
 *   3. "Delete"  → mutation fires (spinner on confirm button)
 *   4. Success   → dialog closes automatically (cache invalidation hides the card)
 *   5. Error     → dialog stays open, sonner toast shows the error message
 *
 * Why AlertDialog (not window.confirm)?
 *   - `window.confirm` is blocked in some environments (iframes, Electron)
 *   - AlertDialog matches the app's ShadCN design system
 *   - Proper focus trap + ARIA roles for accessibility
 *   - Themed and customisable (dark mode safe)
 *
 * The confirm button is disabled while isPending to prevent double-clicks.
 */
export function DeleteResumeButton({ resumeId, resumeTitle }: Props) {
  const { mutate: deleteResume, isPending } = useDeleteResume();

  function handleConfirmDelete() {
    deleteResume(resumeId);
  }

  return (
    <AlertDialog>
      {/* ── Trigger — the "Delete" button in the card ──────────────────── */}
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </AlertDialogTrigger>

      {/* ── Confirmation dialog ────────────────────────────────────────── */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete resume?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="text-foreground font-medium">
              &ldquo;{resumeTitle}&rdquo;
            </span>{' '}
            will be permanently deleted. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>

          <AlertDialogAction
            onClick={handleConfirmDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
