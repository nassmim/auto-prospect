# Task ID: 32

**Title:** Review and Fix Drizzle Schema Anti-Patterns

**Status:** done

**Dependencies:** 2 ✓, 3 ✓, 4 ✓, 5 ✓, 6 ✓

**Priority:** medium

**Description:** Refactor all Drizzle schema files to follow Drizzle-first best practices by removing redundant notNull() on primary keys, using defaultRandom() instead of manual UUID generation, converting inline foreignKey() to .references() where appropriate, replacing hardcoded array constants with pgEnum, creating a credit_packs database table, and enhancing the signup trigger to initialize account member and credit balances.

**Details:**

## Implementation Details

### Issue 1: Remove Redundant .notNull() on Primary Keys (5 files)

Primary keys cannot be null by definition. Remove redundant `.notNull()` calls:

**ad.schema.ts (line 31):**
```typescript
// Before
id: uuid().defaultRandom().primaryKey().notNull(),
// After
id: uuid().defaultRandom().primaryKey(),
```

**credits.schema.ts (lines 73-75, 124):**
```typescript
// Before
id: uuid()
  .primaryKey()
  .notNull()
  .default(sql`gen_random_uuid()`),
// After (also fixes Issue 2)
id: uuid().defaultRandom().primaryKey(),
```

**lead.schema.ts (lines 34-36):**
```typescript
// Before
id: uuid()
  .primaryKey()
  .notNull()
  .default(sql`gen_random_uuid()`),
// After
id: uuid().defaultRandom().primaryKey(),
```

**message.schema.ts (lines 84-86, 175-177):**
Apply same pattern to `messages` and `leadActivities` tables.

**message-template.schema.ts (lines 33-35):**
Apply same pattern to `messageTemplates` table.

---

### Issue 2: Replace Manual UUID Generation with .defaultRandom() (5 files)

Replace all `sql\`gen_random_uuid()\`` with `.defaultRandom()`:

**Affected files:** credits.schema.ts, lead.schema.ts, message.schema.ts, message-template.schema.ts

The correct pattern (already used in hunt.schema.ts line 43):
```typescript
id: uuid().defaultRandom().primaryKey(),
```

---

### Issue 3: Replace Inline foreignKey() with .references() (3 files)

Convert verbose `foreignKey()` declarations to cleaner `.references()` syntax where the auto-generated constraint name is acceptable.

**credits.schema.ts (lines 85-89, 140-144):**
```typescript
// Before
accountId: uuid("account_id").notNull().unique(),
// ...in constraints array:
foreignKey({
  columns: [table.accountId],
  foreignColumns: [accounts.id],
  name: "credit_balances_account_id_fk",
}).onDelete("cascade"),

// After
accountId: uuid("account_id")
  .references(() => accounts.id, { onDelete: "cascade" })
  .notNull()
  .unique(),
// Remove from constraints array
```

**lead.schema.ts (lines 53-72):**
Convert all four foreignKey() declarations:
```typescript
// Before (in column definition)
accountId: uuid("account_id").notNull(),
huntId: uuid("hunt_id").notNull(),
adId: uuid("ad_id").notNull(),
assignedToId: uuid("assigned_to_id"),

// After
accountId: uuid("account_id")
  .references(() => accounts.id, { onDelete: "cascade" })
  .notNull(),
huntId: uuid("hunt_id")
  .references(() => hunts.id, { onDelete: "cascade" })
  .notNull(),
adId: uuid("ad_id")
  .references(() => ads.id, { onDelete: "cascade" })
  .notNull(),
assignedToId: uuid("assigned_to_id")
  .references(() => teamMembers.id, { onDelete: "set null" }),
```

**Note:** Keep `foreignKey()` syntax for junction tables like `subTypesHunts` and `brandsHunts` in hunt.schema.ts where custom FK naming prevents conflicts with duplicate FK names.

---

### Issue 4: Replace Hardcoded Array Constants with pgEnum (4 files)

Create new enums in `src/constants/enums.ts` following the `EHuntStatus` pattern:

```typescript
// Add to src/constants/enums.ts
export enum EMessageChannel {
  WHATSAPP = "whatsapp",
  PHONE = "phone",
}

export enum ECreditType {
  SMS = "sms",
  RINGLESS_VOICE = "ringlessVoice",
  WHATSAPP_TEXT = "whatsappText",
}

export enum ETransactionType {
  PURCHASE = "purchase",
  USAGE = "usage",
  REFUND = "refund",
  ADJUSTMENT = "adjustment",
}

export enum ELeadStage {
  NOUVEAU = "nouveau",
  CONTACTE = "contacte",
  RELANCE = "relance",
  GAGNE = "gagne",
  PERDU = "perdu",
}

export enum EMessageStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  READ = "read",
  REPLIED = "replied",
}

export enum ELeadActivityType {
  STAGE_CHANGE = "stage_change",
  MESSAGE_SENT = "message_sent",
  ASSIGNMENT_CHANGE = "assignment_change",
  NOTE_ADDED = "note_added",
  REMINDER_SET = "reminder_set",
  CREATED = "created",
}
```

Then update schema files to use pgEnum:

**credits.schema.ts:**
```typescript
import { ETransactionType, ECreditType } from "@/constants/enums";

export const transactionType = pgEnum(
  "transaction_type",
  Object.values(ETransactionType) as [string, ...string[]],
);

export const creditType = pgEnum(
  "credit_type",
  Object.values(ECreditType) as [string, ...string[]],
);

// Use in table:
type: transactionType().notNull(),
creditType: creditType().notNull(),
```

**lead.schema.ts:**
```typescript
import { ELeadStage } from "@/constants/enums";

export const leadStage = pgEnum(
  "lead_stage",
  Object.values(ELeadStage) as [string, ...string[]],
);

// Use in table:
stage: leadStage().notNull().default(ELeadStage.NOUVEAU),
```

**message.schema.ts:**
```typescript
import { EMessageChannel, EMessageStatus, ELeadActivityType } from "@/constants/enums";

export const messageChannel = pgEnum(
  "message_channel",
  Object.values(EMessageChannel) as [string, ...string[]],
);

export const messageStatus = pgEnum(
  "message_status",
  Object.values(EMessageStatus) as [string, ...string[]],
);

export const leadActivityType = pgEnum(
  "lead_activity_type",
  Object.values(ELeadActivityType) as [string, ...string[]],
);
```

---

### Issue 5: Create credit_packs Schema Table

Create a new table to store pricing configuration instead of hardcoded constants:

**Add to credits.schema.ts:**
```typescript
export const creditPacks = pgTable(
  "credit_packs",
  {
    id: uuid().defaultRandom().primaryKey(),
    creditType: creditType().notNull(),
    credits: integer().notNull(),
    priceEur: integer("price_eur").notNull(), // Store in cents for precision
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("credit_packs_credit_type_idx").on(table.creditType),
    pgPolicy("enable read for authenticated users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);
export type TCreditPack = InferSelectModel<typeof creditPacks>;
```

**Create seed migration to populate default packs:**
```sql
-- Insert SMS packs (prices in cents)
INSERT INTO credit_packs (credit_type, credits, price_eur, is_active) VALUES
  ('sms', 100, 1500, true),
  ('sms', 500, 7000, true),
  ('sms', 1000, 10000, true),
  ('sms', 5000, 40000, true);

-- Insert Voice packs
INSERT INTO credit_packs (credit_type, credits, price_eur, is_active) VALUES
  ('ringlessVoice', 100, 4000, true),
  ('ringlessVoice', 500, 17500, true),
  ('ringlessVoice', 1000, 30000, true),
  ('ringlessVoice', 5000, 125000, true);
```

Remove `SMS_PACKS` and `VOICE_PACKS` constants after migration.

---

### Issue 6: Enhance Signup Trigger

Update `supabase/migrations/0002_nervous_stick.sql` trigger function:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_account()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  user_email text;
  new_org_id uuid;
