'use client';

import { TEMPLATE_COMPONENTS } from '@/components/templates';
import { useResumeStore } from '@/store/resume-store';

type Props = {
  /** The template id from the URL slug (e.g. "classic", "prime-ats"). */
  slug: string;
};

export function ResumePreview({ slug }: Props) {
  const resume = useResumeStore((s) => s.resume);

  const Template = TEMPLATE_COMPONENTS[slug];

  if (!Template) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Template &quot;{slug}&quot; not found.
        </p>
      </div>
    );
  }

  return (
    /*
     * A4 outer wrapper:
     *   w-[794px]  = 210 mm at 96 dpi — the standard A4 width
     *   The template itself supplies min-h-[1123px] (297 mm at 96 dpi).
     *   overflow-hidden clips anything the template accidentally overflows.
     *   shadow-xl + ring gives the "paper" effect inside the preview panel.
     */
    <div className="ring-border mx-auto w-[794px] overflow-hidden rounded-sm shadow-xl ring-1">
      <Template resume={resume} />
    </div>
  );
}
