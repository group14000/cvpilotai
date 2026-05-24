import { create } from 'zustand';
import type {
  Resume,
  PersonalInfo,
  Experience,
  Skill,
  Project,
  Education,
  Certification,
} from '@/types/resume';
import type {
  AiOptimizationState,
  PendingAiOptimization,
  SectionStatus,
} from '@/features/ai/types';

// ─── Static initial state ───────────────────────────────────────────────────
// Uses a static id ("preview-draft") instead of crypto.randomUUID() to avoid
// hydration mismatch between server and client renders.
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_RESUME: Resume = {
  id: 'preview-draft',
  templateId: 'classic',
  personalInfo: {
    firstName: 'Christopher',
    middleName: '',
    lastName: 'Carter',
    email: 'christopher@gmail.com',
    phone: '+91 9876543210',
    location: 'Moscow, Russia',
    linkedin: 'linkedin.com/in/christophercarter',
    github: 'github.com/christophercarter',
    portfolio: '',
  },
  summary:
    'Experienced UX/UI designer with 6+ years of expertise in building scalable design systems, brand identities, and product interfaces. Passionate about delivering clean, accessible, and user-centred experiences.',
  experiences: [
    {
      id: 'exp-1',
      companyName: 'DesignCo. Inc',
      role: 'Senior UX Designer',
      location: 'New York, USA',
      startDate: '2021-03',
      endDate: 'Present',
      description: [
        {
          id: 'd1',
          type: 'bullet',
          content:
            'Led end-to-end design for 4 major product launches serving 500k+ users.',
        },
        {
          id: 'd2',
          type: 'bullet',
          content:
            'Built a Figma design system adopted across 3 product teams.',
        },
        {
          id: 'd3',
          type: 'bullet',
          content:
            'Reduced onboarding drop-off by 32% through iterative UX research.',
        },
      ],
    },
    {
      id: 'exp-2',
      companyName: 'Freelance',
      role: 'UI/UX Designer',
      location: 'Remote',
      startDate: '2018-06',
      endDate: '2021-02',
      description: [
        {
          id: 'd4',
          type: 'bullet',
          content:
            'Delivered 20+ branding and product design projects for startups.',
        },
        {
          id: 'd5',
          type: 'bullet',
          content:
            'Designed high-fidelity prototypes and user flows in Figma and Adobe XD.',
        },
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'Moscow State University',
      areaOfStudy: 'Visual Communication Design',
      degree: 'Bachelor of Design',
      grade: '3.8 GPA',
      location: 'Moscow, Russia',
      startDate: '2014-09',
      endDate: '2018-06',
    },
  ],
  skills: [
    { id: 'sk-1', name: 'Figma', proficiency: 'Expert' },
    { id: 'sk-2', name: 'Adobe XD', proficiency: 'Advanced' },
    { id: 'sk-3', name: 'Tailwind CSS', proficiency: 'Advanced' },
    { id: 'sk-4', name: 'React', proficiency: 'Intermediate' },
    { id: 'sk-5', name: 'User Research', proficiency: 'Expert' },
    { id: 'sk-6', name: 'Prototyping', proficiency: 'Expert' },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'ResumeAI – AI Resume Builder',
      website: 'resumeai.io',
      sourceCode: 'github.com/christophercarter/resumeai',
      description: [
        {
          id: 'p1',
          type: 'bullet',
          content:
            'Designed the full product UI for an AI-powered resume builder SaaS.',
        },
        {
          id: 'p2',
          type: 'bullet',
          content:
            'Created a multi-template system supporting PDF and web exports.',
        },
      ],
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      title: 'Google UX Design Certificate',
      issuer: 'Google / Coursera',
      date: '2020-11',
    },
  ],
};