begin
  user_email := new.email;

  -- Create personal account (1:1 with auth.users)
  INSERT INTO public.accounts (
    auth_user_id,
    email
  )
  VALUES (
    new.id,
    user_email
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    email = excluded.email
  RETURNING id INTO new_org_id;

  -- Initialize credit balances for the account (all channels start at 0)
  INSERT INTO public.credit_balances (
    account_id,
    sms,
    ringless_voice,
    whatsapp
  )
  VALUES (
    new_org_id,
    0,
    0,
    0
  )
  ON CONFLICT (account_id) DO NOTHING;

  RETURN new;
END;
$function$;
```

**Note:** account member records are not needed for personal accounts since the owner is identified by `accounts.auth_user_id`. Team member records would be created when inviting users to team accounts.

---

### Migration Strategy

Since migrations haven't been applied to production:
1. Make all schema changes in TypeScript files
2. Run `pnpm db:generate` to create migration
3. Review generated SQL carefully
4. If interactive prompts appear during generation, inform user to run manually
5. Commit both schema changes and migration files

**Test Strategy:**

### Testing Strategy

1. **Schema Compilation Test:**
   - Run `pnpm build` to verify TypeScript compiles without errors
   - Run `pnpm db:generate` and verify migration generates successfully

2. **Primary Key Validation:**
   - Verify generated migration does NOT include redundant `NOT NULL` constraints for primary key columns
   - Confirm all tables still have valid primary keys

3. **UUID Generation Test:**
   - Insert records without providing UUID
   - Verify UUID is automatically generated using `.defaultRandom()`

4. **Foreign Key Migration Test:**
   - Verify migration generates correct foreign key constraints
   - Test cascade delete behavior:
     - Delete account → verify leads, credit_balances, credit_transactions cascade
     - Delete hunt → verify leads cascade
     - Delete lead → verify messages, lead_activities cascade

5. **pgEnum Validation:**
   - Verify new enum types are created in migration
   - Test inserting valid enum values succeeds
   - Test inserting invalid enum values fails with constraint error

6. **credit_packs Table Test:**
   - Verify table is created with correct schema
   - Insert test packs and verify queries work
   - Test RLS allows authenticated users to read

7. **Signup Trigger Test:**
   - Create new auth user (via Supabase dashboard or test script)
   - Verify account is created
   - Verify credit_balances row is created with all zeros

8. **Regression Testing:**
   - Run existing application flows (create hunt, create lead, etc.)
   - Verify no functionality is broken by schema changes
   - Run `pnpm lint` to ensure code style compliance

9. **Type Safety Verification:**
   - Verify exported types (`TLeadInsert`, `TCreditBalance`, etc.) still work
   - Verify enum types are properly inferred in TypeScript

## Subtasks

### 32.1. Fix Primary Key and UUID Generation Anti-Patterns

**Status:** done  
**Dependencies:** None  

Remove redundant .notNull() on primary keys and replace manual sql`gen_random_uuid()` with .defaultRandom() across all schema files.

**Details:**

Update the following files to use the correct Drizzle pattern `id: uuid().defaultRandom().primaryKey()`:

1. **ad.schema.ts (line 31):** Remove `.notNull()` from `id: uuid().defaultRandom().primaryKey().notNull()`

2. **credits.schema.ts (lines 72-75, 122-125):** Change both `creditBalances` and `creditTransactions` tables from:
```typescript
id: uuid().primaryKey().notNull().default(sql`gen_random_uuid()`)
```
to:
```typescript
id: uuid().defaultRandom().primaryKey()
```

3. **lead.schema.ts (lines 33-36):** Same pattern for `leads` table

4. **message.schema.ts (lines 83-86, 174-177):** Same pattern for `messages` and `leadActivities` tables

5. **message-template.schema.ts (lines 32-35):** Same pattern for `messageTemplates` table

This change simplifies the code and follows Drizzle-first best practices. Primary keys are implicitly NOT NULL by database definition.

### 32.2. Convert foreignKey() to .references() in credits.schema.ts and lead.schema.ts

**Status:** done  
**Dependencies:** 32.1  

Replace verbose inline foreignKey() declarations with cleaner .references() syntax where the auto-generated constraint name is acceptable.

**Details:**

**credits.schema.ts changes:**

1. `creditBalances.accountId` (line 76): Change from:
```typescript
accountId: uuid("account_id").notNull().unique(),
// ...in constraints:
foreignKey({ columns: [table.accountId], foreignColumns: [accounts.id], name: "..." }).onDelete("cascade")
```
to:
```typescript
accountId: uuid("account_id")
  .references(() => accounts.id, { onDelete: "cascade" })
  .notNull()
  .unique(),
```

2. `creditTransactions.accountId` (line 126): Same pattern

**lead.schema.ts changes:**

Convert all four foreignKey() declarations (lines 53-72) to inline .references():
- `accountId` -> `.references(() => accounts.id, { onDelete: "cascade" })`
- `huntId` -> `.references(() => hunts.id, { onDelete: "cascade" })`
- `adId` -> `.references(() => ads.id, { onDelete: "cascade" })`
- `assignedToId` -> `.references(() => teamMembers.id, { onDelete: "set null" })`

Remove the corresponding foreignKey() entries from the constraints array.

**NOTE:** Keep foreignKey() syntax for junction tables in hunt.schema.ts (subTypesHunts, brandsHunts) where custom FK naming prevents constraint name conflicts.
<info added on 2026-01-24T12:54:45.232Z>
I will focus ONLY on: Analyzing the schema files to verify whether foreignKey() to .references() conversion is safe for credits.schema.ts and lead.schema.ts, and updating the subtask details with clarification criteria.

Let me first analyze the current schema files to understand the constraint names and determine if conversion is safe.Now let me analyze the auto-generated constraint names that Drizzle would create vs. the custom names currently in use:

`★ Insight ─────────────────────────────────────`
**Drizzle FK Naming Convention**: When using `.references()`, Drizzle auto-generates constraint names using the pattern `{table}_{column}_{foreignTable}_{foreignColumn}_fk`. PostgreSQL has a 63-character limit for identifiers. Exceeding this causes silent truncation which can lead to naming conflicts.
`─────────────────────────────────────────────────`

Let me calculate the auto-generated constraint name lengths:

**credits.schema.ts:**
- `credit_balances.accountId` → auto: `credit_balances_account_id_accounts_id_fk` = 52 chars ✅
- `credit_transactions.accountId` → auto: `credit_transactions_account_id_accounts_id_fk` = 56 chars ✅

**lead.schema.ts:**
- `leads.accountId` → auto: `leads_account_id_accounts_id_fk` = 42 chars ✅
- `leads.huntId` → auto: `leads_hunt_id_hunts_id_fk` = 25 chars ✅
- `leads.adId` → auto: `leads_ad_id_ads_id_fk` = 21 chars ✅
- `leads.assignedToId` → auto: `leads_assigned_to_id_account_members_id_fk` = 48 chars ✅

All auto-generated names are well under 63 characters and there are no duplicate FK targets within the same table (each FK references a different table).

CONVERSION DECISION CRITERIA CLARIFICATION

After analyzing both schema files, all foreign keys in credits.schema.ts and lead.schema.ts are SAFE to convert to .references() syntax because:

1. All auto-generated constraint names are under PostgreSQL's 63-character limit:
   - credit_balances_account_id_accounts_id_fk (52 chars)
   - credit_transactions_account_id_accounts_id_fk (56 chars)
   - leads_account_id_accounts_id_fk (42 chars)
   - leads_hunt_id_hunts_id_fk (25 chars)
   - leads_ad_id_ads_id_fk (21 chars)
   - leads_assigned_to_id_account_members_id_fk (48 chars)

2. No naming conflicts exist: Each table has at most one FK per referenced table, so no duplicate constraint names would be generated.

3. These are NOT junction tables: Unlike subTypesHunts/brandsHunts which have multiple FKs to the same conceptual entity pattern, leads.ts has FKs to four distinct tables (accounts, hunts, ads, team_members).

RECOMMENDATION: Proceed with the conversion as originally planned. The original subtask implementation details remain valid. Keep foreignKey() syntax only for junction tables in hunt.schema.ts where multiple FKs could generate conflicts.
</info added on 2026-01-24T12:54:45.232Z>

### 32.3. Add Missing Enums to enums.ts and Convert Hardcoded Arrays to pgEnum

**Status:** done  
**Dependencies:** 32.1, 32.2  

Create new TypeScript enums in src/constants/enums.ts and convert hardcoded array constants to pgEnum declarations in schema files.

**Details:**

**Step 1: Add new enums to src/constants/enums.ts:**
```typescript
export enum EMessageChannel {
  WHATSAPP = "whatsapp",
  PHONE = "phone",
}

export enum ECreditType {
  SMS = "sms",
  RINGLESS_VOICE = "ringlessVoice",
  WHATSAPP_TEXT = "whatsappText",
}

export enum ETransactionType {
  PURCHASE = "purchase",
  USAGE = "usage",
  REFUND = "refund",
  ADJUSTMENT = "adjustment",
}

export enum ELeadStage {
  NOUVEAU = "nouveau",
  CONTACTE = "contacte",
  RELANCE = "relance",
  GAGNE = "gagne",
  PERDU = "perdu",
}

export enum EMessageStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  READ = "read",
  REPLIED = "replied",
}

