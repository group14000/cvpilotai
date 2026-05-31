# Rules For Environment Variables (.env)

## Security Rules

1. Never commit `.env` files to Git or any version control system.
2. Always add `.env` to `.gitignore`.
3. Store all sensitive credentials inside `.env`, including:
   - API keys
   - Database credentials
   - JWT secrets
   - OAuth secrets
   - Encryption keys
   - Clerk secrets
   - AI provider keys
4. Never expose `.env` values in:
   - frontend/client components
   - logs
   - console statements
   - API responses
   - screenshots
   - commits
   - documentation
5. Never share `.env` contents publicly.
6. Never generate placeholder secrets like:
   ```ts
   process.env.API_KEY || 'your_api_key_here';
   ```
   Always use:
   ```ts
   process.env.API_KEY;
   ```
7. If an environment variable is required, validate it at startup and throw proper errors if missing.
8. Never hardcode secrets directly inside source code.
9. Keep `.env` clean, grouped, and organized by service.
10. Never create `.env.example` or `.env.local`. Use only `.env`.

---

## Naming Rules

1. Use uppercase snake_case naming convention:
   ```env
   OPENAI_API_KEY=
   DATABASE_URL=
   CLERK_SECRET_KEY=
   ```
2. Use clear and descriptive names.
3. Prefix related variables consistently:
   ```env
   OPENAI_
   STRIPE_
   CLERK_
   AWS_
   UPSTASH_
   OPENROUTER_
   ```

---

## Usage Rules

1. Access env variables only through:
   ```ts
   process.env.VARIABLE_NAME;
   ```
2. Avoid repeated direct access throughout the application.
3. Create centralized env/config helpers when required.
4. Never mutate `process.env`.
5. Never expose sensitive variables using `NEXT_PUBLIC_`.
6. Only safe public values may use:
   ```env
   NEXT_PUBLIC_
   ```

---

## Next.js Rules

1. Backend secrets must remain server-only.
2. AI keys, database URLs, and Clerk secrets must never reach client components.
3. Use:
   - route handlers
   - server actions
   - server components
     for secret-based operations.
4. Validate all required env variables during app startup.

---

# Rules For Prisma

## Prisma Configuration Rules

1. Never modify this section:

   ```prisma
   generator client {
     provider = "prisma-client"
     output   = "../generated/prisma"
   }

   datasource db {
     provider = "postgresql"
   }
   ```

2. Never add `DATABASE_URL` directly inside `schema.prisma`.
3. Database configuration is handled inside:
   ```txt
   prisma.config.ts
   ```
4. Never change Prisma output paths unless explicitly required.

---

## Schema Rules

1. Always design scalable and reusable models.
2. Prefer UUID primary keys.
3. Always include:
   ```prisma
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   ```
4. Prefer enums over free-text status fields.
5. Avoid nullable fields unless truly optional.
6. Use meaningful relation names.
7. Keep models feature-oriented and modular.
8. Never delete models without understanding migration impact.

---

## Migration Rules

1. Always use Prisma Migrate for schema changes.
2. Never manually alter database tables outside Prisma migrations.
3. After every schema update run:
   ```bash
   npx prisma generate
   ```
4. Use meaningful migration names:
   ```bash
   npx prisma migrate dev --name add_resume_templates
   ```
5. Review migrations before production deployment.
6. Never reset production databases.

---

## Query Rules

1. Prefer Prisma query APIs over raw SQL.
2. Use transactions for multi-step operations.
3. Prevent N+1 queries using:
   - include
   - select
   - optimized relations
4. Validate all incoming data before database writes.
5. Use pagination for large datasets.
6. Avoid overfetching unnecessary fields.
7. Add indexes for frequently queried columns.

---

## Project Structure Rules

1. Keep Prisma files organized:
   ```txt
   prisma/
     schema.prisma
     migrations/
     seed.ts
   ```
2. Separate:
   - database logic
   - services
   - validation
   - API handlers
3. Never place business logic directly inside route handlers.

---

# Rules For API Creation

## Architecture Rules

1. Always follow RESTful API principles.
2. Use feature-based API architecture.
3. Keep route handlers thin.
4. Move business logic into service layers.
5. Separate:
   - validation
   - services
   - repositories
   - AI logic
   - API handlers
6. Prefer server-first architecture.

---

## HTTP Rules

1. Use proper HTTP methods:
   - GET → fetch
   - POST → create
   - PUT/PATCH → update
   - DELETE → remove
2. Never use GET for mutations.
3. Never expose destructive operations through unsafe methods.

---

## Validation Rules

1. Validate all incoming data.
2. Use Zod for schema validation.
3. Reject invalid payloads with proper errors.
4. Sanitize all user input.
5. Never trust frontend validation alone.