// ─── Store types ─────────────────────────────────────────────────────────────
type ResumeStore = {
  resume: Resume;

  // Template
  setTemplate: (templateId: string) => void;

  // Personal info & summary
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  updateSummary: (summary: string) => void;

  // Experience
  addExperience: (exp: Omit<Experience, 'id'>) => void;
  updateExperience: (
    id: string,
    updates: Partial<Omit<Experience, 'id'>>
  ) => void;
  removeExperience: (id: string) => void;

  // Skills
  addSkill: (skill: Omit<Skill, 'id'>) => void;
  updateSkill: (id: string, updates: Partial<Omit<Skill, 'id'>>) => void;
  removeSkill: (id: string) => void;

  // Projects
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id'>>) => void;
  removeProject: (id: string) => void;

  // Education
  addEducation: (edu: Omit<Education, 'id'>) => void;
  updateEducation: (
    id: string,
    updates: Partial<Omit<Education, 'id'>>
  ) => void;
  removeEducation: (id: string) => void;

  // Certifications
  addCertification: (cert: Omit<Certification, 'id'>) => void;
  updateCertification: (
    id: string,
    updates: Partial<Omit<Certification, 'id'>>
  ) => void;
  removeCertification: (id: string) => void;

  // Edit lifecycle
  /**
   * Replace the entire store state with a resume loaded from the database.
   * Called on mount of the edit page to pre-populate the editor.
   */
  hydrateResume: (resume: Resume) => void;
  /**
   * Reset the store to the static INITIAL_RESUME (id: "preview-draft").
   * Called on unmount of the edit page so create-resume works correctly
   * after navigating back from an edit session.
   */
  resetResume: () => void;

  // ── AI optimization state + actions ────────────────────────────────────────
  //
  // The AI optimization slice is a separate overlay — it holds pending
  // AI suggestions WITHOUT touching the live `resume` state until the user
  // explicitly accepts. This guarantees the user can always cancel without
  // data loss.

  /** Current AI optimization state. Null when no optimization is in progress. */
  aiOptimization: AiOptimizationState;

  /** Called from the TanStack mutation `onMutate` — shows loading state. */
  setAiOptimizationLoading: () => void;

  /**
   * Called from the TanStack mutation `onSuccess` — stores the AI result
   * and initializes all section acceptance statuses to 'pending'.
   */
  setAiOptimizationResult: (result: PendingAiOptimization) => void;

  /** Called from the TanStack mutation `onError` — clears pending data. */
  setAiOptimizationError: () => void;

  /**
   * Reset the entire AI optimization slice to null.
   * Called when the user dismisses the dialog without applying, or after
   * `applyAllAcceptedAiChanges()` completes.
   */
  clearAiOptimization: () => void;

  /**
   * Mark a section or individual item as accepted.
   * - For 'summary' and 'skills': no itemId needed (whole section)
   * - For 'experiences' and 'projects': provide the item's id
   */
  acceptAiSection: (
    section: 'summary' | 'experiences' | 'projects' | 'skills',
    itemId?: string
  ) => void;

  /**
   * Mark a section or individual item as rejected.
   * Same signature as acceptAiSection.
   */
  rejectAiSection: (
    section: 'summary' | 'experiences' | 'projects' | 'skills',
    itemId?: string
  ) => void;

  /**
   * Apply all 'accepted' sections from the pending AI result to the live resume.
   *
   * - Accepted summary → replaces resume.summary
   * - Accepted experiences → replaces description[] for each accepted experience
   * - Accepted projects → replaces description[] for each accepted project
   * - Accepted skills → calls addSkill() for each suggested skill
   *
   * Reads from the Zustand state at call time (inside set() callback) to
   * avoid stale closure issues. Calls clearAiOptimization() after applying.
   */
  applyAllAcceptedAiChanges: () => void;
};

