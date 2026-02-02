# Task ID: 1

**Title:** Create account and Team Schema with RLS

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Define Drizzle schemas for accounts, memberships, and team roles to support multi-tenant team management. This builds on the existing accounts table by adding account-level grouping.

**Details:**

Create schemas in `src/schema/account.schema.ts`:

1. **accounts table:**
   - `id`: uuid, primary key, default random
   - `name`: varchar(255), required
   - `ownerId`: uuid, FK to accounts.id, on delete cascade
   - `settings`: jsonb (store toggles: allowReassignment, restrictVisibility, dailyReset, ignorePhonesVisible)
   - `createdAt`: timestamp, default now
   - RLS policies: owner can update/delete, members can read

2. **team_members table:**
   - `id`: uuid, primary key
   - `accountId`: uuid, FK to accounts.id
   - `accountId`: uuid, FK to accounts.id
   - `role`: varchar enum ('owner', 'admin', 'user')
   - `invitedAt`: timestamp
   - `joinedAt`: timestamp nullable
   - Unique constraint on (accountId, accountId)
   - RLS: org members can read, owner/admin can write

3. **account_invitations table:**
   - `id`: uuid, primary key
   - `accountId`: uuid, FK
   - `email`: varchar(320)
   - `role`: varchar
   - `token`: varchar(64) unique
   - `expiresAt`: timestamp
   - RLS: org admins can manage

Remember to add explicit grants in migration SQL for authenticated and service_role as per project patterns in 0002_magenta_multiple_man.sql.

**Test Strategy:**

1. Generate migration with `pnpm db:generate` and verify SQL output contains RLS policies and grants. 2. After migration applied (by human), write integration tests that verify: owner can CRUD account, member can only read, non-member cannot access. 3. Test invitation flow creates valid token.