---

## Authentication & Authorization Rules

1. Use Clerk authentication for protected APIs.
2. Validate authenticated users on the server.
3. Add ownership checks for user resources.
4. Never trust client-side user IDs.
5. Protect:
   - AI generation routes
   - resume management routes
   - payment routes
   - admin routes

---

## Security Rules

1. Prevent:
   - SQL injection
   - XSS
   - CSRF
   - prompt injection
   - malicious file uploads
2. Never expose:
   - stack traces
   - database errors
   - internal server details
   - secret tokens
3. Use secure headers where applicable.
4. Validate uploaded file types and sizes.
5. Implement request size limits.

---

## Rate Limiting Rules

1. Use:
   ```bash
   pnpm install @upstash/ratelimit @upstash/redis
   ```
2. Always apply rate limiting to:
   - authentication APIs
   - AI generation APIs
   - public APIs
   - upload APIs
3. Store rate limiting utilities inside:
   ```txt
   lib/ratelimit/
   ```
4. Use IP-based or user-based rate limiting depending on the endpoint.
5. Return proper `429 Too Many Requests` responses.
6. Never expose internal rate limit logic to the client.
7. Use stricter rate limits for expensive AI operations.
8. Reuse centralized rate limit configurations.

---

## Upstash Rate Limiting Rules

1. Create reusable rate limiters:
   ```ts
   import { Ratelimit } from '@upstash/ratelimit';
   import { Redis } from '@upstash/redis';
   ```
2. Keep Redis client centralized.
3. Store Upstash credentials inside `.env`.
4. Never hardcode Upstash credentials.
5. Use sliding window or fixed window strategies based on use case.
6. Apply rate limiting before heavy operations.
7. Always handle rate limit failures gracefully.

---

## Response Rules

1. Return consistent API responses.

Success:

```ts
{
  success: (true, data, message);
}
```

Error:

```ts
{
  success: (false, error);
}
```

2. Use meaningful HTTP status codes.
3. Avoid deeply nested response structures.
4. Include pagination metadata for lists.

---

## AI Feature Rules

1. Keep AI prompts separated from route handlers.
2. Store prompts inside dedicated modules (`lib/ai/prompts/`).
3. Validate AI responses before saving — use Zod with `.catch()` fallbacks for resilience.
4. Implement retries and fallback handling.
5. Track AI token usage when required — use structured `[AI:usage]` console.log.
6. Never expose raw prompts to the frontend.
7. AI generation logic must remain server-side (`features/ai/services/`).
8. Sanitize all AI input with `sanitizeJobDescription()` and output with `sanitizeAiTextOutput()`.
9. Use 4-layer prompt injection defense: sanitization → XML delimiter isolation → system prompt reinforcement → Zod schema validation.
10. Never auto-retry AI calls — free-tier failures last minutes; let users retry manually.
11. All AI errors (AiEmptyResponseError, AiParseError, AiValidationError) must be typed and mapped to correct HTTP status codes in the route handler.
12. Use `extractJsonObject()` bracket-counting parser to extract JSON from model responses that include preamble or trailing prose.

---

## Logging Rules

1. **Never use `console.log()`** — it is banned across the entire codebase (production read/write cost + security risk).
2. Use `console.error()` for failures and `console.warn()` for non-fatal anomalies only.
3. Never log:
   - secrets
   - tokens
   - passwords
   - sensitive user data
4. Use structured logging — always `console.error('[namespace]', JSON.stringify({...}))`.
5. Established log namespaces (all use `console.error` or `console.warn`):
   - `[AI:usage]` — AI call failures with token counts, duration, and failure reason (`console.error`)
   - `[AI:sdk-error]` — OpenRouter SDK errors with errorClass and statusCode (`console.error`)
   - `[AI:reconciliation]` — dropped hallucinated IDs after ID reconciliation (`console.warn`)
   - `[EditorErrorBoundary]` — React render errors caught in the editor (`console.error`)
6. Separate dev logs from production logs.

---

## HTTP Client Rules

1. Use **Axios** for all API calls from frontend hooks — never raw `fetch()`.
2. Always type both success and error response shapes:
   ```ts
   type SuccessResponse = { success: true; data: {...}; message: string }
   type ErrorResponse   = { success: false; error: string }
   ```
3. Extract errors with `isAxiosError<ErrorResponse>(error)` + `error.response?.data?.error`.
4. Use `responseType: 'arraybuffer'` for binary downloads (PDF export), then decode errors with `TextDecoder`.

---

## Documentation Rules

1. Document all APIs clearly.
2. Include:
   - request body
   - response structure
   - auth requirements
   - error cases
