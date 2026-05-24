'use client';

import { useState } from 'react';
import { useResumeStore } from '@/store/resume-store';
import type {
  Experience,
  Education,
  Skill,
  Project,
  Certification,
  DescriptionBlock,
} from '@/types/resume';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Plus, Trash2 } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** "2021-03" → "2021-03" (already in input[type=month] format) */
function toMonthInput(dateStr: string): string {
  if (!dateStr || dateStr === 'Present') return '';
  return dateStr;
}

/** Parse a textarea where each non-empty line becomes a bullet DescriptionBlock. */
function parseDescriptionText(text: string): DescriptionBlock[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((content, i) => ({
      id: `d-${Date.now()}-${i}`,
      type: 'bullet' as const,
      content,
    }));
}

/** Join DescriptionBlock[] back to newline-separated string for textarea. */
function joinDescription(blocks?: DescriptionBlock[]): string {
  return blocks?.map((b) => b.content).join('\n') ?? '';
}

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-foreground text-sm font-semibold">{title}</h3>
      <Separator className="mt-2" />
    </div>
  );
}

// ─── Personal Info ────────────────────────────────────────────────────────────

function PersonalInfoSection() {
  const { resume, updatePersonalInfo } = useResumeStore();
  const p = resume.personalInfo;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={p.firstName}
            onChange={(e) => updatePersonalInfo({ firstName: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={p.lastName}
            onChange={(e) => updatePersonalInfo({ lastName: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="middleName">Middle Name</Label>
        <Input
          id="middleName"
          value={p.middleName ?? ''}
          placeholder="Optional"
          onChange={(e) => updatePersonalInfo({ middleName: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={p.email}
            onChange={(e) => updatePersonalInfo({ email: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={p.phone}
            onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={p.location}
          placeholder="City, Country"
          onChange={(e) => updatePersonalInfo({ location: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="linkedin">LinkedIn</Label>
        <Input
          id="linkedin"
          value={p.linkedin ?? ''}
          placeholder="linkedin.com/in/yourname"
          onChange={(e) => updatePersonalInfo({ linkedin: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="github">GitHub</Label>
          <Input
            id="github"
            value={p.github ?? ''}
            placeholder="github.com/yourname"
            onChange={(e) => updatePersonalInfo({ github: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="portfolio">Portfolio</Label>
          <Input
            id="portfolio"
            value={p.portfolio ?? ''}
            placeholder="yoursite.com"
            onChange={(e) => updatePersonalInfo({ portfolio: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function SummarySection() {
  const { resume, updateSummary } = useResumeStore();

  return (
    <div className="space-y-1">
      <Label htmlFor="summary">Professional Summary</Label>
      <Textarea
        id="summary"
        rows={4}
        value={resume.summary}
        placeholder="Write a short summary about yourself..."
        onChange={(e) => updateSummary(e.target.value)}
        className="resize-none"
      />
    </div>
  );
}

// ─── Experience ───────────────────────────────────────────────────────────────

function ExperienceItem({ exp }: { exp: Experience }) {
  const { updateExperience, removeExperience } = useResumeStore();

  function update(
    field: keyof Omit<Experience, 'id'>,
    value: string | DescriptionBlock[]
  ) {
    updateExperience(exp.id, { [field]: value });
  }

  return (
    <Card className="border-border">
      <CardContent className="space-y-3 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Company</Label>
            <Input
              value={exp.companyName}
              onChange={(e) => update('companyName', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Role / Title</Label>
            <Input
              value={exp.role}
              onChange={(e) => update('role', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Location</Label>
          <Input
            value={exp.location}
            onChange={(e) => update('location', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Start Date</Label>
            <Input
              type="month"
              value={toMonthInput(exp.startDate)}
              onChange={(e) => update('startDate', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>End Date</Label>
            <Input
              type="text"
              value={
                exp.endDate === 'Present'
                  ? 'Present'
                  : toMonthInput(exp.endDate)
              }
              placeholder="Present or YYYY-MM"
              onChange={(e) => update('endDate', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Description (one bullet per line)</Label>
          <Textarea
            rows={4}
            value={joinDescription(exp.description)}
            placeholder="Led a team of 5 engineers to deliver..."
            onChange={(e) =>
              update('description', parseDescriptionText(e.target.value))
            }
            className="resize-none"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive w-full gap-1.5"
          onClick={() => removeExperience(exp.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </Button>
      </CardContent>
    </Card>
  );
}

function ExperienceSection() {
  const { resume, addExperience } = useResumeStore();

  function handleAdd() {
    addExperience({
      companyName: '',
      role: '',
      location: '',
      startDate: '',
      endDate: 'Present',
      description: [],
    });
  }

  return (
    <div className="space-y-3">
      <Accordion type="multiple" className="space-y-2">
        {resume.experiences.map((exp) => (
          <AccordionItem
            key={exp.id}
            value={exp.id}
            className="border-border rounded-lg border px-3 no-underline"
          >
            <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
              {exp.companyName || 'New Experience'}{' '}
              {exp.role ? `— ${exp.role}` : ''}
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <ExperienceItem exp={exp} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={handleAdd}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Experience
      </Button>
    </div>
  );
}

// ─── Education ────────────────────────────────────────────────────────────────

function EducationItem({ edu }: { edu: Education }) {
  const { updateEducation, removeEducation } = useResumeStore();

  function update(
    field: keyof Omit<Education, 'id'>,
    value: string | DescriptionBlock[]
  ) {
    updateEducation(edu.id, { [field]: value });
  }

  return (
    <Card className="border-border">
      <CardContent className="space-y-3 pt-4">
        <div className="space-y-1">
          <Label>Institution</Label>
          <Input
            value={edu.institution}
            onChange={(e) => update('institution', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Degree</Label>
            <Input
              value={edu.degree}
              onChange={(e) => update('degree', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Field of Study</Label>
            <Input
              value={edu.areaOfStudy}
              onChange={(e) => update('areaOfStudy', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Grade / GPA</Label>
            <Input
              value={edu.grade}
              placeholder="3.8 GPA"
              onChange={(e) => update('grade', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Location</Label>
            <Input
              value={edu.location}
              onChange={(e) => update('location', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Start Date</Label>
            <Input
              type="month"
              value={toMonthInput(edu.startDate)}
              onChange={(e) => update('startDate', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>End Date</Label>
            <Input
              type="text"
              value={
                edu.endDate === 'Present'
                  ? 'Present'
                  : toMonthInput(edu.endDate)
              }
              placeholder="Present or YYYY-MM"
              onChange={(e) => update('endDate', e.target.value)}
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive w-full gap-1.5"
          onClick={() => removeEducation(edu.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </Button>
      </CardContent>
    </Card>
  );
}

function EducationSection() {
  const { resume, addEducation } = useResumeStore();

  return (
    <div className="space-y-3">
      <Accordion type="multiple" className="space-y-2">
        {resume.education.map((edu) => (
          <AccordionItem
            key={edu.id}
            value={edu.id}
            className="border-border rounded-lg border px-3 no-underline"
          >
            <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
              {edu.institution || 'New Education'}{' '}
              {edu.degree ? `— ${edu.degree}` : ''}
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <EducationItem edu={edu} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={() =>
          addEducation({
            institution: '',
            areaOfStudy: '',
            degree: '',
            grade: '',
            location: '',
            startDate: '',
            endDate: 'Present',
          })
        }
      >
        <Plus className="h-3.5 w-3.5" />
        Add Education
      </Button>
    </div>
  );
}

// ─── Skills ───────────────────────────────────────────────────────────────────

function SkillsSection() {
  const { resume, addSkill, updateSkill, removeSkill } = useResumeStore();
  const [newName, setNewName] = useState('');
  const [newProf, setNewProf] = useState('');

  function handleAdd() {
    if (!newName.trim()) return;
    addSkill({ name: newName.trim(), proficiency: newProf.trim() });
    setNewName('');
    setNewProf('');
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {resume.skills.map((skill) => (
          <div key={skill.id} className="flex items-center gap-2">
            <Input
              className="flex-1"
              value={skill.name}
              placeholder="Skill name"
              onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
            />
            <Input
              className="w-32"
              value={skill.proficiency}
              placeholder="Level"
              onChange={(e) =>
                updateSkill(skill.id, { proficiency: e.target.value })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
              onClick={() => removeSkill(skill.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add new skill row */}
      <div className="flex items-center gap-2 pt-1">
        <Input
          className="flex-1"
          value={newName}
          placeholder="Add skill..."
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Input
          className="w-32"
          value={newProf}
          placeholder="Level"
          onChange={(e) => setNewProf(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleAdd}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Projects ─────────────────────────────────────────────────────────────────

function ProjectItem({ proj }: { proj: Project }) {
  const { updateProject, removeProject } = useResumeStore();

  function update(
    field: keyof Omit<Project, 'id'>,
    value: string | DescriptionBlock[]
  ) {
    updateProject(proj.id, { [field]: value });
  }

  return (
    <Card className="border-border">
      <CardContent className="space-y-3 pt-4">
        <div className="space-y-1">
          <Label>Project Name</Label>
          <Input
            value={proj.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Website</Label>
            <Input
              value={proj.website ?? ''}
              placeholder="yourproject.io"
              onChange={(e) => update('website', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Source Code</Label>
            <Input
              value={proj.sourceCode ?? ''}
              placeholder="github.com/..."
              onChange={(e) => update('sourceCode', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Description (one bullet per line)</Label>
          <Textarea
            rows={3}
            value={joinDescription(proj.description)}
            placeholder="Built a real-time dashboard using..."
            onChange={(e) =>
              update('description', parseDescriptionText(e.target.value))
            }
            className="resize-none"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive w-full gap-1.5"
          onClick={() => removeProject(proj.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </Button>
      </CardContent>
    </Card>
  );
}

function ProjectsSection() {
  const { resume, addProject } = useResumeStore();

  return (
    <div className="space-y-3">
      <Accordion type="multiple" className="space-y-2">
        {resume.projects.map((proj) => (
          <AccordionItem
            key={proj.id}
            value={proj.id}
            className="border-border rounded-lg border px-3 no-underline"
          >
            <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
              {proj.name || 'New Project'}
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <ProjectItem proj={proj} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={() =>
          addProject({ name: '', website: '', sourceCode: '', description: [] })
        }
      >
        <Plus className="h-3.5 w-3.5" />
        Add Project
      </Button>
    </div>
  );
}

// ─── Certifications ───────────────────────────────────────────────────────────

function CertificationsSection() {
  const { resume, addCertification, updateCertification, removeCertification } =
    useResumeStore();

  return (
    <div className="space-y-3">
      {resume.certifications.map((cert) => (
        <Card key={cert.id} className="border-border">
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-1">
              <Label>Certification Title</Label>
              <Input
                value={cert.title}
                onChange={(e) =>
                  updateCertification(cert.id, { title: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Issuer</Label>
                <Input
                  value={cert.issuer}
                  onChange={(e) =>
                    updateCertification(cert.id, { issuer: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  type="month"
                  value={toMonthInput(cert.date)}
                  onChange={(e) =>
                    updateCertification(cert.id, { date: e.target.value })
                  }
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive w-full gap-1.5"
              onClick={() => removeCertification(cert.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </CardContent>
        </Card>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={() => addCertification({ title: '', issuer: '', date: '' })}
      >
        <Plus className="h-3.5 w-3.5" />
        Add Certification
      </Button>
    </div>
  );
}

// ─── Root form ────────────────────────────────────────────────────────────────

export function ResumeForm() {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-8 p-6">
        {/* Personal Info */}
        <section>
          <SectionHeading title="Personal Information" />
          <PersonalInfoSection />
        </section>

        {/* Summary */}
        <section>
          <SectionHeading title="Summary" />
          <SummarySection />
        </section>

        {/* Experience */}
        <section>
          <SectionHeading title="Experience" />
          <ExperienceSection />
        </section>

        {/* Education */}
        <section>
          <SectionHeading title="Education" />
          <EducationSection />
        </section>

        {/* Skills */}
        <section>
          <SectionHeading title="Skills" />
          <SkillsSection />
        </section>

        {/* Projects */}
        <section>
          <SectionHeading title="Projects" />
          <ProjectsSection />
        </section>

        {/* Certifications */}
        <section>
          <SectionHeading title="Certifications" />
          <CertificationsSection />
        </section>
      </div>
    </ScrollArea>
  );
}
