# Cursor Project Rules — RecipeNest (Next.js + Supabase)

You are an expert in TypeScript, Next.js App Router (v14+), React, Supabase (Auth/Postgres/Storage/RLS), TailwindCSS, and shadcn/ui. You build secure, accessible, high-quality web apps with minimal client-side state and clean server boundaries.

## Mission & Scope

Build RecipeNest: a social recipe CRUD app with auth, image uploads, likes, search, and category filters.

Ship a production-ready MVP deployed on Vercel, backed by Supabase.

Follow the PRD in `docs/RecipeNest_PRD.md`. If something is unclear, make the safest assumption and proceed.

## Code Style & Structure

Write concise, modular TypeScript. No classes. Prefer small pure functions.

Strict TypeScript: no any/unknown unless unavoidable; no type assertions if you can infer.

Use descriptive names (e.g., isLoading, hasError, handleSubmit).

Favor early returns and guard clauses. Keep control flow shallow.

Do not duplicate logic; factor reusable utilities.

Document exported functions/components with brief TSDoc/JSDoc when intent isn't obvious.

Formatting: Prettier + ESLint/biome; keep imports sorted; remove dead code.

## Directory Conventions
```
app/                   # Next.js App Router
  (marketing)/         # Landing/public pages
  (app)/               # Auth'd app routes (protected)
  explore/             # Public archive & search
  r/[slug]/            # Public recipe detail
  api/                 # Route handlers (server-only)
components/            # UI components (shadcn-based), subfolders by domain
lib/                   # server & shared libs (db, auth, validation, utils)
lib/db/                # Supabase server client, queries, SQL helpers
lib/validation/        # zod schemas
lib/utils/             # cn(), slugify, pagination helpers
styles/                # globals.css (Tailwind base)
types/                 # shared interfaces
scripts/               # seed/migration helpers (server-only)
public/                # static assets
```

Named exports for components/utilities.

Lowercase-dash for directories (e.g., recipe-card).

Keep files ≤ ~200–300 LOC; split into subcomponents.

## React, UI & Styling

Use shadcn/ui + Tailwind. No custom CSS files unless absolutely needed.

Use server components by default. Mark client components with "use client" only when needed (forms, event handlers).

Co-locate small client subcomponents inside the page/component directory when they are only used there.

Conditional classes via a cn() helper (clsx/tailwind-merge). No string concatenation.

Accessibility: label form controls, use semantic HTML, keyboard focus states, aria-* where appropriate. All interactive elements must be reachable by keyboard.

Support dark mode via Tailwind.

## Forms & Validation

Use react-hook-form + zodResolver with zod schemas from lib/validation.

Display inline errors, disable submit while pending, optimistic updates only where safe (e.g., likes).

## Environment Variables & Startup Validation

Required env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `NEXT_PUBLIC_SITE_URL`

Configure allowed redirect URLs in Supabase Auth to Vercel preview + prod.

Never access server-only env vars in client code.

**Startup Validation**: Create a `lib/env.ts` file that validates all required environment variables at startup using zod. This prevents runtime failures due to missing configuration:

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

## Supabase (Auth, DB, Storage)

Use @supabase/supabase-js and SSR helpers. Create server client only in server contexts (route handlers, server actions, RSC).

Never expose the service role key to the client. Use it only in scripts/migrations or secure server code.

Respect RLS policies. Assume the database enforces access; do not bypass with service role in runtime web requests.

Schema source of truth is scripts/sql/schema.sql. Mutations to schema go through SQL migrations.

Storage bucket: recipe-images. Public read; writes restricted to authenticated users.

## Server/Client Boundaries

Data fetching/mutations:

Use Server Actions or route handlers for writes.

Use RSC/server for reads, stream results to clients.

Do not initialize Supabase client in global client-side providers for data fetching.

## Likes & Concurrency

Enforce one-like-per-user-per-recipe with a unique DB constraint.

Update like counts via DB trigger; do not trust client increments.

UI uses optimistic toggle but reconciles on failure.

## Data & Search

Use Postgres tsvector + GIN for keyword search over title + summary.

Category filter via join table; prefer server-side filtering.

Pagination: cursor-based on created_at/id.

## API Design