3. Keep documentation updated with implementation changes.

---

## Versioning Rules

1. Use API versioning:
   ```txt
   /api/v1/
   ```
2. Avoid breaking existing clients.
3. Deprecate APIs gradually.

---

# Development Workflow Rules

## Package Manager Rules

1. Always use PNPM for package management.
2. Never use npm.
3. Use PNPM commands:
   ```bash
   pnpm install
   pnpm add <package>
   pnpm remove <package>
   pnpm dev
   pnpm build
   ```

---

## Backend-First Workflow

Current Project Workflow:

1. Design database schema
2. Create Prisma models
3. Create migrations
4. Build services
5. Build APIs/server actions
6. Add validation
7. Add authentication
8. Add rate limiting
9. Test APIs
10. Build frontend later

---

## Code Quality Rules

1. Use strict TypeScript.
2. Avoid `any` types.
3. Prefer reusable utilities.
4. Keep files modular and scalable.
5. Use clear naming conventions.
6. Avoid duplicated logic.
7. Prefer async/await.
8. Write maintainable and scalable code.

---

## Folder Structure Rules

Preferred Structure:

```txt
features/
  resume/
    services/
    schemas/
    types/
    utils/
  ai/
    services/
    schemas/
    types/
  user/
    services/
    schemas/

lib/
  prisma/
  ratelimit/
  ai/
    prompts/
```

---

# Resume AI Application Rules

1. AI generation logic must remain server-side.
2. Resume templates must be modular.
3. Store resume sections separately.
4. Support future export systems:
   - PDF
   - DOCX
   - JSON
5. Design schema for:
   - multiple resumes per user
   - AI history
   - template versioning
   - resume customization
6. Keep AI prompts reusable and version-controlled (`lib/ai/prompts/promptVersion.ts`).
7. Optimize expensive AI generation APIs.
8. Cache reusable AI responses where applicable.
9. Track resume generation history.
10. Design for future multi-template support.

---

# Project Folder Structure

## Root Level Files

- **CLAUDE.md** - Project-specific rules and guidelines (this file)
- **package.json** - PNPM dependencies and scripts
- **pnpm-lock.yaml** - Locked dependency versions
- **tsconfig.json** - TypeScript configuration
- **next.config.ts** - Next.js configuration
- **prisma.config.ts** - Prisma database configuration (loads DATABASE_URL from .env)
- **proxy.ts** - Proxy configuration
- **.env** - Environment variables (NOT committed to Git, contains secrets)
- **.gitignore** - Git ignore patterns
- **.dockerignore** - Docker ignore patterns
- **docker-compose.yml** - Docker Compose for local development (PostgreSQL)
- **.prettierrc** - Code formatter config
- **eslint.config.mjs** - ESLint configuration

## Directory Structure

