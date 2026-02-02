# Auto-Prospect: AI Context

**Automated prospection tool for professional resellers**

## ⚠️ CRITICAL: Task Scope Discipline

**MANDATORY: Start EVERY task response with this acknowledgment:**

```
"I will focus ONLY on: [brief restatement of the exact task requested]. Nothing more."
```

**Rules:**
- Do ONLY what is explicitly requested - no extra improvements, refactoring, or "while I'm here" changes
- If the task is unclear, ask for clarification BEFORE starting
- Resist the urge to add "helpful" extras unless explicitly requested
- Complete the specific task, then stop and wait for next instruction

## ⚡ AUTO-WORK MODE: Context Management

**WHEN IN AUTO-WORK MODE ONLY:**

**MANDATORY: Start EVERY task/subtask with:**
```
"🤖 AUTO-WORK MODE: Working on [task/subtask description]"
"Context: [current]% used - will compact at 70%+"
```

**Context Window Rules:**
- **Monitor context usage at the start of each task/subtask**
- **At 70%+ context usage**: IMMEDIATELY run `/compact` before continuing
- **Never** let context exceed 80% without compacting
- **Always** compact between major task transitions
- This applies ONLY in auto-work mode, not regular interactive sessions

**Output Optimization (AUTO-WORK MODE ONLY):**
- **DO NOT** announce what you will do or describe your plan before executing
- **DO NOT** output verbose logs of tool calls or changes made
- **Execute silently**: Run tools, make changes, update task status without commentary
- **Only output**: Critical errors, questions requiring user input, or task completion confirmations
- **Purpose**: Minimize context window usage and maximize efficiency in automated workflows

## Tech Stack
- **Next.js 16.1.1** (App Router) + React 19 + TypeScript
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **Auth**: Supabase Auth (JWT, RLS)
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Forms**: react-hook-form + Zod validation
- **Data Fetching**: SWR (client-side) + TanStack Query (complex client state)
- **Env**: dotenvx (multi-file), **pnpm** (not npm)

## UI/UX Principles

### Component Library
- **shadcn/ui**: Use shadcn components for all UI elements
- Components located in `src/components/ui/`
- Follow shadcn styling patterns and conventions
- Maintain consistent design system across the app

### Form Validation (MANDATORY)
- **ALWAYS use react-hook-form + Zod** for ALL forms
- **Client-side validation**: Zod schema with react-hook-form
- **Server-side validation**: Reuse same Zod schema in server actions
- Never skip validation on either side
- Pattern:
  ```typescript
  // schemas/validation.ts
  export const huntFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    // ...
  });

  // Component
  const form = useForm<z.infer<typeof huntFormSchema>>({
    resolver: zodResolver(huntFormSchema),
  });

  // Server action
  export async function createHunt(data: unknown) {
    const validated = huntFormSchema.parse(data); // Throws if invalid
    // ...
  }
  ```

## Critical Paths
```
src/app/              → Next.js pages (App Router)
src/lib/drizzle/      → DB client + RLS wrapper
src/lib/supabase/     → Auth clients (browser/server)
src/schema/           → Drizzle schemas (source of truth)
supabase/migrations/  → Generated SQL (never edit manually)
src/proxy.ts          → Auth middleware
```

## Data Architecture and Definition

### Schema definition
Always prefer drizzle-first built-in features when possible.
For instance use:
```typescript
// Not good
id: uuid()
  .primaryKey()
  .default(sql`gen_random_uuid()`)

foreignKey({
  columns: [table.typeId],
  foreignColumns: [adTypes.id],
  // But if you did need another name than the one automatically generated, then 
  // it would make sense adopting this method to write the FK
  name: "table_type_id_ad_types_id_fk", 
}).onDelete("cascade")

// Good
id: uuid()
  .primaryKey()
  .defaultRandom()
    
typeId: smallint("type_id")
  .references(() => adTypes.id)
  .notNull()
```

## Database: Zero-Trust Security Model

