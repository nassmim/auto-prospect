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

### 4. Run the Development Server

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

## Database Security Guidelines

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

- **code-simplifier** - Simplifies and refines code for clarity
- **frontend-design** - Creates production-grade frontend interfaces
- **feature-dev** - Guided feature development with architecture focus