export enum ELeadActivityType {
  STAGE_CHANGE = "stage_change",
  MESSAGE_SENT = "message_sent",
  ASSIGNMENT_CHANGE = "assignment_change",
  NOTE_ADDED = "note_added",
  REMINDER_SET = "reminder_set",
  CREATED = "created",
}
```

**Step 2: Update schema files to use pgEnum (following hunt.schema.ts pattern):**
- credits.schema.ts: `transactionType` and `creditType` pgEnums
- lead.schema.ts: `leadStage` pgEnum
- message.schema.ts: `messageChannel`, `messageStatus`, `leadActivityType` pgEnums

Remove the old `as const` array exports and TypeScript type aliases that derive from them.

### 32.4. Create credit_packs Table and Remove Hardcoded Pack Constants

**Status:** done  
**Dependencies:** 32.3  

Add a new credit_packs table to store pricing configuration in the database instead of hardcoded constants, with seed data migration.

**Details:**

**Add to credits.schema.ts:**
```typescript
export const creditPacks = pgTable(
  "credit_packs",
  {
    id: uuid().defaultRandom().primaryKey(),
    creditType: creditType().notNull(),
    credits: integer().notNull(),
    priceEur: integer("price_eur").notNull(), // Store in cents for precision
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("credit_packs_credit_type_idx").on(table.creditType),
    pgPolicy("enable read for authenticated users", {
      as: "permissive",
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);
export type TCreditPack = InferSelectModel<typeof creditPacks>;
```

**Create seed data:** After running `pnpm db:generate`, manually add seed INSERT statements to the migration file for SMS and voice packs (converting EUR to cents: 15 EUR = 1500 cents).

**Remove constants:** Delete `SMS_PACKS` and `VOICE_PACKS` from credits.schema.ts after migration is created.

**Add explicit grants:** Ensure migration includes `grant select on table public.credit_packs to authenticated, service_role;`

### 32.5. Enhance Signup Trigger to Initialize Credit Balances

**Status:** done  
**Dependencies:** 32.4  

Update the handle_new_user_account trigger function to automatically create a credit_balances row with zero credits when a new account is created.

**Details:**

**Update supabase/migrations/0002_nervous_stick.sql or create a new migration:**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_account()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  user_email text;
  new_org_id uuid;
begin
  user_email := new.email;

  -- Create personal account (1:1 with auth.users)
  INSERT INTO public.accounts (
    auth_user_id,
    email
  )
  VALUES (
    new.id,
    user_email
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    email = excluded.email
  RETURNING id INTO new_org_id;

  -- Initialize credit balances for the account (all channels start at 0)
  INSERT INTO public.credit_balances (
    account_id,
    sms,
    ringless_voice,
    whatsapp
  )
  VALUES (
    new_org_id,
    0,
    0,
    0
  )
  ON CONFLICT (account_id) DO NOTHING;

  RETURN new;
END;
$function$;
```

**Key changes:**
1. Capture the account ID using `RETURNING id INTO new_org_id`
2. Insert a credit_balances row with all credits initialized to 0
3. Use `ON CONFLICT DO NOTHING` to handle edge cases where balance already exists

**NOTE:** Since this modifies an existing migration file and migrations haven't been applied to production, you can either modify the existing file or create a new migration with the CREATE OR REPLACE statement.
