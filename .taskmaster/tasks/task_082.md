# Task ID: 82

**Title:** Implement WhatsApp Worker with Baileys Integration

**Status:** done

**Dependencies:** 80 ✓

**Priority:** high

**Description:** Complete the WhatsApp worker by refactoring whatsapp.service.ts functions into a shared package, then integrating with the worker. Currently blocked: whatsapp.service.ts uses Next.js-specific imports (@/lib, @/schema, @/utils) that cannot be imported from the worker package.

**Details:**

## Current State
The WhatsApp worker structure is implemented at `apps/worker/src/workers/whatsapp.ts` with:
- Database integration using `@auto-prospect/db` (createDrizzleAdmin, accounts schema)
- Error handling with `EWhatsAppErrorCode` from `@auto-prospect/shared`
- Placeholder implementation with commented-out Baileys integration code

## Blocking Issue
`apps/web/src/services/whatsapp.service.ts` cannot be imported from worker because it uses Next.js path aliases:
- `@/lib/drizzle/dbClient` → createDrizzleSupabaseClient, TDBClient, TDBOptions, TDBQuery
- `@/schema/whatsapp-session.schema` → TWhatsappSession, whatsappSessions (already in @auto-prospect/db)
- `@/utils/crypto.utils` → decryptCredentials, encryptCredentials (already in @auto-prospect/shared)

## Required Refactoring
1. **Create `@auto-prospect/whatsapp` package** OR extend `@auto-prospect/shared`:
   - Move core Baileys functions that don't need RLS (createDBAuthState, connectWithCredentials, sendWhatsAppMessage, etc.)
   - Add `@whiskeysockets/baileys`, `@hapi/boom`, `qrcode` as dependencies
   - Export types: StoredAuthState, WhatsAppConnectionResult, WhatsAppEventHandlers

2. **Refactor database functions**:
   - `getWhatsAppSession` needs to accept a db client parameter instead of creating one internally
   - Pattern: Pass `createDrizzleAdmin()` from worker, `createDrizzleSupabaseClient()` from web app
   - The `whatsappSessions` schema is already exported from `@auto-prospect/db`

3. **Once refactored, update worker** (`apps/worker/src/workers/whatsapp.ts`):
   ```typescript
   import { connectWithCredentials, sendWhatsAppMessage, createDBAuthState } from '@auto-prospect/whatsapp';
   import { createDrizzleAdmin, whatsappSessions } from '@auto-prospect/db';
   import { decryptCredentials, EWhatsAppErrorCode } from '@auto-prospect/shared';
   ```

4. **Implement worker flow**:
   - Query `whatsappSessions` directly using `createDrizzleAdmin()`
   - Parse and decrypt credentials using `decryptCredentials` from shared
   - Call `connectWithCredentials(credentials)` from whatsapp package
   - Call `socket.waitForConnection()` with timeout handling
   - Call `sendWhatsAppMessage(socket, recipientPhone, message)`
   - Always cleanup socket connection in finally block

## Alternative: Inline Baileys in Worker
If package refactoring is too complex, duplicate minimal Baileys logic in worker:
- Copy `createDBAuthState` and `connectWithCredentials` logic
- Add `@whiskeysockets/baileys` to worker package.json
- Query whatsappSessions directly with admin client

**Test Strategy:**

1. Unit test with mocked database and Baileys socket
2. Test session retrieval from whatsappSessions table using admin client
3. Test credential decryption using shared crypto utils
4. Test error handling for: missing session, expired session, invalid recipient, connection timeout
5. Verify socket cleanup is always called (even on error) in finally block
6. Integration test with test WhatsApp number once refactoring is complete
7. Test that worker correctly bypasses RLS when querying sessions

## Subtasks

### 82.1. Implement basic WhatsApp worker structure with database integration

**Status:** done  
**Dependencies:** None  

Create the WhatsApp worker skeleton with database connection, account lookup, and error handling framework using @auto-prospect/db and @auto-prospect/shared packages.

**Details:**