```
.
├── app/                                         # Next.js App Router
│   ├── (main)/                                 # Main layout group (sidebar + header)
│   │   ├── layout.tsx                          # Layout: MainSidebar + MainHeader + SidebarInset
│   │   ├── dashboard/
│   │   │   └── page.tsx                        # Dashboard page
│   │   └── resumes/
│   │       ├── page.tsx                        # Resumes listing page (uses ResumeList)
│   │       ├── new/
│   │       │   └── page.tsx                    # Template picker (uses ResumeTemplateCard)
│   │       ├── [id]/
│   │       │   └── edit/
│   │       │       └── page.tsx                # Edit page: server component → EditResumeClient
│   │       └── create-resume/
│   │           └── [slug]/
│   │               └── page.tsx                # New resume editor: form (left) + preview (right)
│   ├── (print)/                                # Print layout group (no sidebar/header)
│   │   └── resume/
│   │       └── [id]/
│   │           └── page.tsx                    # Print/PDF render target (used by Playwright export)
│   ├── api/
│   │   └── v1/                                 # API versioning
│   │       ├── user/
│   │       │   └── sync/
│   │       │       └── route.ts                # POST — Clerk → DB user sync (called on sign-in)
│   │       └── resumes/
│   │           ├── route.ts                    # GET (list), POST (create)
│   │           ├── import/
│   │           │   └── route.ts                # POST — AI resume import (PDF/DOCX → normalized Resume)
│   │               ├── route.ts                # GET (single), PATCH (update), DELETE
│   │               ├── export/
│   │               │   └── route.ts            # GET — Playwright PDF export
│   │               └── optimize/
│   │                   └── route.ts            # POST — AI resume optimization (OpenRouter)
│   ├── providers.tsx                           # Root providers: SidebarProvider, QueryClient, Theme
│   ├── layout.tsx                              # Root layout: ClerkProvider, ThemeProvider, Providers
│   ├── page.tsx                                # Home / landing page
│   ├── globals.css                             # Global styles + CSS theme variables (light/dark)
│   └── favicon.ico
│
├── components/                                 # Reusable UI components
│   ├── ui/                                     # Shadcn/ui component library (50+ components)
│   │   ├── editor-error-boundary.tsx           # React class error boundary for editor panels
│   │   └── ... (accordion, button, card, dialog, skeleton, tabs, etc.)
│   ├── resume/                                 # Resume editor UI components
│   │   ├── resume-form.tsx                     # Full section-based editor form (Zustand-connected)
│   │   ├── resume-preview.tsx                  # A4 live preview wrapper (reads from store)
│   │   ├── resume-list.tsx                     # Resume cards grid on /resumes page
│   │   ├── template-card.tsx                   # Template picker card (ShadCN Card + Next Image)
│   │   ├── edit-resume-client.tsx              # Client wrapper: hydrates store + renders two-panel editor
│   │   ├── save-resume-button.tsx              # Save button for create-resume page (POST mutation)
│   │   ├── update-resume-button.tsx            # Save button for edit page (PATCH mutation)
│   │   ├── delete-resume-button.tsx            # Delete button with confirmation dialog (DELETE mutation)
│   │   ├── export-button.tsx                   # PDF export button (GET /export, arraybuffer download)
│   │   ├── import-resume-button.tsx          # Trigger button: opens ImportResumeDialog
│   │   └── import-resume-dialog.tsx          # 4-state dialog: idle → loading → success → error
│   ├── ai/                                     # AI optimization UI components
│   │   ├── optimize-resume-button.tsx          # Header trigger: opens dialog, shows "ready" badge
│   │   ├── optimization-dialog.tsx             # Full dialog: idle → loading → results states
│   │   ├── optimization-results-panel.tsx      # Tabbed view: Suggestions + Analysis tabs
│   │   ├── section-diff-card.tsx               # Per-section original vs. optimized diff with Accept/Reject
│   │   ├── analysis-panel.tsx                  # ATS score ring, keywords, improvement suggestions
│   │   └── keyword-badge.tsx                   # Pill badge (matched=green, missing=orange, neutral=gray)
│   ├── templates/                              # Resume template implementations
│   │   ├── index.ts                            # Registry: TemplateComponent type + TEMPLATE_COMPONENTS map
│   │   ├── classic/template.tsx                # Classic: two-column [160px_1fr] serif layout
│   │   ├── traditional/template.tsx            # Traditional: full-width bold uppercase section headers
│   │   ├── professional/template.tsx           # Professional: indigo sidebar + main content split
│   │   ├── prime-ats/template.tsx              # Prime ATS: ATS-safe, no columns, list-disc bullets
│   │   ├── clean/template.tsx                  # Clean: emerald accents, vertical timeline lines
│   │   └── precision-ats/template.tsx          # Precision ATS: skills-highlight block, ATS-optimized
│   ├── constants/
│   │   ├── resume-templates.ts                 # ResumeTemplate[] array (id, name, description, image)
│   │   └── sidebar-arrays.ts                   # SidebarItem[] for main navigation
│   ├── main-sidebar.tsx                        # App sidebar: nav links + Clerk user footer + SignOut
│   ├── main-header.tsx                         # Top header: SidebarTrigger + Separator + title
│   ├── ThemeToggle.tsx                         # Dark/light mode toggle button
│   └── theme-provider.tsx                      # next-themes ThemeProvider wrapper
│
├── store/                                      # Zustand client-side state
│   └── resume-store.ts                         # useResumeStore: resume state + CRUD actions + AI slice
│                                               # (static initial ID "preview-draft" avoids hydration mismatch)
│
├── types/                                      # Global TypeScript types
│   └── resume.ts                               # Resume, PersonalInfo, Experience, Education, Skill,
│                                               # Project, Certification, DescriptionBlock
│
├── features/                                   # Feature-based backend modules
│   ├── user/
│   │   ├── services/userService.ts             # DB user sync logic
│   │   └── schemas/userSchema.ts               # Zod user validation
│   ├── resume/
│   │   ├── services/resumeService.ts           # CRUD: getResumesByUserId, getResumeById, create, update, delete
│   │   ├── services/exportService.ts           # Playwright PDF generation (headless Chromium)
│   │   ├── services/importService.ts           # Orchestrates file extraction + AI normalization (no DB writes)
│   │   ├── services/extractors/
│   │   │   ├── extractorTypes.ts               # ExtractionResult type { text, wasTruncated, pageCount }
│   │   │   ├── pdfExtractor.ts                 # pdfjs-dist legacy build — Node.js PDF text extraction
│   │   │   └── docxExtractor.ts                # mammoth — DOCX raw text extraction + macro stripping
│   │   ├── schemas/resumeSchema.ts             # Zod: resumeDataSchema, updateResumeInputSchema, etc.
│   │   ├── schemas/importRequestSchema.ts      # Zod: file validation (MIME type, 5 MB size cap)
│   │   ├── types/index.ts                      # ResumeUpdatedResponse and other shared types
│   │   └── utils/slugUtils.ts                  # generateUniqueResumeSlug()
│   └── ai/
│       ├── services/resumeOptimizationService.ts  # 11-step AI pipeline: sanitize → prompt → call → parse → validate
│       ├── services/resumeImportNormalizationService.ts  # 10-step import pipeline: sanitize → prompt → AI → parse → validate → UUIDs
│       ├── schemas/aiRequestSchema.ts             # Zod: POST body (jobDescription: min 50, max 10000)
│       ├── schemas/aiResponseSchema.ts            # Zod: AI JSON contract with preprocessors + .catch() fallbacks
│       ├── schemas/aiImportResponseSchema.ts      # Zod: AI import response (partial Resume, all fields optional + .catch())
│       └── types/index.ts                         # PendingAiOptimization, SectionAcceptanceMap, AiOptimizationState,
│                                                  # AiEmptyResponseError, AiParseError, AiValidationError,
│                                                  # AiImportEmptyResponseError, AiImportParseError, AiImportValidationError,
│                                                  # ResumeExtractionError
│
├── lib/                                        # Shared utilities and libraries
│   ├── prisma/
│   │   └── client.ts                           # Centralized Prisma client instance (global singleton guard)
│   ├── ratelimit/
│   │   ├── client.ts                           # Redis client for rate limiting
│   │   └── limiters.ts                         # 7 reusable rate limiters (CRUD + export + AI + sync)
│   ├── ai/
│   ├── ai/
│   │   ├── client.ts                           # OpenRouter singleton (server-only, validates OPENROUTER_API_KEY)
│   │   ├── sanitize.ts                         # sanitizeJobDescription() + sanitizeAiTextOutput() + sanitizeResumeText()
│   │   └── prompts/
│   │       ├── promptVersion.ts                # RESUME_OPTIMIZATION_PROMPT_VERSION + RESUME_IMPORT_PROMPT_VERSION = 'v1'
│   │       ├── resumeOptimizationPrompt.ts     # buildSystemPrompt() + buildUserPrompt() + buildCompactResume()
│   │       └── resumeImportPrompt.ts           # buildImportSystemPrompt() + buildImportUserPrompt(text)
│   └── utils.ts                                # General utility functions (cn, etc.)
│   ├── use-resumes.ts                          # GET /api/v1/resumes → ResumeListItemJSON[]
│   ├── use-resume.ts                           # GET /api/v1/resumes/[id] → single resume
│   ├── use-create-resume.ts                    # POST /api/v1/resumes → create + redirect
│   ├── use-update-resume.ts                    # PATCH /api/v1/resumes/[id] → save changes
│   ├── use-delete-resume.ts                    # DELETE /api/v1/resumes/[id] → delete + navigate
│   ├── use-optimize-resume.ts                  # POST /api/v1/resumes/[id]/optimize → AI optimization
│   ├── use-import-resume.ts                    # POST /api/v1/resumes/import → AI resume import (no cache invalidation)
│   └── use-mobile.ts                           # Breakpoint detection hook
├── prisma/                                     # Prisma ORM configuration
│   ├── schema.prisma                           # Database schema (User, Resume, ResumeTemplate)
│   ├── seed.ts                                 # Seeds ResumeTemplate records
│   └── migrations/                             # All applied migrations
│
├── generated/                                  # Auto-generated files (never edit manually)
│   └── prisma/                                 # Generated Prisma client (output of prisma generate)
│
├── public/                                     # Static assets
│   ├── resume-templates/                       # Preview images for template picker
│   │   ├── classic.jpg
│   │   ├── traditional.jpg
│   │   ├── Professional.jpg                    # Note: uppercase P (filename as-is)
│   │   ├── prime-ats.jpg
│   │   ├── Clean.jpg                           # Note: uppercase C (filename as-is)
│   │   └── precission-ats.jpg                  # Note: typo in filename (double-s) — matches constants
│   └── ... (SVG icons, favicon, etc.)
│
├── node_modules/                               # Dependencies (pnpm managed)
├── .next/                                      # Next.js build output (gitignored)
├── .git/                                       # Git repository
└── .claude/                                    # Claude Code project settings
    └── settings.local.json                     # Local Claude Code configuration
```

