# Auto-Prospect

An automated prospection tool for professional resellers.

## Getting Started

This project uses pnpm as the package manager.

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

This monorepo uses **separate `.env` files** for each component:

```bash
# 1. Database CLI tools (for migrations, schema generation)
cd packages/db
cp .env.example .env
# Fill in SUPABASE_DATABASE_URL

# 2. Web app (Next.js)
cd ../../apps/web
cp .env.example .env.local
# Fill in all required vars including NEXT_PUBLIC_* and SUPABASE_DATABASE_URL

# 3. Worker app (background jobs)
cd ../worker
cp .env.example .env.local
# Fill in all required vars including SUPABASE_DATABASE_URL
```

#### Why separate `.env` files?

- **packages/db/.env** - Used by CLI commands (`pnpm db:migrate`, `pnpm db:generate`)
  - These run as standalone processes and need their own database connection

- **apps/web/.env.local** - Used by Next.js app at runtime
  - Includes `NEXT_PUBLIC_*` vars for client-side access

- **apps/worker/.env.local** - Used by worker processes at runtime
  - Worker-specific configuration

**Note:** `SUPABASE_DATABASE_URL` will be duplicated across files - this is normal and expected. The CLI tools and runtime apps are separate processes.

### 3. Start Supabase Local Instance

Start the local Supabase Docker instance using dotenvx to load multiple environment files:

```bash
pnpm supabase:start
```
Do not run directly the supabase command 
```bash
supabase start
```
as it will not load the appropriate environment variables.

**Note:** The local Supabase anon key is already configured in `.env.development` and is the same for all local development instances.

### 4. Managing Local Database State

#### Stopping Supabase (with data preservation)

To preserve your local database data when stopping Supabase:

```bash
supabase stop --backup
```

This creates a backup of your local data. **Without `--backup`, all local data will be lost.**

#### Sharing Database Seed Data

If you've created test data that should be shared with the team:

```bash
pnpm db:dump
```

**⚠️ Important:** Only run this command when:
- You're confident the seed data should be shared with the entire team
- You won't override seed data from other teammates
- You've coordinated with your team to avoid conflicts

This command dumps the current database state to `supabase/seed.sql`, which can be committed to the repository.

### 5. Run the Development Server

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000) by default.

To run on a different port:

```bash
pnpm dev --port 4000
```

## Git Branching Workflow

This project follows a structured branching strategy for team collaboration.

### Branch Structure

- **`main`** - Production-ready code. All features must be merged here via Pull Request.

### Branch Naming Convention

Use the following prefixes for all feature branches:

- **`feat/`** - New features or functionality
  - Example: `feat/user-authentication`, `feat/export-reports`

- **`fix/`** - Bug fixes
  - Example: `fix/login-redirect`, `fix/email-validation`

- **`ui/`** - UI-only changes (styling, layout, components)
  - Example: `ui/dashboard-redesign`, `ui/mobile-navbar`

- **`clean/`** - Code refactoring, cleanup, simplification
  - Example: `clean/remove-unused-imports`, `clean/extract-services`

### Workflow

1. **Create your feature branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/your-feature-name
   ```

2. **Work on your changes** and commit regularly

3. **Before pushing**, rebase with `main` to stay up-to-date:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

4. **If conflicts occur during rebase**:
   - **⚠️ DO NOT resolve conflicts immediately**
   - **Coordinate with your teammates** to understand their changes
   - Discuss the conflict resolution approach before proceeding
   - This prevents accidentally overwriting someone else's work

5. **Push your branch**:
   ```bash
   git push origin feat/your-feature-name
   ```
6. **Create a Pull Request** to merge into `main`
- Never push directly to `main`
- Always rebase with `main` before pushing your branch

## MCP Servers

The following MCP servers are configured and automatically available:

- **filesystem** - File system operations
- **next-devtools** - Next.js development tools and debugging
- **supabase** - Database, storage, functions, and development tools

## Database Development Guidelines

### ⚠️ CRITICAL: Single Source of Truth - Drizzle Only

**ALL database changes MUST be made through Drizzle schema definitions and migrations. No exceptions.**

#### ❌ FORBIDDEN Actions:

1. **Never use `drizzle-kit push`** - This bypasses migrations and causes sync issues
2. **Never use `supabase db push`** - This bypasses Drizzle's migration system
3. **Never modify the database through the Supabase UI** - Changes won't be tracked in migrations
4. **Never pull schema changes** - The schema should only exist in your Drizzle files
5. **Never make manual SQL changes** outside of migrations

#### ✅ CORRECT Workflow:

1. **Modify your schema** in TypeScript files (`src/schema/*.ts`)
2. **Generate migration**: `pnpm db:generate`
3. **Review the generated SQL** in `supabase/migrations/`
4. **Apply migration**: `pnpm db:migrate-only`
5. **Commit both** schema changes and migration files to git

**Why this matters:**
- UI changes and push commands bypass migration tracking
- This causes sync issues between team members
- Migration history becomes incomplete
- Database state becomes unpredictable

**Single source of truth = Drizzle schema files + migration files**

### Creating New Tables

When creating new tables in the database, you **MUST** follow these security practices:

#### 1. Enable Row Level Security (RLS)

Every table must have RLS enabled. In your Drizzle schema, RLS is automatically enabled for tables with `pgPolicy` definitions.

#### 2. Define RLS Policies
Define appropriate RLS policies for your table operations. See `src/schema/user.ts` for an example:

#### 3. Grant Explicit Permissions
After creating a table, you **MUST** explicitly grant permissions to the appropriate roles. Modify the generated migration file (if you have not yet pushed it to the remote database) or create a new one with grants:

```sql
-- Grant table access to the exact roles you want
-- In this case below, we grant to anon (public), authenticated and service_role (admin)
grant select, insert, update, delete on table public.my_table to anon, authenticated, service_role;
```

See `supabase/migrations/0002_magenta_multiple_man.sql` for a complete example of the security model.

**Important:** Without explicit grants, users won't be able to access the table even with RLS policies in place.

### Security Model

This project uses a **zero-trust security model**:
1. All privileges are revoked by default
2. Schema usage is granted to specific roles
3. Table permissions are granted explicitly per table
4. RLS policies control row-level access

## Claude Plugins

The following Claude Code plugins are enabled:

### Automatic Plugins

- **code-simplifier** - Simplifies and refines code for clarity
  - Runs automatically on all code changes
  - No need to invoke explicitly

### Manual Plugins (Invoke Explicitly)

To use these plugins, ask Claude explicitly to use them in your request:

- **frontend-design** - Creates production-grade frontend interfaces
  - Usage: "Use /frontend-design to create a landing page"

- **feature-dev** - Guided feature development with architecture focus
  - Usage: "Use /feature-dev to implement user authentication"
