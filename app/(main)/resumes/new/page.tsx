'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft } from 'lucide-react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { resumeTemplates } from '@/components/constants/resume-templates';
import { ResumeTemplateCard } from '@/components/resume/template-card';

const NewResume: React.FC = () => {
  const router = useRouter();

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] px-6 md:px-8">
      {/* Header with Back Button */}
      <header className="border-border flex flex-col gap-6 border-b py-6">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground w-fit cursor-pointer gap-2 pl-0 transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">
            Pick a template
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm font-medium md:text-base">
            You can switch templates anytime — your content stays the same.
          </p>
        </div>
      </header>

      {/* Templates Grid */}
      <section className="py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resumeTemplates.map((template) => (
            <ResumeTemplateCard
              key={template.id}
              slug={template.id}
              title={template.name}
              description={template.description}
              image={template.image}
            />
          ))}
        </div>
      </section>
    </ScrollArea>
  );
};

export default NewResume;
