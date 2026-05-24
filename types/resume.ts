export type Resume = {
  id: string;
  templateId: string;
  personalInfo: PersonalInfo;
  summary: string;
  experiences: Experience[];
  skills: Skill[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
};

export type PersonalInfo = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
};

export type Experience = {
  id: string;
  companyName: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string | 'Present';
  description?: DescriptionBlock[];
};

export type Skill = {
  id: string;
  name: string;
  proficiency: string;
  level?: number;
};

export type Project = {
  id: string;
  name: string;
  website?: string;
  sourceCode?: string;
  description?: DescriptionBlock[];
};

export type Education = {
  id: string;
  institution: string;
  areaOfStudy: string;
  degree: string;
  grade: string;
  location: string;
  startDate: string;
  endDate: string | 'Present';
  website?: string;
  description?: DescriptionBlock[];
};

export type Certification = {
  id: string;
  title: string;
  issuer: string;
  date: string;
  website?: string;
  description?: DescriptionBlock[];
};

export type DescriptionBlock = {
  id: string;
  type: 'paragraph' | 'bullet';
  content: string;
};
