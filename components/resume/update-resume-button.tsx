'use client';

import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResumeStore } from '@/store/resume-store';
import { useUpdateResume } from '@/hooks/use-update-resume';

type Props = {
  /** The DB resume id — known at edit-page render time, never "preview-draft". */
  resumeId: string;
};

/**
 * "Save Changes" button for the edit page.
 *
 * Reads the current resume from Zustand, auto-generates a title from
 * personalInfo, and fires PATCH /api/v1/resumes/[id].
 *
 * Unlike SaveResumeButton (which gates on `isAlreadySaved`), this button
 * is always active — the resume is always saved and always re-saveable.
 *
 * Loading state: spinner + "Saving…" label while `isPending`.
 */
export function UpdateResumeButton({ resumeId }: Props) {
  const resume = useResumeStore((s) => s.resume);
  const { mutate: saveChanges, isPending } = useUpdateResume(resumeId);

  function handleSave() {
    if (isPending) return;

    const {
      personalInfo,
      summary,
      experiences,
      skills,
      projects,
      education,
      certifications,
    } = resume;

    // Auto-generate title from name (same logic as SaveResumeButton)
    const firstName = personalInfo.firstName.trim();
    const lastName = personalInfo.lastName.trim();
    const title =
      firstName || lastName
        ? `${firstName} ${lastName} Resume`.trim()
        : undefined; // undefined → service preserves existing title

    saveChanges({
      data: {
        personalInfo,
        summary,
        experiences,
        skills,
        projects,
        education,
        certifications,
      },
      ...(title ? { title } : {}),
    });
  }

  return (
    <Button
      size="sm"
      className="gap-2"
      onClick={handleSave}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Save className="h-3.5 w-3.5" />
      )}
      {isPending ? 'Saving…' : 'Save Changes'}
    </Button>
  );
}
