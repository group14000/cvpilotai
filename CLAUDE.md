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
   src/lib/ratelimit/
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
2. Store prompts inside dedicated modules.
3. Validate AI responses before saving.
4. Implement retries and fallback handling.
5. Track AI token usage when required.
6. Never expose raw prompts to the frontend.
7. AI generation logic must remain server-side.

---

## Logging Rules

1. Log important backend events.
2. Never log:
   - secrets
   - tokens
   - passwords
   - sensitive user data
3. Use structured logging.
4. Separate dev logs from production logs.

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
src/
  features/
    resume/
      actions/
      api/
      components/
      services/
      schemas/
      types/
      utils/

  lib/
    prisma/
    ratelimit/
    auth/
    ai/
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
6. Keep AI prompts reusable and version-controlled.
7. Optimize expensive AI generation APIs.
8. Cache reusable AI responses where applicable.
9. Track resume generation history.
10. Design for future multi-template support.

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
│   │       ├── page.tsx                        # Resumes listing page
│   │       ├── new/
│   │       │   └── page.tsx                    # Template picker (uses ResumeTemplateCard)
│   │       └── create-resume/
│   │           └── [slug]/
│   │               └── page.tsx                # Resume editor: form (left) + preview (right)
│   ├── api/
│   │   └── v1/                                 # API versioning
│   │       └── user/
│   │           └── sync/
│   │               └── route.ts                # User synchronization endpoint (Clerk → DB)
│   ├── providers.tsx                           # Root providers: SidebarProvider, QueryClient, Theme
│   ├── layout.tsx                              # Root layout: ClerkProvider, ThemeProvider, Providers
│   ├── page.tsx                                # Home / landing page
│   ├── globals.css                             # Global styles + CSS theme variables (light/dark)
│   └── favicon.ico
│
├── components/                                 # Reusable UI components
│   ├── ui/                                     # Shadcn/ui component library (50+ components)
│   │   ├── accordion.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── scroll-area.tsx
│   │   ├── separator.tsx
│   │   ├── sidebar.tsx
│   │   ├── textarea.tsx
│   │   └── ... (50+ components)
│   ├── resume/                                 # Resume editor UI components
│   │   ├── resume-form.tsx                     # Full section-based editor form (Zustand-connected)
│   │   ├── resume-preview.tsx                  # A4 live preview wrapper (reads from store)
│   │   └── template-card.tsx                   # Template picker card (ShadCN Card + Next Image)
│   ├── templates/                              # Resume template implementations
│   │   ├── index.ts                            # Registry: TemplateComponent type + TEMPLATE_COMPONENTS map
│   │   ├── classic/
│   │   │   └── template.tsx                    # Classic: two-column [160px_1fr] serif layout
│   │   ├── traditional/
│   │   │   └── template.tsx                    # Traditional: full-width bold uppercase section headers
│   │   ├── professional/
│   │   │   └── template.tsx                    # Professional: indigo sidebar + main content split
│   │   ├── prime-ats/
│   │   │   └── template.tsx                    # Prime ATS: ATS-safe, no columns, list-disc bullets
│   │   ├── clean/
│   │   │   └── template.tsx                    # Clean: emerald accents, vertical timeline lines
│   │   └── precision-ats/
│   │       └── template.tsx                    # Precision ATS: skills-highlight block, ATS-optimized
│   ├── constants/
│   │   ├── resume-templates.ts                 # ResumeTemplate[] array (id, name, description, image)
│   │   └── sidebar-arrays.ts                   # SidebarItem[] for main navigation
│   ├── main-sidebar.tsx                        # App sidebar: nav links + Clerk user footer + SignOut
│   ├── main-header.tsx                         # Top header: SidebarTrigger + Separator + title
│   └── theme-provider.tsx                      # next-themes ThemeProvider wrapper
│
├── store/                                      # Zustand client-side state
│   └── resume-store.ts                         # useResumeStore: resume state + all CRUD actions
│                                               # (static initial ID "preview-draft" avoids hydration mismatch)
│
├── types/                                      # Global TypeScript types
│   └── resume.ts                               # Resume, PersonalInfo, Experience, Education, Skill,
│                                               # Project, Certification, DescriptionBlock
│
├── features/                                   # Feature-based backend modules
│   └── user/                                   # User feature
│       ├── services/
│       │   └── userService.ts                  # Business logic for user operations
│       └── schemas/
│           └── userSchema.ts                   # Zod schemas for user validation
│
├── lib/                                        # Shared utilities and libraries
│   ├── prisma/
│   │   └── client.ts                           # Centralized Prisma client instance
│   ├── ratelimit/
│   │   ├── client.ts                           # Redis client for rate limiting
│   │   └── limiters.ts                         # Reusable rate limiter configurations
│   └── utils.ts                                # General utility functions (cn, etc.)
│
├── hooks/                                      # React custom hooks
│   └── use-mobile.ts                           # Mobile detection hook
│
├── prisma/                                     # Prisma ORM configuration
│   ├── schema.prisma                           # Database schema definition
│   └── migrations/
│       └── 20260520103548_update_resume_slug_uniqueness/
│           └── migration.sql                   # @@unique([userId, slug]) on Resume
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

### Backend-First Architecture (for API/DB features)

- Database schema defined first in `prisma/schema.prisma`
- Business logic in `features/*/services/`
- Validation schemas in `features/*/schemas/` (using Zod)
- Thin route handlers in `app/api/`

### Library Organization

Centralized utilities in `lib/`:

- **prisma/client.ts** — Single Prisma client instance
- **ratelimit/client.ts** — Shared Redis connection
- **ratelimit/limiters.ts** — Reusable rate limit configurations
- **utils.ts** — Helper functions (`cn`, etc.)

### API Design

- Versioned routes: `/api/v1/*`
- RESTful methods: GET, POST, PUT/PATCH, DELETE
- Consistent response format with `success` boolean
- Rate limiting applied before business logic
- Validation via Zod schemas before database operations

## Technology Stack

- **Framework:** Next.js 16.2.6 (App Router, Turbopack)
- **State Management:** Zustand (client-side resume editor state)
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** Clerk
- **Rate Limiting:** Upstash (Redis + Ratelimit)
- **UI Components:** Shadcn/ui
- **Validation:** Zod
- **Styling:** Tailwind CSS v4
- **Package Manager:** PNPM
- **Deployment:** Docker (docker-compose.yml available)

## Environment Configuration

All environment variables are stored in `.env` (not committed):

- `DATABASE_URL` — PostgreSQL connection string
- `UPSTASH_REDIS_REST_URL` — Redis REST API endpoint
- `UPSTASH_REDIS_REST_TOKEN` — Redis authentication token
- `CLERK_SECRET_KEY` — Clerk authentication secret
- And other service API keys

See CLAUDE.md "Rules For Environment Variables" section for detailed env rules.

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
