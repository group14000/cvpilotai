import type { Resume } from '@/types/resume';
import type { ComponentType } from 'react';

import ClassicTemplate from './classic/template';
import TraditionalTemplate from './traditional/template';
import ProfessionalTemplate from './professional/template';
import PrimeATSTemplate from './prime-ats/template';
import CleanTemplate from './clean/template';
import PrecisionATSTemplate from './precision-ats/template';

// ─── Shared prop type for all resume templates ────────────────────────────────
export type TemplateComponent = ComponentType<{ resume: Resume }>;

// ─── Registry: template id → component ───────────────────────────────────────
export const TEMPLATE_COMPONENTS: Record<string, TemplateComponent> = {
  classic: ClassicTemplate,
  traditional: TraditionalTemplate,
  professional: ProfessionalTemplate,
  'prime-ats': PrimeATSTemplate,
  clean: CleanTemplate,
  'precision-ats': PrecisionATSTemplate,
};