### RLS Architecture
- **All tables MUST have RLS enabled** (automatic with `pgPolicy`)
- JWT decoded → `auth.uid()` / `auth.jwt()` injected into Postgres session
- Client wrapper: `src/lib/drizzle/rls/client-wrapper.ts`
- Two modes: `admin` (bypasses RLS), `client` (enforces RLS)
- **Auth always server-side**: Never handle auth or sensitive data on client

### Database Drizzle Access

**Choose the right pattern based on your use case:**

#### Pattern 1: Dynamic (Both Admin and RLS Needed)
Use when a function needs to run in **both** contexts (e.g., server action callable by users OR cron jobs).

```typescript
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";

async function getContactedAds(accountId: string, bypassRLS: boolean = false) {
  const dbClient = await createDrizzleSupabaseClient();

  // Define query once, reuse for both modes
  const query = (tx: TDBQuery) =>
    tx.query.contactedAds.findMany({
      where: (table, { eq }) => eq(table.accountId, accountId),
      columns: { adId: true },
    });

  if (bypassRLS) return query(dbClient.admin); // Admin mode (bypasses RLS)
  return dbClient.rls(query); // User mode (enforces RLS)
}
```

**When to use:** Mixed-context functions (user-facing actions that admins/cron jobs may also call).

---

#### Pattern 2: Admin Only (Bypass RLS)
Use when the function **always** runs with admin privileges (e.g., cron jobs, system tasks, migrations).

```typescript
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";

async function cronCleanupOldAds() {
  const dbClient = await createDrizzleSupabaseClient();

  // Direct admin access - no RLS wrapper needed
  return dbClient.admin.query.contactedAds.findMany({
    where: (table, { lt }) => lt(table.createdAt, new Date('2024-01-01')),
  });
}
```

**When to use:** Background jobs, system operations, data migrations, admin scripts.

---

#### Pattern 3: RLS Only (User Context)
Use when the function **always** runs in user context (e.g., user-triggered server actions, API routes).

```typescript
import { createDrizzleSupabaseClient } from "@/lib/drizzle/dbClient";

async function getUserContactedAds(accountId: string) {
  const dbClient = await createDrizzleSupabaseClient();

  // RLS enforced - user can only access their own data
  return dbClient.rls((tx: TDBQuery) =>
    tx.query.contactedAds.findMany({
      where: (table, { eq }) => eq(table.accountId, accountId),
      columns: { adId: true },
    })
  );
}
```

**When to use:** Server actions, API routes, any user-triggered database operations.

### Migration Workflow (STRICT)

#### Development Phase (Pre-Production)
**Current Status:** Migrations not yet applied to production database.

```bash
1. Modify schema:     src/schema/*.ts
2. Generate:          pnpm db:generate
3. Review SQL:        supabase/migrations/*.sql
4. Commit:            schema + migration files
```

**❌ AI FORBIDDEN:**
- `pnpm db:migrate-only` / `pnpm db:migrate` (apply migrations)
- `pnpm db:dump` (dump seed data)
- `drizzle-kit push` or `supabase db push`
- `supabase stop`or `supabase stop --backup`
- UI changes on Supabase dashboard
- Manual SQL outside migrations

**⚠️ INTERACTIVE MIGRATION GENERATION:**
If `pnpm db:generate` requires user interaction (e.g., choosing between "create column" vs "rename column"), **STOP immediately** and inform the user:
- Do NOT attempt to provide input programmatically
- Tell the user to run `pnpm db:generate` manually and select the appropriate option
- Document what option should be selected based on the schema changes

**🚨 CRITICAL: Never Mix Drizzle-Generated SQL with Custom SQL**

**The Rule:** Keep Drizzle-generated SQL and custom SQL (triggers, grants, functions) in **separate migration files**.

**Why:** When preparing for production or cleaning up migrations, you need to clearly distinguish:
- What Drizzle auto-generates (schema structure, RLS policies, indexes, FKs)
- What you manually added (triggers, grants, custom functions)

