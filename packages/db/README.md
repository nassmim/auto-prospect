# @auto-prospect/db

Database package with Drizzle ORM schemas, migrations, and CLI tools.

## Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your `SUPABASE_DATABASE_URL`

## Usage

### As a library (imported by apps)

```typescript
// In apps/web or apps/worker
import { getDBAdminClient, getDBWithRLSClient } from '@auto-prospect/db';
import { accounts, hunts } from '@auto-prospect/db';

// Use the app's environment variables
const db = getDBAdminClient();
await db.query.accounts.findMany();
```

When imported as a library, the package uses the **importing app's environment variables**.

### As CLI tools (database operations)

```bash
# Run from monorepo root
pnpm db:generate   # Generate migrations from schema changes
pnpm db:migrate    # Apply pending migrations
pnpm db:reset      # Drop all tables and rerun migrations
pnpm db:seed       # Load seed data
```

When running CLI commands, the scripts use **packages/db/.env** for database connection.

## Environment Variables

**packages/db/.env** (for CLI tools only):
- `SUPABASE_DATABASE_URL` - PostgreSQL connection string

**apps/web/.env.local** and **apps/worker/.env.local**:
- Also need `SUPABASE_DATABASE_URL` for runtime database access
- This is normal duplication - CLI tools and runtime apps are separate processes

## Architecture

- `src/drizzle/` - Drizzle-specific implementation (ORM-coupled)
- `src/db.ts` - ORM-agnostic wrappers (can swap ORMs in future)
- `src/schema/` - Database schema definitions
- `scripts/` - Migration scripts
