# Enum Migration Status

## ✅ Completed

### 1. Config Files Created (All enums now have DRY configs)

- ✅ `src/config/lead-stages.ts` - ELeadStage + LeadStage type
- ✅ `src/config/lead-activity-types.ts` - ELeadActivityType + LeadActivityType type
- ✅ `src/config/contact-channels.ts` - EContactChannel + ContactChannel type
- ✅ `src/config/message-channels.ts` - EMessageChannel + MessageChannel type
- ✅ `src/config/message-statuses.ts` - EMessageStatus + MessageStatus type
- ✅ `src/config/transaction-types.ts` - ETransactionType + TransactionType type
- ✅ `src/config/hunt-statuses.ts` - EHuntStatus + HuntStatus type
- ✅ `src/config/roles.ts` - ERole + Role type
- ✅ `src/config/account-types.ts` - EAccountType + AccountType type
- ✅ `src/config/platforms.ts` - EPlatformValue + PlatformValue type

### 2. Schema Files Updated

- ✅ `src/schema/lead.schema.ts` - Uses LEAD_STAGE_VALUES, LEAD_ACTIVITY_TYPE_VALUES
- ✅ `src/schema/credits.schema.ts` - Uses TRANSACTION_TYPE_VALUES
- ✅ `src/schema/message.schema.ts` - Uses CONTACT_CHANNEL_VALUES, MESSAGE_CHANNEL_VALUES, MESSAGE_STATUS_VALUES
- ✅ `src/schema/team.schema.ts` - Uses ROLE_VALUES
- ✅ `src/schema/hunt.schema.ts` - Uses HUNT_STATUS_VALUES
- ✅ `src/schema/account.schema.ts` - Uses ACCOUNT_TYPE_VALUES

### 3. Most Service/Action Files Updated

- ✅ Services and actions now import from `@/config/*` instead of `@/constants/enums`

## ⚠️ Remaining Work

### Pattern to Fix: Type vs Value Usage

**The Issue**: Our new enums are const objects, not TypeScript enums.

**Before** (TypeScript enum):
```typescript
enum ELeadStage {
  NOUVEAU = "nouveau"
}

// Used both as value AND type
const stage: ELeadStage = ELeadStage.NOUVEAU; // ✅ Works
```

**After** (const object):
```typescript
const ELeadStage = { NOUVEAU: "nouveau" } as const;
type LeadStage = "nouveau";

// MUST separate value and type usage
const stage: LeadStage = ELeadStage.NOUVEAU; // ✅ Correct
const stage: ELeadStage = ELeadStage.NOUVEAU; // ❌ Wrong - ELeadStage is a value, not a type
```

### Files Needing Type/Value Fixes

Run this to see remaining errors:
```bash
npx tsc --noEmit 2>&1 | grep "refers to a value"
```

**Fix Pattern**:

1. Import both the enum object AND the type:
```typescript
// ❌ Before
import { ELeadStage } from "@/config/lead-stages";
function foo(stage: ELeadStage) {} // Error!

// ✅ After
import { ELeadStage, type LeadStage } from "@/config/lead-stages";
function foo(stage: LeadStage) {} // Correct!
const value = ELeadStage.NOUVEAU; // Also correct!
```

2. Update all type annotations:
```typescript
// Function parameters
function updateStage(stage: LeadStage) {}

// Object properties
type Props = {
  stage: LeadStage; // Not ELeadStage
};

// Type assertions
const stage = data.stage as LeadStage; // Not as ELeadStage

// Record keys
const labels: Record<LeadStage, string> = { // Not Record<ELeadStage, string>
  [ELeadStage.NOUVEAU]: "Nouveau",
};
```

### Quick Fix Script

For each file with errors, follow this pattern:

```bash
# Example for lead.actions.ts
# 1. Find the error
npx tsc --noEmit 2>&1 | grep "lead.actions"
# Output: error TS2749: 'ELeadStage' refers to a value, but is being used as a type

# 2. Add type import
# Change: import { ELeadStage } from "@/config/lead-stages";
# To: import { ELeadStage, type LeadStage } from "@/config/lead-stages";

# 3. Replace type usages
# Change: function foo(stage: ELeadStage)
# To: function foo(stage: LeadStage)
```

### Specific Files to Fix (from tsc output)

1. **src/actions/hunt.actions.ts:164** - `newStatus: HuntStatus` not `EHuntStatus`
2. **src/actions/lead.actions.ts:64,110** - `newStage: LeadStage` not `ELeadStage`
3. **src/actions/message.actions.ts:27** - `channel: ContactChannel` not `EContactChannel`
4. **src/components/credits/credits-view.tsx** - Import both, use types
5. **src/components/hunts/credit-usage-display.tsx** - `channel: ContactChannel`
6. **src/components/hunts/hunt-card.tsx:57** - `status: HuntStatus`
7. **src/components/leads/kanban-view.tsx:84** - `newStage: LeadStage`
8. **src/components/leads/lead-drawer.tsx** - Import from config, not schema

## 🎯 Final Steps

### 1. Fix All Type/Value Errors

```bash
# See all errors
npx tsc --noEmit 2>&1 | grep -E "(error TS2749|error TS2305)"

# Fix each file following the pattern above
```

### 2. Delete Old Enums File

```bash
rm src/constants/enums.ts
```

### 3. Verify Compilation

```bash
npx tsc --noEmit
# Should show 0 errors
```

### 4. Run Tests

```bash
npm test
```

## 📊 Migration Benefits

### Before
- **10 enum files** scattered across constants
- **Duplicate labels** in multiple places
- **3-4 files to edit** when adding new enum value

### After
- **10 config files** with rich metadata
- **Single source of truth** for each enum
- **1 file to edit** when adding new enum value
- **Rich metadata** (labels, colors, icons, descriptions)
- **Type-safe** access to all properties

### Example: Adding a New Lead Stage

**Before Migration** (4 places to edit):
```typescript
// 1. constants/enums.ts
export enum ELeadStage {
  QUALIFICATION = "qualification" // Add here
}

// 2. Some component
const STAGE_LABELS = {
  [ELeadStage.QUALIFICATION]: "Qualification" // Add here
}

// 3. Another component
const STAGE_COLORS = {
  [ELeadStage.QUALIFICATION]: "yellow" // Add here
}

// 4. Schema
// Regenerate migration
```

**After Migration** (1 place to edit):
```typescript
// config/lead-stages.ts - ONLY edit this file
const LEAD_STAGE_DEFINITIONS = [
  {
    key: "QUALIFICATION",
    value: "qualification",
    label: "Qualification",
    description: "En cours de qualification",
    color: "yellow",
    icon: "clipboard",
  },
];

// Everything else updates automatically!
```

## 🔄 Rollback Plan

If needed, rollback is simple:

1. Restore `src/constants/enums.ts` from git
2. Revert schema file changes
3. Find/replace `@/config/*` back to `@/constants/enums`
4. Delete new config files

Database schemas are unchanged - only TypeScript code affected.
