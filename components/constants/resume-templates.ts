export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  image: string;
}

export const resumeTemplates: ResumeTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description:
      'Classically structured resume template, for a robust career history.',
    image: '/resume-templates/classic.jpg',
  },
  {
    id: 'traditional',
    name: 'Traditional',
    description:
      'Classic full-page resume template with sizable resume sections.',
    image: '/resume-templates/traditional.jpg',
  },
];
