# Auto-Prospect

An automated prospection tool for professional resellers.

## Getting Started

This project uses pnpm as the package manager.

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

This project uses multiple environment files to separate secrets and public variables across different environments. You'll need to create 5 environment files:

#### Create the environment files:

```bash
# 1. Shared secrets (both dev and prod)
cp .env.example .env.local

# 2. Development-specific files
cp .env.node_env.example .env.development
cp .env.node_env.example .env.development.local

# 3. Production-specific files
cp .env.node_env.example .env.production
cp .env.node_env.example .env.production.local
```

#### Environment files structure:

- **`.env.local`** - Shared secrets for both development and production
- **`.env.development`** - Public development variables (can be committed)
- **`.env.development.local`** - Secret development variables (gitignored)
- **`.env.production`** - Public production variables (can be committed)
- **`.env.production.local`** - Secret production variables (gitignored)

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