---

## Key Architectural Patterns

### Frontend Resume Editor Architecture

The resume editor is a fully client-side, stateless system (no DB calls during editing):

```
URL slug  →  ResumePreview  →  TEMPLATE_COMPONENTS[slug]  →  Template component
                ↑                                                      ↑
         reads from store                                    receives resume prop
                ↑
         useResumeStore (Zustand)
                ↑
         ResumeForm  →  calls store actions on every change
```

Key rules:

- All templates accept `{ resume: Resume }` prop — no store access inside templates
- Templates use **plain Tailwind + semantic HTML only** — no ShadCN inside templates (print/PDF safe)
- A4 sizing is always `w-[794px] min-h-[1123px]` (210mm × 297mm at 96 dpi)
- Store initial ID is **always the static string `"preview-draft"`** to prevent hydration mismatch
- `crypto.randomUUID()` is only used inside action callbacks (runs client-side only)
- Both `<ResumeForm />` and `<ResumePreview />` are wrapped in `<EditorErrorBoundary>` — a crash in one panel does NOT kill the other

### Template Registry Pattern

```ts
// components/templates/index.ts
export type TemplateComponent = ComponentType<{ resume: Resume }>;
export const TEMPLATE_COMPONENTS: Record<string, TemplateComponent> = { ... };
```