**Workflow for new tables:**
```bash
# Step 1: Schema changes → Drizzle migration (auto-generated SQL only)
1. Modify schema: src/schema/*.ts
2. Generate: pnpm db:generate
3. Review: supabase/migrations/0005_some_name.sql (contains CREATE TABLE, RLS policy, etc.)

# Step 2: Custom SQL → Separate custom migration
4. Generate custom file: pnpm db:generate --custom
5. Add grants/triggers: supabase/migrations/0006_custom_name.sql
6. Add clear comment linking to the related Drizzle migration

# Example:
# 0005_living_ultimo.sql (Drizzle-generated)
CREATE TABLE "hunt_channel_credits" (...);
ALTER TABLE "hunt_channel_credits" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enable all for hunt owners" ON "hunt_channel_credits" ...;

# 0006_custom_grants_hunt.sql (Custom)
-- Custom migration: Grants for hunt_channel_credits table
-- Related to Drizzle migration: 0005_living_ultimo.sql
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."hunt_channel_credits" TO "authenticated", "service_role";
```

**Benefits:**
- Easy to identify which migrations to keep/delete when consolidating for production
- Clear separation of concerns
- Custom migrations have descriptive comments linking to their related tables
- If you delete a Drizzle migration, you know which custom migration to delete too

### New Table Checklist

**CRITICAL: Every new table MUST have explicit grants, even if RLS is enabled!**

1. ✅ Define RLS policies in schema (see `src/schema/user.ts`)
2. ✅ Run `pnpm db:generate` to create Drizzle migration
3. ✅ Run `pnpm db:generate --custom` to create separate custom migration
4. ✅ **Add explicit grants in the CUSTOM migration file**:
   ```sql
   -- Custom migration: Grants for my_table
   -- Related to Drizzle migration: 0XXX_migration_name.sql
   grant select, insert, update, delete on table public.my_table to authenticated, service_role;
   ```
   **Why:** Supabase requires explicit grants even with RLS enabled. Without grants, users cannot access the table even if RLS policies allow it.

## GIT Setup
When committing, be concise in the description. No need to indicate who is the 
co-author like "Co-Authored-By:"

## Key Patterns

### Route Configuration
- **All routes MUST use `src/config/routes.ts`** — never hardcode route strings
- Import: `import { pages } from '@/config/routes'`
- Static routes: `pages.dashboard`, `pages.settings`, `pages.hunts.list`
- Dynamic routes: `pages.hunts.detail(huntId)`, `pages.leads.detail(leadId)`
- revalidatePath: `revalidatePath(pages.hunts.list)`, `revalidatePath(pages.leads.detail(id))`
- When adding a new page/route, add it to `routes.ts` first
- External URLs (e.g., Chrome Web Store, ad URLs) are exempt

### Auth Flow
1. Supabase Auth → JWT token
2. Middleware (`src/proxy.ts`) → session cookies
3. Server components → `createClient()` (server.ts)
4. Browser → `createClient()` (client.ts)
5. DB queries → RLS wrapper injects JWT → policies evaluate

## MCP Servers
- `filesystem` → File operations
- `next-devtools` → Next.js debugging
- `supabase` → DB, storage, functions

## Code Standards

### Architecture
- **Server Components by default**: Use `'use client'` only for: events, browser APIs, state, client libraries
- **Page vs Component separation**: Keep `page.tsx` thin — only handle data fetching, routing, and server-side concerns. Move all UI logic, layouts, and presentation into separate components. Components should be routing-agnostic but rich in presentation logic.
  ```typescript
  // page.tsx - Thin, server-focused
  export default async function HuntsPage() {
    const hunts = await fetchHunts(); // Data fetching
    return <HuntsView hunts={hunts} />; // Compose components
  }

  // hunts-view.tsx - Rich UI logic
  export function HuntsView({ hunts }: { hunts: Hunt[] }) {
    // All UI state, handlers, rendering logic here
  }
  ```

#### Data Fetching Strategy

**Server-Side by Default**: Prefer server components for data fetching (better performance, SEO, security).

**Client-Side When Needed**: Use client-side data fetching when:
1. **Avoiding prop drilling**: Data needed by multiple nested client components (passing through many layers would be cumbersome)
2. **Frequently updating data**: Content updates regularly at runtime (real-time feeds, live status, polling)
3. **User-specific interactions**: Data depends on client-side state/actions (filtering, sorting without page reload)
4. **No SEO required**: Page doesn't need search engine indexing