// ─── Store ───────────────────────────────────────────────────────────────────
export const useResumeStore = create<ResumeStore>((set) => ({
  resume: INITIAL_RESUME,

  setTemplate: (templateId) =>
    set((s) => ({ resume: { ...s.resume, templateId } })),

  updatePersonalInfo: (info) =>
    set((s) => ({
      resume: {
        ...s.resume,
        personalInfo: { ...s.resume.personalInfo, ...info },
      },
    })),

  updateSummary: (summary) =>
    set((s) => ({ resume: { ...s.resume, summary } })),

  // ── Experience ──
  addExperience: (exp) =>
    set((s) => ({
      resume: {
        ...s.resume,
        experiences: [
          ...s.resume.experiences,
          { ...exp, id: crypto.randomUUID() },
        ],
      },
    })),
  updateExperience: (id, updates) =>
    set((s) => ({
      resume: {
        ...s.resume,
        experiences: s.resume.experiences.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      },
    })),
  removeExperience: (id) =>
    set((s) => ({
      resume: {
        ...s.resume,
        experiences: s.resume.experiences.filter((e) => e.id !== id),
      },
    })),

  // ── Skills ──
  addSkill: (skill) =>
    set((s) => ({
      resume: {
        ...s.resume,
        skills: [...s.resume.skills, { ...skill, id: crypto.randomUUID() }],
      },
    })),
  updateSkill: (id, updates) =>
    set((s) => ({
      resume: {
        ...s.resume,
        skills: s.resume.skills.map((sk) =>
          sk.id === id ? { ...sk, ...updates } : sk
        ),
      },
    })),
  removeSkill: (id) =>
    set((s) => ({
      resume: {
        ...s.resume,
        skills: s.resume.skills.filter((sk) => sk.id !== id),
      },
    })),

  // ── Projects ──
  addProject: (project) =>
    set((s) => ({
      resume: {
        ...s.resume,
        projects: [
          ...s.resume.projects,
          { ...project, id: crypto.randomUUID() },
        ],
      },
    })),
  updateProject: (id, updates) =>
    set((s) => ({
      resume: {
        ...s.resume,
        projects: s.resume.projects.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      },
    })),
  removeProject: (id) =>
    set((s) => ({
      resume: {
        ...s.resume,
        projects: s.resume.projects.filter((p) => p.id !== id),
      },
    })),

  // ── Education ──
  addEducation: (edu) =>
    set((s) => ({
      resume: {
        ...s.resume,
        education: [...s.resume.education, { ...edu, id: crypto.randomUUID() }],
      },
    })),
  updateEducation: (id, updates) =>
    set((s) => ({
      resume: {
        ...s.resume,
        education: s.resume.education.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      },
    })),
  removeEducation: (id) =>
    set((s) => ({
      resume: {
        ...s.resume,
        education: s.resume.education.filter((e) => e.id !== id),
      },
    })),

  // ── Certifications ──
  addCertification: (cert) =>
    set((s) => ({
      resume: {
        ...s.resume,
        certifications: [
          ...s.resume.certifications,
          { ...cert, id: crypto.randomUUID() },
        ],
      },
    })),
  updateCertification: (id, updates) =>
    set((s) => ({
      resume: {
        ...s.resume,
        certifications: s.resume.certifications.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      },
    })),
  removeCertification: (id) =>
    set((s) => ({
      resume: {
        ...s.resume,
        certifications: s.resume.certifications.filter((c) => c.id !== id),
      },
    })),

  // ── Edit lifecycle ──
  hydrateResume: (resume) => set({ resume }),
  resetResume: () => set({ resume: INITIAL_RESUME }),

  // ── AI optimization ──
  aiOptimization: null,

  setAiOptimizationLoading: () =>
    set({
      aiOptimization: {
        status: 'loading',
        pending: null,
        sectionAcceptance: null,
      },
    }),

  setAiOptimizationResult: (result) =>
    set({
      aiOptimization: {
        status: 'success',
        pending: result,
        sectionAcceptance: {
          summary: 'pending',
          experiences: Object.fromEntries(
            result.optimizedExperiences.map((e) => [
              e.id,
              'pending' as SectionStatus,
            ])
          ),
          projects: Object.fromEntries(
            result.optimizedProjects.map((p) => [
              p.id,
              'pending' as SectionStatus,
            ])
          ),
          skills: result.suggestedSkills.length > 0 ? 'pending' : 'rejected',
        },
      },
    }),

  setAiOptimizationError: () =>
    set({
      aiOptimization: {
        status: 'error',
        pending: null,
        sectionAcceptance: null,
      },
    }),

  clearAiOptimization: () => set({ aiOptimization: null }),

  acceptAiSection: (section, itemId) =>
    set((s) => {
      if (!s.aiOptimization?.sectionAcceptance) return s;
      const acc = s.aiOptimization.sectionAcceptance;

      if (section === 'summary' || section === 'skills') {
        return {
          aiOptimization: {
            ...s.aiOptimization,
            sectionAcceptance: {
              ...acc,
              [section]: 'accepted' as SectionStatus,
            },
          },
        };
      }

      if (!itemId) return s;
      return {
        aiOptimization: {
          ...s.aiOptimization,
          sectionAcceptance: {
            ...acc,
            [section]: {
              ...acc[section],
              [itemId]: 'accepted' as SectionStatus,
            },
          },
        },
      };
    }),

  rejectAiSection: (section, itemId) =>
    set((s) => {
      if (!s.aiOptimization?.sectionAcceptance) return s;
      const acc = s.aiOptimization.sectionAcceptance;

      if (section === 'summary' || section === 'skills') {
        return {
          aiOptimization: {
            ...s.aiOptimization,
            sectionAcceptance: {
              ...acc,
              [section]: 'rejected' as SectionStatus,
            },
          },
        };
      }

      if (!itemId) return s;
      return {
        aiOptimization: {
          ...s.aiOptimization,
          sectionAcceptance: {
            ...acc,
            [section]: {
              ...acc[section],
              [itemId]: 'rejected' as SectionStatus,
            },
          },
        },
      };
    }),

  applyAllAcceptedAiChanges: () =>
    set((s) => {
      if (
        !s.aiOptimization ||
        s.aiOptimization.status !== 'success' ||
        !s.aiOptimization.pending ||
        !s.aiOptimization.sectionAcceptance
      ) {
        return s;
      }

      const { pending, sectionAcceptance } = s.aiOptimization;
      let resume = { ...s.resume };

      // Apply accepted summary
      if (sectionAcceptance.summary === 'accepted') {
        resume = { ...resume, summary: pending.optimizedSummary };
      }

      // Apply accepted experience descriptions
      if (Object.keys(sectionAcceptance.experiences).length > 0) {
        resume = {
          ...resume,
          experiences: resume.experiences.map((exp) => {
            if (sectionAcceptance.experiences[exp.id] === 'accepted') {
              const optimized = pending.optimizedExperiences.find(
                (e) => e.id === exp.id
              );
              if (optimized) {
                return { ...exp, description: optimized.description };
              }
            }
            return exp;
          }),
        };
      }

      // Apply accepted project descriptions
      if (Object.keys(sectionAcceptance.projects).length > 0) {
        resume = {
          ...resume,
          projects: resume.projects.map((proj) => {
            if (sectionAcceptance.projects[proj.id] === 'accepted') {
              const optimized = pending.optimizedProjects.find(
                (p) => p.id === proj.id
              );
              if (optimized) {
                return { ...proj, description: optimized.description };
              }
            }
            return proj;
          }),
        };
      }

      // Apply accepted skill suggestions (add new skills)
      if (sectionAcceptance.skills === 'accepted') {
        const newSkills = pending.suggestedSkills.map((sk) => ({
          id: crypto.randomUUID(),
          name: sk.name,
          proficiency: sk.proficiency,
        }));
        resume = {
          ...resume,
          skills: [...resume.skills, ...newSkills],
        };
      }

      return { resume, aiOptimization: null };
    }),
}));