Adding a new template requires only:

1. Create `components/templates/<id>/template.tsx` with a default export
2. Add entry to `TEMPLATE_COMPONENTS` in `index.ts`
3. Add entry to `resumeTemplates` array in `components/constants/resume-templates.ts`
4. Add preview image to `public/resume-templates/`

### Resume Form Architecture

`ResumeForm` is a single ScrollArea with sections. Each section is self-contained:

- Personal Info → calls `updatePersonalInfo()` on every field change
- Summary → calls `updateSummary()` on change
- Experience / Education / Projects → Accordion per item, `update*` / `remove*` store actions
- Skills → inline row list, `addSkill` / `updateSkill` / `removeSkill`
- Certifications → flat card list, `addCertification` / `updateCertification` / `removeCertification`

Description blocks (bullets) are stored as `DescriptionBlock[]` in the store but edited as a plain textarea (one line = one bullet). Parsed on `onChange`.

### AI Optimization Architecture

The AI feature is a non-destructive overlay on top of the live resume:

```
POST /api/v1/resumes/[id]/optimize
  → auth → rate limit → validate → optimizeResume() service
  → sanitize JD → fetch resume → build prompts → OpenRouter call
  → extractJsonObject() → JSON.parse → Zod validate → sanitize output
  → ID reconciliation → return PendingAiOptimization

Client side:
  useOptimizeResume hook (onSuccess) → setAiOptimizationResult(result)
  → OptimizationDialog shows diff view
  → acceptAiSection() / rejectAiSection() per section
  → applyAllAcceptedAiChanges() → writes to live resume state
  → useUpdateResume() → PATCH /api/v1/resumes/[id] → DB saved
```

Key rules:

- The AI result is **never written to the DB directly** — it flows through Zustand accept/reject first
- `applyAllAcceptedAiChanges()` calls existing store actions (`updateSummary`, `updateExperience`, `addSkill`, etc.) — no new write paths
- The AI slice resets to `null` on `clearAiOptimization()` — navigating away safely discards pending suggestions
- All AI model output is sanitized with `sanitizeAiTextOutput()` before it enters the store

### Zustand Store Structure

`store/resume-store.ts` exports `useResumeStore` with two slices:

**Resume slice** — the live editing state:

- `resume: Resume` — current editor state
- `hydrateResume(resume)` — loads DB data on edit page mount
- `resetResume()` — restores `INITIAL_RESUME` on edit page unmount
- `updatePersonalInfo`, `updateSummary`, `addExperience`, `updateExperience`, `removeExperience` (and equivalents for Education, Projects, Skills, Certifications)

**AI slice** — non-destructive optimization overlay:

- `aiOptimization: AiOptimizationState` — `null` when idle, `{ status, pending, sectionAcceptance }` otherwise
- `setAiOptimizationLoading()` / `setAiOptimizationResult()` / `setAiOptimizationError()` / `clearAiOptimization()`
- `acceptAiSection(section, itemId?)` / `rejectAiSection(section, itemId?)`
- `applyAllAcceptedAiChanges()` — reads accepted items, applies to live resume, then clears

### Import Resume Architecture

The import feature is a stateless pre-create flow — no DB writes, no file storage:

```
POST /api/v1/resumes/import (multipart/form-data)
  → auth → rate limit (3/hr) → importRequestSchema validate → arrayBuffer
  → importResume() service
  → format detect (MIME) → magic bytes check
  → pdfExtractor (pdfjs-dist legacy) OR docxExtractor (mammoth)
  → sanitizeResumeText() (15,000 char cap + injection strip)
  → normalizeImportedResume() — AI pipeline at temp=0.1
    → buildImportSystemPrompt() + buildImportUserPrompt(sanitizedText)
    → OpenRouter call → extractJsonObject() → JSON.parse
    → aiImportResponseSchema.safeParse() → sanitizeAiTextOutput()
    → assign crypto.randomUUID() for all IDs
  → return ImportedResumeData

Client side:
  useImportResume hook (onSuccess) → hydrateResume({ ...data, id: 'preview-draft', templateId: slug })
  → ImportResumeDialog shows success summary
  → user clicks "Continue to Editor" → dialog closes
  → user reviews, edits, and saves via existing SaveResumeButton / useCreateResume
```

Key rules:

- The import endpoint makes **no DB writes** — it returns `ImportedResumeData` to the client
- File is processed in memory as `ArrayBuffer` and discarded — no S3, no persistence of raw uploads
- `workerSrc` must be set to `pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href` — empty string triggers the "fake worker" error
- The worker specifier is built at runtime via `Array.join('/')` to prevent Turbopack from statically resolving the ESM module as a CommonJS require
- `createRequire(import.meta.url)` is used for `.resolve()` path lookup only — the module is never `require()`'d
- 4-layer prompt injection defense: `sanitizeResumeText()` → `<resume_text>` XML delimiters → system prompt reinforcement → Zod schema validation
- `hydrateResume()` must always be called with `id: 'preview-draft'` and the selected `templateId` — never use IDs from the AI response for store hydration

### TanStack Query Hook Pattern

All 6 data hooks follow the same pattern (mirrors `use-update-resume.ts`):

```ts
// 1. Type the success + error response shapes
type XxxSuccess = { success: true; data: { ... }; message: string }
type XxxError   = { success: false; error: string }

// 2. Fetcher using axios with typed generic
async function fetchXxx() {
  try {
    const { data } = await axios.get<XxxSuccess>('/api/v1/...');
    return data.data.xxx;
  } catch (error) {
    if (isAxiosError<XxxError>(error)) throw new Error(error.response?.data?.error ?? 'Fallback');
    throw error;
  }
}

// 3. useQuery or useMutation with queryKey and cache invalidation
export function useXxx() {
  return useQuery({ queryKey: ['xxx'], queryFn: fetchXxx });
}
```

### Error Boundary Pattern

`components/ui/editor-error-boundary.tsx` exports `EditorErrorBoundary` — a React class component. Use it to isolate any section of the UI that renders complex user data:

```tsx
<EditorErrorBoundary label="Resume Preview">
  <ResumePreview slug={slug} />
</EditorErrorBoundary>
```

- Each boundary is independent — a crash in one doesn't affect siblings
- Logs structured JSON to console with `[EditorErrorBoundary]` prefix
- Shows a "Try again" fallback that resets the boundary state without a full page reload

### Backend-First Architecture (for API/DB features)

- Database schema defined first in `prisma/schema.prisma`
- Business logic in `features/*/services/`
- Validation schemas in `features/*/schemas/` (using Zod)
- Thin route handlers in `app/api/`

### API Route Pattern

Every protected route follows this exact order:

```
1. auth()                          → 401 if missing
2. aiOptimizeLimiter.limit(userId) → 429 with rate limit headers if exceeded
3. params validation               → 400 if missing
4. request.json() → schema.safeParse() → 400 if invalid
5. resolveDbUser(userId)           → 404 if not synced
6. service call (business logic)   → typed errors from service
7. NextResponse.json({ success: true, data, message })
```

### Library Organization

Centralized utilities in `lib/`:

- **prisma/client.ts** — Single Prisma client instance (global singleton guard for hot-reload)
- **ratelimit/client.ts** — Shared Redis connection
- **ratelimit/limiters.ts** — 8 rate limiters: `resumeCreateLimiter`, `resumeUpdateLimiter`, `resumeDeleteLimiter`, `resumeExportLimiter`, `aiOptimizeLimiter`, `resumeImportLimiter`, `userSyncLimiter`, plus a general one
- **ai/client.ts** — OpenRouter singleton (server-only; validates `OPENROUTER_API_KEY` at init)
- **ai/sanitize.ts** — `sanitizeJobDescription()` (input) + `sanitizeAiTextOutput()` (output) + `sanitizeResumeText()` (import text cap + injection strip)
- **ai/prompts/resumeOptimizationPrompt.ts** — `buildSystemPrompt()` + `buildUserPrompt()` + `buildCompactResume()`
- **utils.ts** — Helper functions (`cn`, etc.)

