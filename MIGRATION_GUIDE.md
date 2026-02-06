# Migration Guide: From Duplicate Enums to Single Source of Truth

## The Problem

Current approach requires defining stages in multiple places:

```typescript
// 1. Define enum
export enum ELeadStage {
  NOUVEAU = "nouveau",
  CONTACTE = "contacte",
  // ...
}

// 2. Use enum in config (still duplicating keys!)
export const LEAD_STAGE_CONFIG = {
  [ELeadStage.NOUVEAU]: { value: ELeadStage.NOUVEAU, label: "..." },
  [ELeadStage.CONTACTE]: { value: ELeadStage.CONTACTE, label: "..." },
}
```

You still need to edit TWO places: the enum AND the config.

---

## The Solution: Define Once, Derive Everything

```typescript
// ✅ ONLY edit this array to add/modify/remove stages
const STAGE_DEFINITIONS = [
  {
    key: "NOUVEAU",           // Used for ELeadStage.NOUVEAU
    value: "nouveau",         // Database value
    label: "Nouveau",         // UI display
    description: "...",       // Metadata
    color: "blue",           // Metadata
    icon: "star",            // Metadata
  },
  // ... add more stages here
] as const;

// Everything else is automatically derived:
export const ELeadStage = { NOUVEAU: "nouveau", ... }  // Auto-generated
export type LeadStage = "nouveau" | "contacte" | ...    // Auto-generated
export const LEAD_STAGES = [...]                        // Auto-generated
```

---

## Migration Steps

### Step 1: Create the New Config File

Create `src/config/lead-stages.ts`:

```typescript
const STAGE_DEFINITIONS = [
  {
    key: "NOUVEAU",
    value: "nouveau",
    label: "Nouveau",
    description: "Leads nouvellement découverts",
    color: "blue",
    icon: "star",
  },
  // ... copy all your stages here
] as const;

// Derive everything
export const LEAD_STAGE_CONFIG = Object.fromEntries(
  STAGE_DEFINITIONS.map((stage) => [stage.key, stage]),
) as any; // Simplified typing for now

export const ELeadStage = Object.fromEntries(
  STAGE_DEFINITIONS.map((stage) => [stage.key, stage.value]),
) as any;

export type LeadStage = (typeof STAGE_DEFINITIONS)[number]["value"];
export const LEAD_STAGES = STAGE_DEFINITIONS;
export const LEAD_STAGE_VALUES = STAGE_DEFINITIONS.map((s) => s.value);
```

### Step 2: Update Drizzle Schema

```typescript
// src/schema/lead.schema.ts

// OLD:
import { ELeadStage } from "@/constants/enums";
export const leadStage = pgEnum(
  "lead_stage",
  Object.values(ELeadStage) as [string, ...string[]],
);

// NEW:
import { LEAD_STAGE_VALUES } from "@/config/lead-stages";
export const leadStage = pgEnum(
  "lead_stage",
  LEAD_STAGE_VALUES as [string, ...string[]],
);
```

### Step 3: Update All Imports

Find and replace across your codebase:

```bash
# Find files importing the old enum
grep -r "from \"@/constants/enums\"" --include="*.ts" --include="*.tsx"

# Update each file:
# OLD:
import { ELeadStage } from "@/constants/enums";

# NEW:
import { ELeadStage, LEAD_STAGES } from "@/config/lead-stages";
```

### Step 4: Update Component Usage

```typescript
// OLD (kanban-view.tsx):
import { ELeadStage } from "@/constants/enums";

const leadStages = Object.values(ELeadStage);
const STAGE_LABELS: Record<ELeadStage, string> = {
  [ELeadStage.NOUVEAU]: "Nouveau",
  // ...
};

{leadStages.map((stage) => (
  <KanbanColumn title={STAGE_LABELS[stage]} />
))}

// NEW:
import { LEAD_STAGES, ELeadStage } from "@/config/lead-stages";

{LEAD_STAGES.map((stageConfig) => (
  <KanbanColumn
    title={stageConfig.label}
    key={stageConfig.value}
  />
))}
```

### Step 5: Remove Old Enum

```typescript
// src/constants/enums.ts
// ❌ DELETE this entire block:
export enum ELeadStage {
  NOUVEAU = "nouveau",
  CONTACTE = "contacte",
  RELANCE = "relance",
  GAGNE = "gagne",
  PERDU = "perdu",
}
```

### Step 6: Verify TypeScript Compilation

```bash
npx tsc --noEmit
```

---

## Before vs After Comparison

### Adding a New Stage

**BEFORE (3-4 places to edit):**

1. `src/constants/enums.ts` - Add to enum
2. `src/config/lead-stages.ts` - Add to config
3. `src/schema/lead.schema.ts` - Maybe update if using different values
4. Any component with a `STAGE_LABELS` object

**AFTER (1 place to edit):**

1. `src/config/lead-stages.ts` - Add to `STAGE_DEFINITIONS` array

```typescript
const STAGE_DEFINITIONS = [
  // ... existing stages
  {
    key: "QUALIFICATION",
    value: "qualification",
    label: "Qualification",
    description: "En cours de qualification",
    color: "yellow",
    icon: "clipboard",
  },
] as const;
```

Done! Everything else updates automatically:
- ✅ `ELeadStage.QUALIFICATION` becomes available
- ✅ Type includes `"qualification"`
- ✅ `LEAD_STAGES` array includes it
- ✅ All components using `LEAD_STAGES.map()` render it

---

## Usage Examples

### In Components

```typescript
import { LEAD_STAGES, ELeadStage, getLeadStageLabel } from "@/config/lead-stages";

// Iterate through all stages
{LEAD_STAGES.map((config) => (
  <div key={config.value} style={{ color: config.color }}>
    {config.label}: {config.description}
  </div>
))}

// Check a specific stage
if (lead.stage === ELeadStage.NOUVEAU) {
  // Type-safe comparison
}

// Get label for a stage
const label = getLeadStageLabel(lead.stage); // "Nouveau"
```

### In Server Actions

```typescript
import { ELeadStage } from "@/config/lead-stages";

export async function updateLeadStage(leadId: string, newStage: ELeadStage) {
  // Use like before - works exactly the same!
  await db.update(leads).set({ stage: newStage });
}
```

### In Drizzle Schema

```typescript
import { LEAD_STAGE_VALUES } from "@/config/lead-stages";

export const leadStage = pgEnum("lead_stage", LEAD_STAGE_VALUES as [string, ...string[]]);
```

---

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| Files to edit for new stage | 3-4 | 1 |
| Duplication | High | Zero |
| Single source of truth | ❌ No | ✅ Yes |
| Rich metadata | Limited | Unlimited |
| Type safety | ✅ Good | ✅ Excellent |
| Maintainability | Medium | High |

---

## Rollback Plan

If you need to rollback:

1. Keep old `src/constants/enums.ts` file
2. Update imports back to `@/constants/enums`
3. Delete `src/config/lead-stages.ts`

The enum values are the same, so no database changes needed.

---

## Next Steps

Apply the same pattern to other enums:

- ✅ `EContactChannel` → `CONTACT_CHANNEL_CONFIG`
- ✅ `ETransactionType` → `TRANSACTION_TYPE_CONFIG`
- ✅ `EMessageStatus` → `MESSAGE_STATUS_CONFIG`
- ✅ `EHuntStatus` → `HUNT_STATUS_CONFIG`

Each one eliminates duplicate definitions and provides rich metadata!
