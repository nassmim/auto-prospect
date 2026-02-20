# Auto-Prospect: AI Context

**CRITICAL: Always examine existing codebase patterns and follow the same structure, naming, and organization. When in doubt, find similar code and replicate its approach.**

## Task Discipline

**Start each task with:** `"I will focus ONLY on: [task]. Nothing more."`

- Do ONLY what is requested - no extras, refactoring, or improvements
- Ask for clarification if unclear BEFORE starting
- Complete and stop

## AUTO-WORK MODE (when active)

**Start each task/subtask with:** `"🤖 AUTO-WORK MODE: [task]" + "Context: [X]% - will compact at 70%+"`

- Monitor context at task start
- At 70%+: run `/compact` immediately
- Execute silently: no announcements, verbose logs, or commentary
- Output only: errors, user questions, completion confirmations

## Worker Architecture (SMS/Voice/WhatsApp)

**CRITICAL CONTEXT: Dual Usage Pattern**
Workers are called from TWO different sources:
1. **User-initiated (synchronous)**: User clicks "Send SMS" → needs immediate validation feedback
2. **Background jobs (async)**: Daily hunt orchestrator → can fail silently and retry

**Architecture Layers**:

**1. Controller Layer (Validation + Orchestration)**
- ALL user-facing validation happens HERE (before queueing)
- Fetch necessary data (API keys, account settings) upfront
- Pass validated data as arguments to workers (avoid duplication)
- **Return** for validation errors (4xx) - never throw
- **Throw** only for unexpected server errors (5xx)

**2. Worker Layer (Execution Only)**
- NO validation here - controller already validated
- Accept all necessary data as arguments (no re-fetching)
- Execute API calls with provided data
- **Throw** retryable errors (429 rate limit, 5xx server errors) → BullMQ retries
- **Throw UnrecoverableError** for permanent failures → job marked failed, no retry

**Error Handling Pattern**:
```typescript
// Controller: Validation errors
if (!apiKey) {
  return res.status(400).json({ success: false, error: ErrorCode.API_KEY_REQUIRED });
}

// Worker: Retryable errors
if (error.response?.status === 429) {
  throw error; // BullMQ retries
}

// Worker: Permanent failures
throw new UnrecoverableError(`SMS send failed: ${ErrorCode.MESSAGE_SEND_FAILED}`);
```

## Tech Stack
Next.js 16.1.1 (App Router) • React 19 • TypeScript • Supabase (PostgreSQL + Auth) • Drizzle ORM • Tailwind CSS 4 • shadcn/ui • react-hook-form + Zod • SWR • pnpm (not npm)

## UI/UX
- **shadcn/ui**: All UI components from `src/components/ui/`
- **Forms**: react-hook-form + Zod (client AND server validation - reuse same schema)

## Key Directories
`src/app/` pages • `src/actions/` server actions • `src/services/` business logic • `src/lib/drizzle/` DB+RLS • `src/schema/` Drizzle schemas • `src/config/` routes & SWR keys • `supabase/migrations/` SQL (never edit manually)

## Database Patterns

**Schema**: Use Drizzle built-ins (`.defaultRandom()`, `.references()`) - examine `src/schema/` files for patterns

**RLS (Row Level Security)**
- All tables have RLS enabled (via `pgPolicy` in schema)
- Auth always server-side
- DB access: `createDrizzleSupabaseClient()` → use `dbClient.admin` (bypass RLS) or `dbClient.rls(query)` (enforce RLS)
- Pattern 1 (dynamic): `if (bypassRLS) query(dbClient.admin) else dbClient.rls(query)` - for mixed contexts
- Pattern 2 (admin only): `dbClient.admin.query...` - for cron jobs, system tasks
- Pattern 3 (RLS only): `dbClient.rls((tx) => tx.query...)` - for user-triggered actions
- **Examine existing services to see patterns**

**Migrations (Drizzle-only workflow)**