### API Design

- Versioned routes: `/api/v1/*`
- RESTful methods: GET, POST, PUT/PATCH, DELETE
- Consistent response format with `success` boolean
- Rate limiting applied before business logic
- Validation via Zod schemas before database operations
- All errors from `features/ai/types` (AiEmptyResponseError, AiParseError, AiValidationError) mapped to HTTP codes in route handler

---

## Technology Stack

- **Framework:** Next.js 16.2.6 (App Router, Turbopack)
- **State Management:** Zustand 5.x (client-side resume editor + AI optimization overlay)
- **Server State:** TanStack Query v5 (data fetching, mutations, cache invalidation)
- **HTTP Client:** Axios (all API calls from hooks — never raw `fetch()`)
- **ORM:** Prisma 7.x
- **Database:** PostgreSQL
- **Authentication:** Clerk 7.x
- **Rate Limiting:** Upstash (Redis + Ratelimit) — 7 limiters
- **AI Provider:** OpenRouter via `@openrouter/sdk` (current model: `nvidia/nemotron-3-super-120b-a12b:free`)
- **UI Components:** Shadcn/ui (50+ components)
- **Validation:** Zod v4 (input schemas + AI response schemas with `.catch()` resilience)
- **Styling:** Tailwind CSS v4
- **PDF Export:** Playwright (headless Chromium) — runs in (print) route group
- **PDF Import:** pdfjs-dist 6.x legacy build (pdfjs-dist/legacy/build/pdf.mjs) — Node.js text extraction
- **DOCX Import:** mammoth — DOCX raw text extraction, strips macros automatically
- **Package Manager:** PNPM
- **Deployment:** Docker (docker-compose.yml available)

---

## Environment Configuration

All environment variables are stored in `.env` (not committed). Current required variables:

- `DATABASE_URL` — PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL` — Redis REST API endpoint
- `UPSTASH_REDIS_REST_TOKEN` — Redis authentication token
- `CLERK_SECRET_KEY` — Clerk authentication secret
- `CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `OPENROUTER_API_KEY` — OpenRouter API key for AI optimization

See CLAUDE.md "Rules For Environment Variables" section for detailed env rules.

---

## Important Notes for Future Development

- Never create `src/` directory; use root-level `app/`, `features/`, `lib/` instead
- `store/` and `types/` live at the root level alongside `app/`, `lib/`, `features/`
- Always validate data with Zod schemas before database operations
- Keep rate limiters centralized in `lib/ratelimit/`
- Never expose secrets in route handlers; use server actions or API routes only
- Database migrations must be created with meaningful names: `pnpm prisma migrate dev --name descriptive_name`
- After schema changes, run: `npx prisma generate`
- Template components must **never** use `useResumeStore` directly — always receive `resume` as a prop
- Do not use ShadCN components inside template files — keep them print/PDF compatible
- The `public/resume-templates/` image filenames have inconsistent casing (Professional.jpg, Clean.jpg) and a typo (precission-ats.jpg) — these must match exactly what's in `resume-templates.ts`
- `lib/ai/client.ts` is **server-only** — never add `"use client"` or import it from a client component
- The AI model constant lives in `features/ai/services/resumeOptimizationService.ts` as `AI_MODEL` — one-line change to switch models
- AI optimization makes **no DB writes** — it returns `PendingAiOptimization` to the client. DB is updated only when the user clicks "Save Changes" via `useUpdateResume`
- The `(print)` route group renders resumes without the main sidebar/header — it is the Playwright PDF render target
- All 6 data-fetching hooks use Axios + typed error shapes — never add a hook using raw `fetch()`
- `EditorErrorBoundary` must wrap any component that renders complex user-controlled data (templates, form sections)
- The Zustand AI slice is a non-destructive overlay — `applyAllAcceptedAiChanges()` must always call existing resume update actions, never write directly to `state.resume`
- The import endpoint at `POST /api/v1/resumes/import` makes **no DB writes** — it is a pure in-memory transform: file bytes → `ImportedResumeData`
- pdfjs-dist legacy build requires `GlobalWorkerOptions.workerSrc` set to a `file://` URL pointing at `pdfjs-dist/legacy/build/pdf.worker.mjs` — an empty string triggers a runtime "fake worker" error
- The `workerSrc` specifier must be built at runtime via array join to prevent Turbopack from statically resolving it as a CommonJS require (pdfjs-dist is ESM-only)
- `useImportResume` sets `retry: false` — never auto-retry AI calls per CLAUDE.md rules
- After `useImportResume` succeeds, always call `hydrateResume({ ...data, id: 'preview-draft', templateId: slug })` — never use IDs from the AI response for store hydration
