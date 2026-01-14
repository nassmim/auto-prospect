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
npx dotenvx run --env-file=.env.local --env-file=.env.development --env-file=.env.development.local -- supabase start
```

**Important:** After Supabase starts, it will display credentials including an `anon key`. Copy this key and paste it into your `.env.development` file:

```bash
# .env.development
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

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

## Claude Plugins

The following Claude Code plugins are enabled:

- **code-simplifier** - Simplifies and refines code for clarity
- **frontend-design** - Creates production-grade frontend interfaces
- **feature-dev** - Guided feature development with architecture focus
- **code-review** - Code review for pull requests