Development (local):
1. Modify schema: `src/schema/*.ts`
2. Generate: `pnpm db:generate`
3. Review SQL: `supabase/migrations/*.sql`
4. Apply: `pnpm db:migrate` (or `pnpm db:reset` for fresh start)
5. Seed (optional): `pnpm db:seed`
6. Commit migrations

Production (remote):
1. Same as dev: modify schema → generate → review → commit
2. Deploy: CI/CD runs `pnpm db:migrate` against remote database
3. Drizzle tracks applied migrations in `drizzle.__drizzle_migrations` table

**FORBIDDEN:** `drizzle-kit push`, `supabase db push`, `supabase db reset`, Supabase UI changes, manual SQL outside migrations

**NEVER create, modify, or delete migration files manually.** This includes the migration SQL files and the Drizzle journal (`_journal.json`). Manual edits always cause inconsistencies. The only allowed way to produce migrations is via `pnpm db:generate` (and `pnpm db:generate --custom`). No exceptions.

**Interactive prompts**: If `pnpm db:generate` prompts for input (create vs rename), STOP and tell user to run manually

**Available commands**:
- `pnpm db:generate` - Generate migration from schema changes
- `pnpm db:migrate` - Apply pending migrations (incremental)
- `pnpm db:reset` - Drop all tables, rerun all migrations (clean slate)
- `pnpm db:seed` - Load data from `supabase/seed.sql`
- `pnpm db:fresh` - Reset + seed (complete refresh)
- `pnpm db:dump` - Export current data to `supabase/seed.sql`

**Separate migrations**: Drizzle-generated (tables, RLS) and custom SQL (grants, triggers) in different files
- Step 1: `pnpm db:generate` (Drizzle migration)
- Step 2: `pnpm db:generate --custom` (custom migration with grants)

**New table checklist**:
1. Define RLS policies in schema (see `src/schema/user.ts` for pattern)
2. `pnpm db:generate`
3. `pnpm db:generate --custom` → add necessary grants: `grant select, insert, update, delete on table public.X to authenticated, service_role;`
4. `pnpm db:migrate` to apply

**Git**: Concise commit messages, no "Co-Authored-By:"

## Core Patterns

**No hardcoded values**: Never hardcode strings, numbers, routes, keys, or any constants. Use config files in `src/config/` or create new ones as needed. For instance: 
  - **Routes**: Always use `src/config/routes.ts` - import `pages`, add new routes there first
  - **SWR keys**: Always use `src/config/swr-keys.ts` - never use string literals
**Auth**: Supabase Auth → JWT → middleware (`src/proxy.ts`) → server/client `createClient()` → RLS policies

## Architecture & Patterns

**CRITICAL: Examine existing codebase for patterns. Don't invent - replicate.**

**Pages**: `page.tsx` = thin (data fetch + composition). UI logic → separate view components
**Components**: Server by default. `'use client'` only for: events, browser APIs, state, client libraries

**Data Fetching**:
- Server-side default (SSR, SEO, security)
- Client-side (SWR) when: frequently updating data, prop drilling avoidance, polling needed
- **Hybrid pattern**: Server fetches initial → client component uses SWR with `fallbackData`
- Polling config: use constants from `src/hooks/use-swr-action.ts` (SWR_POLLING)
- Optimistic updates: mutate with `revalidate: false` → server action → mutate again (or rollback on error)

**Server Actions vs Services**:
- `src/actions/*.actions.ts`: Client-callable (`"use server"`), thin wrappers
- `src/services/*.service.ts`: Reusable server logic, business rules
- Preference: Services → Server Actions → API Routes

**Code Style**:
- Functional (no classes), named exports (no default)
- Early returns, descriptive names (`isLoading`, `handleClick`)
- TypeScript strict (no `any`)
- Comment only complex/non-obvious logic
- **NEVER add historical comments** (e.g., "renamed from X", "previously was Y", "used to be Z") - code history belongs in git, not comments

**Naming**: PascalCase (components/types), kebab-case (files/dirs), camelCase (vars/funcs), UPPERCASE (env/constants)
**Validation**: react-hook-form + Zod (client AND server - reuse schema)
**Performance**: Avoid unnecessary state, dynamic imports, proper React keys

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