**Client-Side Fetching Libraries:**
- **SWR (Recommended)**: For most client-side data fetching needs. Provides automatic caching, revalidation, focus tracking, interval refetching, optimistic updates.
- **TanStack Query**: For complex client state management needs (dependent queries, infinite queries, parallel queries, complex cache invalidation)

**Decision Matrix:**
```
Server-side (Server Components/Actions):
  ✓ Initial page load data
  ✓ SEO-critical content
  ✓ Static or infrequently changing data
  ✓ Data requiring authentication (RLS)
  ✓ Large datasets (better performance)

Client-side (SWR/TanStack Query):
  ✓ Real-time/frequently updating data
  ✓ Data needed by multiple nested client components
  ✓ User-specific filters/sorts without page reload
  ✓ Polling/interval refetching
  ✗ Worse initial page load performance
  ✗ No SEO benefits
```

#### Server Actions vs Services Pattern

**CRITICAL: Understand when to use server actions vs services**

**Server Actions (`src/actions/*.actions.ts`):**
- **MUST use** when the function is invoked directly from client-side code
- Always marked with `"use server"` directive
- Invoked from client components via form actions or event handlers
- Examples: Form submissions, button click handlers, mutations triggered by user interactions

**Services (`src/services/*.service.ts`):**
- **Use for** reusable server-side logic that is NOT directly invoked from client
- Called by server actions, API routes, server components, or other services
- Can use Drizzle, external APIs, or any server-side libraries
- Examples: Business logic, data transformations, external API integrations
- No `"use server"` directive needed

**Decision Tree:**
1. **Is the function called directly from client-side code?**
   - YES → Server Action (`src/actions/`)
   - NO → Continue to step 2

2. **Is it reusable logic used by multiple server actions or server components?**
   - YES → Service (`src/services/`)
   - NO → Continue to step 3

3. **Does it need to expose an endpoint for external services/webhooks?**
   - YES → API Route (`src/app/api/`)
   - NO → Default to Service

**Key Points:**
- Drizzle can be used in BOTH server actions AND services (server-side only)
- Server actions are just a special type of server function with RPC capabilities
- Services are for abstracting reusable business logic away from server actions
- Utils (`src/utils/`) are for client-side or isomorphic logic only

**Preference order**: Services → Server Actions → API Routes (last resort)

### Code Style
- **Functional over classes**: Prefer functions, avoid OOP patterns
- **Named exports**: Always use named exports (not default)
- **Descriptive names**: `isLoading`, `hasError`, `handleClick` patterns
- **Early returns**: Handle errors/edge cases at function start
- **Comment complex logic**: Explain non-obvious business rules and edge cases (present tense, no history)
- **TypeScript strict**: No `any`, prefer type inference, interfaces over types

### Comments & Insights (Explanatory Output Style)
- **Only comment non-obvious logic**: Skip comments for self-explanatory code (e.g., `users.map(user => user.id)`)
- **Insight triggers**: Complex algorithms, non-standard patterns, business rules, security considerations, performance trade-offs
- **Skip insights for**: Standard operations (map/filter/reduce), CRUD operations, simple conditionals, obvious type definitions

### Naming Conventions
- **PascalCase**: Components, Types, Interfaces
- **kebab-case**: Files (`user-profile.tsx`), directories (`auth-wizard/`)
- **camelCase**: Variables, functions, hooks, props
- **UPPERCASE**: Env vars, constants

### Performance
- **Avoid unnecessary state**: Prefer derived state, URL params, SSR caching
- **Dynamic imports**: Code splitting for non-critical components
- **Proper keys**: Never use array index as key

### Security & Validation
- **Always validate**: Both client + server (use Zod when available)
- **Security over UX**: Prioritize security in all decisions
- **Input sanitization**: Prevent XSS, follow provider security guidelines

## Project Principles
1. **Single source of truth**: Drizzle schema + migrations (never UI/manual SQL)
2. **Zero-trust security**: RLS on every table, explicit grants, JWT-based auth
3. **Type safety**: Full TypeScript, Drizzle type-safe queries
4. **Team sync**: Migrations in git, seed data exportable
5. **Environment separation**: Dev/prod configs isolated with dotenvx

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
