'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { resumeTemplates } from '@/components/constants/resume-templates';

const ResumeCreate: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const templateId = params.slug as string;

  const selectedTemplate = resumeTemplates.find((t) => t.id === templateId);

  const [resumeTitle, setResumeTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateResume = async () => {
    if (!resumeTitle.trim()) {
      alert('Please enter a resume title');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Create resume with selected template
      // This will be implemented with your backend API
      console.log('Creating resume:', {
        title: resumeTitle,
        template: templateId,
      });

      // Redirect to resume editor
      // router.push(`/resumes/edit/${resumeId}`);
    } catch (error) {
      console.error('Failed to create resume:', error);
      alert('Failed to create resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedTemplate) {
    return (
      <ScrollArea className="h-[calc(100vh-4rem)] px-6 md:px-8">
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground">Template not found</p>
                <Button
                  onClick={() => router.push('/resumes/new')}
                  variant="outline"
                >
                  Select a template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] px-6 md:px-8">
      {/* Header */}
      <header className="border-border flex flex-col gap-6 border-b py-6">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground w-fit gap-2 pl-0 transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-3xl font-bold tracking-tight md:text-4xl">
            Create New Resume
          </h1>
          <p className="text-muted-foreground text-sm font-medium md:text-base">
            Set up your resume using the{' '}
            <span className="font-semibold">{selectedTemplate.name}</span>{' '}
            template
          </p>
        </div>
      </header>

      {/* Main Content */}
      <section className="mx-auto max-w-4xl py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Template Preview */}
          <div className="flex flex-col gap-4">
            <div className="text-foreground text-sm font-semibold">
              Template Preview
            </div>
            <Card className="overflow-hidden">
              <div className="bg-muted relative aspect-9/12 w-full overflow-hidden">
                {selectedTemplate.image && (
                  <img
                    src={selectedTemplate.image}
                    alt={selectedTemplate.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </Card>
            <p className="text-muted-foreground text-xs">
              {selectedTemplate.description}
            </p>
          </div>

          {/* Resume Setup Form */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resume Details</CardTitle>
                <CardDescription>
                  Give your resume a title to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Resume Title Input */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold">
                    Resume Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Software Engineer Role"
                    value={resumeTitle}
                    onChange={(e) => setResumeTitle(e.target.value)}
                    className="h-10"
                  />
                  <p className="text-muted-foreground text-xs">
                    Choose a descriptive title to remember this version
                  </p>
                </div>

                {/* Template Summary */}
                <div className="bg-muted/50 space-y-3 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                      <FileText className="text-primary h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground text-sm font-semibold">
                        {selectedTemplate.name}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/resumes/new')}
                    className="flex-1"
                  >
                    Change Template
                  </Button>
                  <Button
                    onClick={handleCreateResume}
                    disabled={!resumeTitle.trim() || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Creating...' : 'Create Resume'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200/50 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/20">
              <CardContent className="pt-6">
                <p className="text-xs text-blue-900 dark:text-blue-200">
                  <span className="font-semibold">💡 Tip:</span> You can change
                  your template anytime, and your content will be preserved.
                  Start adding your information once your resume is created.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </ScrollArea>
  );
};

export default ResumeCreate;
