# Auto-Prospect: AI Context

**Automated prospection tool for professional resellers**

## Tech Stack
- **Next.js 16.1.1** (App Router) + React 19 + TypeScript
- **Database**: Supabase (PostgreSQL) + Drizzle ORM
- **Auth**: Supabase Auth (JWT, RLS)
- **Styling**: Tailwind CSS 4
- **Env**: dotenvx (multi-file), **pnpm** (not npm)

## Critical Paths
```
src/app/              → Next.js pages (App Router)
src/lib/drizzle/      → DB client + RLS wrapper
src/lib/supabase/     → Auth clients (browser/server)
src/schema/           → Drizzle schemas (source of truth)
supabase/migrations/  → Generated SQL (never edit manually)
src/proxy.ts          → Auth middleware
```

## Database: Zero-Trust Security Model

### RLS Architecture
- **All tables MUST have RLS enabled** (automatic with `pgPolicy`)
- JWT decoded → `auth.uid()` / `auth.jwt()` injected into Postgres session
- Client wrapper: `src/lib/drizzle/rls/client-wrapper.ts`
- Two modes: `admin` (bypasses RLS), `client` (enforces RLS)
- **Auth always server-side**: Never handle auth or sensitive data on client

### Migration Workflow (STRICT)
```bash
1. Modify schema:     src/schema/*.ts
2. Generate:          pnpm db:generate
3. Review SQL:        supabase/migrations/*.sql
4. Apply:             pnpm db:migrate-only (human only)
5. Commit:            schema + migration files
```

**❌ AI FORBIDDEN:**
- `pnpm db:migrate-only` / `pnpm db:migrate` (apply migrations)
- `pnpm db:dump` (dump seed data)
- `drizzle-kit push` or `supabase db push`
- UI changes (Supabase dashboard)
- Manual SQL outside migrations

### New Table Checklist
1. ✅ Define RLS policies in schema (see `src/schema/user.ts`)
2. ✅ Add explicit grants in migration:
   ```sql
   grant select, insert, update, delete on table public.my_table
   to anon, authenticated, service_role;
   ```
3. ✅ Foreign keys to `auth.users` on cascade delete (if user-owned)

## Environment Setup
- **5 files**: `.env.local`, `.env.development`, `.env.development.local`, `.env.production`, `.env.production.local`
- Local dev: `pnpm supabase:start` (uses dotenvx to load all files)
- Dev server: `pnpm dev` (port 3000 default)

## Key Patterns

### Auth Flow
1. Supabase Auth → JWT token
2. Middleware (`src/proxy.ts`) → session cookies
3. Server components → `createClient()` (server.ts)
4. Browser → `createClient()` (client.ts)
5. DB queries → RLS wrapper injects JWT → policies evaluate

### Database Access

**Direct queries:**
```typescript
// With RLS (user context)
import { db } from '@/lib/drizzle/dbClient'
const data = await db.select().from(accounts)

// Without RLS (admin)
import { adminDb } from '@/lib/drizzle/dbClient'
const data = await adminDb.select().from(accounts)
```

## MCP Servers
- `filesystem` → File operations
- `next-devtools` → Next.js debugging
- `supabase` → DB, storage, functions

## Development Commands
```bash
# AI can run:
pnpm dev               # Dev server (auto-loads .env.development*)
pnpm supabase:start    # Start local DB (with dotenvx)
pnpm db:generate       # Generate migration from schema

# AI forbidden (human only):
pnpm db:migrate        # Generate + apply migration
pnpm db:migrate-only   # Apply migration only
pnpm db:dump           # Export seed data
supabase stop --backup # Stop DB (preserve data)
```

## Code Standards

### Architecture
- **Server Components by default**: Use `'use client'` only for: events, browser APIs, state, client libraries
- **Services pattern**: `/src/services/` for reusable logic using external tools or running on server but that don't necessarily need to be server actions
- **Utils pattern**: `/src/utils/` for reusable logic that run client side
- **Preference order**: Services → Server Actions → API Routes (last resort)

### Code Style
- **Functional over classes**: Prefer functions, avoid OOP patterns
- **Named exports**: Always use named exports (not default)
- **Descriptive names**: `isLoading`, `hasError`, `handleClick` patterns
- **Early returns**: Handle errors/edge cases at function start
- **Comment complex logic**: Explain non-obvious business rules and edge cases (present tense, no history)
- **TypeScript strict**: No `any`, prefer type inference, interfaces over types

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
