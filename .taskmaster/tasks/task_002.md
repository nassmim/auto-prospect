# Task ID: 2

**Title:** Create Hunt Schema for Saved Searches

**Status:** done

**Dependencies:** 1 ✓

**Priority:** high

**Description:** Define the Hunt entity that represents a saved search configuration for automated scraping. Hunts store search criteria (URL or filters) and outreach settings.

**Details:**

Create `src/schema/hunt.schema.ts`:

1. **hunts table:**
   - `id`: uuid, primary key, default random
   - `organizationId`: uuid, FK to organizations.id, required
   - `name`: varchar(255), required
   - `status`: varchar enum ('active', 'paused'), default 'active'
   - `searchType`: varchar enum ('url', 'builder')
   - `searchUrl`: text nullable (for URL paste mode)
   - `searchFilters`: jsonb nullable (for builder mode: { platform, priceMin, priceMax, mileageMin, mileageMax, brands[], location, radius })
   - `autoRefresh`: boolean, default true
   - `outreachSettings`: jsonb ({ leboncoin: boolean, whatsapp: boolean, sms: boolean })
   - `templateIds`: jsonb ({ leboncoin: uuid|null, whatsapp: uuid|null, sms: uuid|null })
   - `lastScanAt`: timestamp nullable
   - `createdAt`: timestamp, default now
   - `createdById`: uuid, FK to accounts.id
   - Index on (organizationId, status) for active hunt queries
   - RLS: org members can CRUD

2. Add FK constraints with proper cascade behavior
3. Add explicit grants for authenticated, service_role

**Test Strategy:**

1. Verify migration generates correct SQL with indexes and RLS. 2. Test that creating a hunt with URL type stores URL correctly. 3. Test builder filters serialization/deserialization. 4. Verify org member isolation via RLS.
