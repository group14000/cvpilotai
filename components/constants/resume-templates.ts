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
  {
    id: 'professional',
    name: 'Professional',
    description:
      'A touch of personality with a well-organized resume structure.',
    image: '/resume-templates/Professional.jpg',
  },
  {
    id: 'prime-ats',
    name: 'Prime ATS',
    description:
      'Professional, streamlined resume template optimized for maximum ATS compatibility and readability.',
    image: '/resume-templates/prime-ats.jpg',
  },
  {
    id: 'clean',
    name: 'Clean',
    description: 'Modern resume template with bold, clean formatting.',
    image: '/resume-templates/Clean.jpg',
  },
  {
    id: 'precision-ats',
    name: 'Precision ATS',
    description:
      'Showcase career skills through a highlighted skills section. ATS-optimized resume template.',
    image: '/resume-templates/precission-ats.jpg',
  },
];