Route handlers under app/api/* are server-only and must validate input with zod.

Return typed JSON (as const where appropriate). Handle and log errors; do not leak stack traces to clients.

Prefer Server Actions for form posts when feasible.

## Security & Privacy

RLS enabled on all tables; policies match PRD. Test with anon vs auth sessions.

Sanitize/validate all user input. Never trust client data.

Do not log secrets or PII. Centralize logging utilities.

CSRF: Server Actions/Next forms are preferred; if using fetch, include proper auth context.

Content Security Policy: rely on Next.js defaults; avoid dangerouslySetInnerHTML.

## Error Handling & Observability

Validate early with zod and return typed errors.

**Error Boundaries**: Place error boundaries strategically in the component tree:
- Root level (`app/layout.tsx`) for global fallback
- Route level (`app/(app)/layout.tsx`) for authenticated sections  
- Component level for complex interactive features (recipe editor, image upload)
- Always provide user-friendly error messages with recovery actions

Use error boundaries for client islands.

Optional: integrate Sentry/Logtail. In errors, show friendly messages.

## Performance

Optimize Web Vitals (LCP/CLS):

Use next/image with width/height and responsive sizes.

Stream server components; suspense client boundaries.

Avoid unnecessary client state; prefer derived props.

Database: use indexed queries; avoid N+1 by batching child fetches.

## Testing & Coverage

**Unit Tests**: Vitest for utility functions and server actions
- Target 80%+ coverage on critical business logic
- Test all zod schemas and validation functions

**Component Tests**: @testing-library/react for client components
- Focus on user interactions and accessibility
- Test error states and loading states

**E2E Tests**: Playwright for critical user journeys
- **Critical Paths**: Auth flow, create recipe, like/unlike, search, category filtering
- Test with both authenticated and anonymous users
- Verify RLS policies work correctly

**Coverage Targets**: 
- Business logic: 80%+  
- API routes: 90%+
- Critical components: 70%+

Seed ephemeral test data via Supabase SQL scripts.

## Documentation Requirements

RecipeNest maintains comprehensive documentation to ensure code quality, facilitate team collaboration, and preserve architectural decisions. All documentation files live in the `docs/` directory and must be kept current with implementation changes.

### Core Documentation Files

#### Database Documentation

**`docs/database-schema.md`**
*Purpose*: Single source of truth for all database table structures, relationships, and constraints.

*What to log*:
- Complete table definitions with column types, constraints, and indexes
- Foreign key relationships and junction tables
- Unique constraints and their business logic reasoning
- Column descriptions for non-obvious fields
- Migration history for major schema changes

*When to update*: Any table creation, column addition/removal, constraint changes, or index modifications.

**`docs/rls-policies.md`** 
*Purpose*: Document Row Level Security policies and their authorization logic to ensure proper access control.

*What to log*:
- All RLS policies with their exact SQL definitions
- Policy purpose and which user types it affects (authenticated, anonymous, admin)
- Business rules each policy enforces
- Policy testing scenarios (what should/shouldn't be accessible)
- Dependencies between policies

*When to update*: Any RLS policy creation, modification, or deletion.

**`docs/database-functions.md`**
*Purpose*: Document custom database functions, triggers, and stored procedures for maintainability.

*What to log*:
- Function signatures with parameter descriptions
- Return types and example outputs  
- Trigger definitions and what events fire them
- Business logic implemented at the database level
- Performance considerations and optimization notes

*When to update*: Any database function, trigger, or procedure changes.

#### Storage & File Management

**`docs/storage-policies.md`**
*Purpose*: Document Supabase Storage bucket policies and file handling procedures.

*What to log*:
- Bucket configurations (public/private, size limits)
- Upload policies and authentication requirements
- File naming conventions and organization structure
- CDN and optimization settings
- Security policies for different file types

*When to update*: Storage bucket changes, policy modifications, or new file handling features.

#### API & Interface Documentation

**`docs/api-reference.md`**
*Purpose*: Comprehensive reference for all API endpoints, Server Actions, and their contracts.

*What to log*:
- Route handler endpoints with HTTP methods
- Server Action function signatures and form data requirements
- Request/response schemas with zod types
- Authentication and authorization requirements
- Rate limiting and error response formats
- Integration examples for complex workflows

*When to update*: New API routes, Server Actions, significant parameter changes, or authentication modifications.

**`docs/component-interfaces.md`**
*Purpose*: Document complex reusable components and their prop interfaces for consistent usage.

*What to log*:
- Component prop interfaces with TypeScript definitions
- Required vs optional props with default values
- Component composition patterns and slot usage
- Accessibility features and keyboard interactions
- Styling variants and customization options
- Integration examples and common use cases

*When to update*: New reusable components, prop interface changes, or significant behavior modifications.

#### Architecture & Planning

**`docs/architecture.md`**
*Purpose*: High-level system architecture, design decisions, and technical direction.

*What to log*:
- System architecture diagrams and component relationships
- Technology choices and their rationales  
- Design patterns and conventions used throughout the project
- Performance considerations and optimization strategies
- Security architecture and threat model
- Third-party integrations and their boundaries

*When to update*: Major architectural changes, technology additions, or significant refactoring decisions.

**`docs/project-history.md`**
*Purpose*: Chronological record of major features, milestones, and development phases.

*What to log*:
- Feature development milestones and completion dates
- Major refactoring efforts and their outcomes
- Performance optimization phases and results
- Security updates and vulnerability fixes
- Team decisions and their business context
- Lessons learned from each development phase

*When to update*: Completion of major features, significant project milestones, or important team decisions.

#### Change Tracking

**`docs/changelog.md`**
*Purpose*: Detailed technical change log following semantic versioning for release management.

*What to log*:
- Breaking changes with migration instructions
- New features with usage examples
- Bug fixes with issue descriptions
- Performance improvements with metrics
- Security updates and their impact
- Dependency updates and compatibility notes

*When to update*: Every release or significant code change that affects external behavior.

### Documentation Workflow

**Implementation Process**:
1. **Before coding**: Review relevant documentation to understand current state
2. **During development**: Note what documentation will need updates
3. **After implementation**: Update all affected documentation files
4. **Code review**: Verify documentation updates are included in PRs

**Quality Standards**:
- **Accuracy**: Documentation must reflect actual implementation
- **Completeness**: Include all information needed for future developers
- **Clarity**: Write for someone unfamiliar with the specific feature
- **Examples**: Provide concrete examples for complex concepts
- **Maintenance**: Remove outdated information promptly

**Documentation Checklist**: For every feature/change, verify:
- [ ] Database changes reflected in schema/RLS/functions docs
- [ ] API changes documented with examples
- [ ] Complex components documented with interfaces
- [ ] Architectural decisions explained and justified
- [ ] Change log updated with user-facing impacts
- [ ] Project history updated for major milestones

## Git & Reviews

Small PRs with clear titles (type/scope): feat(recipes): create editor form.

Checklist per PR:
- [ ] Types strict, no any
- [ ] RSC by default; client only where needed
- [ ] Inputs validated with zod
- [ ] RLS respected (tested anon vs auth)
- [ ] a11y labels and focus states
- [ ] Lighthouse ≥ 90 on key pages
- [ ] Documentation updated per documentation checklist
- [ ] Tests added/updated for new functionality

## Output Expectations (when AI generates code)

Provide complete, runnable files with correct imports and exports.

Include types and zod schemas for inputs.

Use Tailwind for all styling; shadcn/ui components where suitable.

Include loading and empty states.

No placeholders or TODOs. If something is not implementable, state it clearly.

## Patterns & Snippets

### Environment Validation
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

### Supabase Server Client (RSC / Server Action)
```typescript
// lib/db/server.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

export function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );
}
```

### Server Action Example
```typescript
// app/(app)/recipes/_actions/create-recipe.ts
'use server';
import { z } from 'zod';
import { getServerSupabase } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';

const RecipeInput = z.object({
  title: z.string().min(2),
  summary: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export async function createRecipe(formData: FormData) {
  const parsed = RecipeInput.safeParse({
    title: formData.get('title'),
    summary: formData.get('summary') ?? undefined,
    isPublic: (formData.get('isPublic') as string) === 'on',
  });
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten() } as const;

  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Unauthorized' } as const;

  const { error } = await supabase
    .from('recipes')
    .insert({ title: parsed.data.title, summary: parsed.data.summary, is_public: parsed.data.isPublic, author_id: user.id });
  if (error) return { ok: false, message: 'Failed to create' } as const;

  revalidatePath('/my');
  return { ok: true } as const;
}
```

### Error Boundary Component
```typescript
// components/ui/error-boundary.tsx
'use client';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-center">
        We encountered an error while loading this content.
      </p>
      <Button onClick={resetErrorBoundary} variant="outline">
        Try again
      </Button>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}
```

### cn() Utility
```typescript
// lib/utils/cn.ts
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: unknown[]) {
  return twMerge(clsx(inputs));
}
```

## Prohibited / Caution

No service role key in any runtime that can be requested by the browser.

No schema changes outside migration scripts.

No global client-side data fetching via Supabase for protected data.

Use dangerouslySetInnerHTML only with escaped/sanitized content (prefer not at all).

## Runbook

`pnpm dev` → local dev

`pnpm lint` / `pnpm typecheck` / `pnpm test`

`pnpm db:push` → run SQL migration scripts

Vercel: set env vars; connect Git; preview deploys per PR

## Work Completed Log

Always update `summary_work_completed.md` at the repo root for any major feature, significant fix, architecture decision, or phase change.

### Purpose

**Context Preservation** – never lose track of what we've built

**Progress Tracking** – clear view of completed vs pending

**Technical Reference** – key files, components, and decisions

**Issue Resolution** – documented fixes

**Future Planning** – cues for upcoming phases

### How to log (concise + required)

Prepend a new entry (latest at top).

Use the template below and always include PRD variance notes:

**NEW FEATURE** — if you added anything not in RecipeNest_PRD.md (1–3 sentence description).

**CHANGED FEATURE** — if you modified something listed in RecipeNest_PRD.md (brief before/after + rationale and PRD section reference).

### Template

```markdown
## YYYY-MM-DD HH:mm (America/Denver) — <Short Title>

**Scope:** <feature|bugfix|refactor>
**Files:** <relative paths>
**Why:** <problem being solved>
**What changed:**
- <bulleted highlights>

**Testing:** <manual/e2e/unit; env>
**Impact:** <perf|SEO|DB schema|RLS|API|UX|None>

### PRD Variance
- NEW FEATURE: <name> — <1–3 sentence description>.
- CHANGED FEATURE: <name> — PRD §<section>. Before: <brief>. After: <brief>. Rationale: <why>.
```