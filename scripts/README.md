# Scripts

Utility scripts for Auto-Prospect development and administration.

## User Management

### create-user.ts

Programmatically create users with their personal organizations.

#### Prerequisites

Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in your `.env.development.local` file. You can find this key in your Supabase project settings under API → service_role key.

```bash
# Add to .env.development.local
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

#### Usage

```bash
# Using the npm script (recommended)
pnpm create-user --email="user@example.com" --password="securepass123" 

# Don't auto-confirm email (user will need to verify)
pnpm create-user \
  --email="user@example.com" \
  --password="securepass123" \
  --no-confirm

# Direct execution
pnpm tsx scripts/create-user.ts --email="user@example.com" --password="securepass123" 
```

#### Options

- `--email` (required): User's email address
- `--password` (required): User's password (min 6 characters by Supabase default)
- `--no-confirm` (optional): Don't auto-confirm email (requires email verification)

#### What it does

1. Creates a user in Supabase Auth (`auth.users`)
2. Auto-confirms email (unless `--no-confirm` is used)

#### Output

```
✅ User created successfully!

User Details:
  Auth User ID:        8f3e4d2c-1a2b-4c5d-8e9f-1234567890ab
  Personal Org ID:     org_abc123xyz456
  Email:               user@example.com
  Email Confirmed:     Yes

✨ Done!
```
