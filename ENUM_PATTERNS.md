# TypeScript Enum + Metadata Patterns

This document shows different approaches to avoid duplicating enum definitions and their labels/metadata.

## Problem: Double Definition

```typescript
// ❌ BAD: Duplicate definitions
export enum ELeadStage {
  NOUVEAU = "nouveau",
  CONTACTE = "contacte",
  RELANCE = "relance",
}

// Need to duplicate again for labels!
const STAGE_LABELS: Record<ELeadStage, string> = {
  [ELeadStage.NOUVEAU]: "Nouveau",
  [ELeadStage.CONTACTE]: "Contacté",
  [ELeadStage.RELANCE]: "Relance",
};
```

## Solution 1: Config Object (✅ Recommended for this codebase)

**Use when**: You need TypeScript enums for database schemas + rich metadata

```typescript
// src/constants/enums.ts
export enum ELeadStage {
  NOUVEAU = "nouveau",
  CONTACTE = "contacte",
  RELANCE = "relance",
}

// src/config/lead-stages.ts
import { ELeadStage } from "@/constants/enums";

export const LEAD_STAGE_CONFIG = {
  [ELeadStage.NOUVEAU]: {
    value: ELeadStage.NOUVEAU,
    label: "Nouveau",
    description: "Leads nouvellement découverts",
    color: "blue" as const,
    icon: "star" as const,
  },
  [ELeadStage.CONTACTE]: {
    value: ELeadStage.CONTACTE,
    label: "Contacté",
    description: "Premier contact établi",
    color: "purple" as const,
    icon: "message" as const,
  },
  // ...
} as const;

// Helpers
export const LEAD_STAGES = Object.values(LEAD_STAGE_CONFIG);
export const getLeadStageLabel = (stage: ELeadStage) =>
  LEAD_STAGE_CONFIG[stage].label;
```

**Usage**:
```typescript
// Iterate through all stages
{LEAD_STAGES.map((config) => (
  <div key={config.value}>
    {config.label} - {config.description}
  </div>
))}

// Get label for a stage
const label = getLeadStageLabel(ELeadStage.NOUVEAU); // "Nouveau"
```

**Pros**:
- Single place to add new stages with metadata
- Type-safe access to all properties
- Works with existing Drizzle enum schemas
- Can extend with any metadata (colors, icons, etc.)

**Cons**:
- Still need to maintain the enum separately
- Requires importing from two places (enum + config)

---

## Solution 2: Const Object as Enum (Alternative)

**Use when**: You don't need actual TypeScript enums, just string constants

```typescript
// src/config/lead-stages.ts
export const LEAD_STAGE = {
  NOUVEAU: {
    value: "nouveau",
    label: "Nouveau",
    description: "Leads nouvellement découverts",
    color: "blue",
  },
  CONTACTE: {
    value: "contacte",
    label: "Contacté",
    description: "Premier contact établi",
    color: "purple",
  },
} as const;

// Derive types from the object
export type LeadStage = typeof LEAD_STAGE[keyof typeof LEAD_STAGE]["value"];
// Type: "nouveau" | "contacte"

export const LEAD_STAGES = Object.values(LEAD_STAGE);
```

**Usage**:
```typescript
// Use like an enum
const stage: LeadStage = LEAD_STAGE.NOUVEAU.value; // "nouveau"
const label = LEAD_STAGE.NOUVEAU.label; // "Nouveau"

// Drizzle schema
export const leadStage = pgEnum(
  "lead_stage",
  Object.values(LEAD_STAGE).map(s => s.value) as [string, ...string[]]
);
```

**Pros**:
- ✅ **Single source of truth** - everything in one place
- Type-safe throughout
- Easy to add metadata
- No duplication

**Cons**:
- Can't use in Drizzle schema definitions directly
- Less familiar pattern for some developers
- Verbose access: `LEAD_STAGE.NOUVEAU.value` vs `ELeadStage.NOUVEAU`

---

## Solution 3: Zod Enum (For forms + validation)

**Use when**: You need runtime validation AND compile-time types

```typescript
// src/validation-schemas/lead.schema.ts
import { z } from "zod";

export const leadStageSchema = z.enum([
  "nouveau",
  "contacte",
  "relance",
  "gagne",
  "perdu",
]);

// Extract TypeScript type
export type LeadStage = z.infer<typeof leadStageSchema>;

// Config with metadata
export const LEAD_STAGE_CONFIG: Record<LeadStage, {
  label: string;
  description: string;
  color: string;
}> = {
  nouveau: {
    label: "Nouveau",
    description: "Leads nouvellement découverts",
    color: "blue",
  },
  contacte: {
    label: "Contacté",
    description: "Premier contact établi",
    color: "purple",
  },
  // ...
};

// Array of values
export const LEAD_STAGES = leadStageSchema.options;
```

**Usage**:
```typescript
// Runtime validation
const result = leadStageSchema.safeParse(userInput);
if (result.success) {
  const stage: LeadStage = result.data; // Type-safe!
}

// In forms
const schema = z.object({
  stage: leadStageSchema,
});
```

**Pros**:
- Runtime validation included
- Perfect for form schemas
- Type inference from schema
- Single source for values

**Cons**:
- Requires Zod dependency
- Label mapping still separate
- Can't use TypeScript enum features

---

## Comparison Table

| Feature | Config Object | Const as Enum | Zod Enum |
|---------|--------------|---------------|----------|
| Single source of truth | Partial (enum separate) | ✅ Yes | Partial (labels separate) |
| TypeScript enum features | ✅ Yes | ❌ No | ❌ No |
| Works with Drizzle | ✅ Yes (direct) | ⚠️ Yes (conversion) | ⚠️ Yes (conversion) |
| Runtime validation | ❌ No | ❌ No | ✅ Yes |
| Metadata support | ✅ Excellent | ✅ Excellent | ✅ Good |
| Type safety | ✅ Excellent | ✅ Excellent | ✅ Excellent |
| Easy iteration | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Recommendation for Auto-Prospect

**Use Solution 1 (Config Object)** because:

1. ✅ You already have `ELeadStage` enum for Drizzle schemas
2. ✅ Changing enums to const objects would require migration
3. ✅ Config object provides rich metadata (colors, icons, descriptions)
4. ✅ Only one file to edit when adding new stages
5. ✅ Backward compatible with existing code

**Migration path** (if you want to go to Solution 2):
1. Create const object with all metadata
2. Migrate Drizzle schemas to use derived values
3. Update all imports
4. Remove old enum definitions

For now, keep `ELeadStage` enum and use `LEAD_STAGE_CONFIG` for metadata.

---

## Example: Adding a New Stage

With the recommended config pattern:

```typescript
// src/config/lead-stages.ts
export const LEAD_STAGE_CONFIG = {
  // ... existing stages ...

  // ✅ Add ONE entry here - everything else updates automatically!
  [ELeadStage.QUALIFICATION]: {
    value: ELeadStage.QUALIFICATION,
    label: "Qualification",
    description: "Lead en cours de qualification",
    color: "yellow" as const,
    icon: "clipboard" as const,
  },
} as const;
```

That's it! All components using `LEAD_STAGES` will automatically include the new stage.
