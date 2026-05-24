'use client';

import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResumeStore } from '@/store/resume-store';
import { useCreateResume } from '@/hooks/use-create-resume';
import type { ResumeCreatedResponse } from '@/features/resume/types';

type Props = {
  /** The template slug from the URL (e.g. "classic"). */
  templateSlug: string;
};

/**
 * "Save Resume" button wired to the Zustand store + TanStack Query mutation.
 *
 * On click:
 *   1. Reads the current resume from the Zustand store
 *   2. Auto-generates a title from personalInfo.firstName + lastName
 *   3. Fires POST /api/v1/resumes
 *   4. On success: updates Zustand store id with the real DB id, shows toast
 *
 * Disabled when `isPending` (shows spinner).
 * Disabled once saved (resume.id is no longer "preview-draft").
 */
export function SaveResumeButton({ templateSlug }: Props) {
  const router = useRouter();
  const resume = useResumeStore((s) => s.resume);
  const setTemplate = useResumeStore((s) => s.setTemplate);

  const isAlreadySaved = resume.id !== 'preview-draft';

  function handleSuccess(saved: ResumeCreatedResponse) {
    // Update the Zustand store with the real DB id so future saves
    // (PATCH) know this resume is persisted. Also sync the DB templateId.
    useResumeStore.setState((s) => ({
      resume: {
        ...s.resume,
        id: saved.id,
        templateId: saved.templateId,
      },
    }));

    // Redirect to the resumes list so the user can see their saved resume.
    router.push('/resumes');
  }

  const { mutate: saveResume, isPending } = useCreateResume({
    onSuccess: handleSuccess,
  });

  function handleSave() {
    if (isPending || isAlreadySaved) return;

    const {
      personalInfo,
      summary,
      experiences,
      skills,
      projects,
      education,
      certifications,
    } = resume;

    // Auto-generate a title from the user's name.
    const firstName = personalInfo.firstName.trim();
    const lastName = personalInfo.lastName.trim();
    const title =
      firstName || lastName
        ? `${firstName} ${lastName} Resume`.trim()
        : 'My Resume';

    saveResume({
      title,
      templateSlug,
      data: {
        personalInfo,
        summary,
        experiences,
        skills,
        projects,
        education,
        certifications,
      },
    });
  }

  if (isAlreadySaved) {
    return (
      <Button variant="outline" size="sm" className="gap-2" disabled>
        <Save className="h-3.5 w-3.5" />
        Saved
      </Button>
    );
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
      {isPending ? 'Saving…' : 'Save Resume'}
    </Button>
  );
}