Already completed. Worker at `apps/worker/src/workers/whatsapp.ts` has:
- WhatsAppJob interface with recipientPhone, senderPhone, message, metadata
- Account lookup using createDrizzleAdmin and accounts schema
- Error handling with EWhatsAppErrorCode from shared package
- Placeholder for Baileys integration

### 82.2. Refactor whatsapp.service.ts to use package-agnostic database pattern

**Status:** done  
**Dependencies:** None  

Modify getWhatsAppSession and other database functions to accept a db client parameter instead of using Next.js-specific createDrizzleSupabaseClient, enabling use from both web app and worker.

**Details:**

Refactor functions in `apps/web/src/services/whatsapp.service.ts`:
1. Change `getWhatsAppSession(accountId, options)` signature to accept db client as parameter
2. Pattern: `getWhatsAppSession(db: DrizzleClient, accountId: string)` where DrizzleClient can be admin or RLS
3. Update `saveWhatsAppSession` and `updateWhatsAppConnectionStatus` similarly
4. Keep backward compatibility by providing optional parameter with default
5. Import `whatsappSessions` from `@auto-prospect/db` instead of `@/schema`

### 82.3. Create @auto-prospect/whatsapp package with Baileys integration

**Status:** done  
**Dependencies:** None  

Create a new shared package containing core Baileys functions (createDBAuthState, connectWithCredentials, sendWhatsAppMessage) that can be imported by both web app and worker.

**Details:**

Create `packages/whatsapp/` with:
1. `package.json` with dependencies: @whiskeysockets/baileys, @hapi/boom, qrcode, @auto-prospect/shared
2. `src/index.ts` exporting all functions
3. `src/auth.ts`: createDBAuthState, StoredAuthState type
4. `src/connection.ts`: createWhatsAppConnection, connectWithCredentials, cleanup utilities
5. `src/messaging.ts`: sendWhatsAppMessage, checkWhatsAppNumber
6. `src/types.ts`: WhatsAppConnectionResult, WhatsAppEventHandlers
7. Use crypto utils from @auto-prospect/shared for encryption/decryption
8. Add package to workspace in root package.json

### 82.4. Update web app to use @auto-prospect/whatsapp package

**Status:** done  
**Dependencies:** 82.3  

Refactor apps/web/src/services/whatsapp.service.ts to import core functions from the new @auto-prospect/whatsapp package instead of implementing them locally.

**Details:**

Update `apps/web/src/services/whatsapp.service.ts`:
1. Import core functions from @auto-prospect/whatsapp: createDBAuthState, connectWithCredentials, sendWhatsAppMessage, etc.
2. Keep database wrapper functions (getWhatsAppSession, saveWhatsAppSession) in web app since they handle RLS
3. Re-export types for backward compatibility with existing web app code
4. Remove duplicate implementations, keep only web-specific wrappers
5. Update imports in any files using whatsapp.service.ts

### 82.5. Complete WhatsApp worker Baileys integration

**Status:** done  
**Dependencies:** 82.3, 82.4  

Update the WhatsApp worker to use the new @auto-prospect/whatsapp package functions for actual message delivery, replacing the placeholder implementation.

**Details:**

Update `apps/worker/src/workers/whatsapp.ts`:
1. Import from @auto-prospect/whatsapp: connectWithCredentials, sendWhatsAppMessage
2. Import from @auto-prospect/shared: decryptCredentials, EWhatsAppErrorCode
3. Query whatsappSessions directly using createDrizzleAdmin()
4. Implement full flow:
   - Fetch session: `db.query.whatsappSessions.findFirst({ where: eq(whatsappSessions.accountId, accountId) })`
   - Parse credentials: `JSON.parse(session.credentials) as StoredAuthState`
   - Connect: `const { socket, waitForConnection, cleanup } = await connectWithCredentials(credentials)`
   - Wait: `const connected = await waitForConnection()`
   - Send: `await sendWhatsAppMessage(socket, formattedPhone, message)`
   - Cleanup in finally block
5. Remove placeholder setTimeout and console.logs
