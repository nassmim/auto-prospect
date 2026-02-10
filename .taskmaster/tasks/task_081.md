# Task ID: 81

**Title:** Implement SMS Worker with Provider Integration

**Status:** done

**Dependencies:** 80 ✓

**Priority:** high

**Description:** Complete the SMS worker implementation by integrating with the EXISTING sendSms() function from the web app's message.service.ts. The worker must fetch the user's encrypted SMS API key from their account, decrypt it, and call the existing SMSMobileAPI integration.

**Details:**

**CRITICAL: This is an INTEGRATION-ONLY task. Do NOT implement a new SMS provider. Use the existing SMSMobileAPI integration.**

1. Update `apps/worker/src/workers/sms.ts` to extend the existing interface:
   ```typescript
   interface SmsJob {
     recipientPhone: string;
     message: string;
     accountId: string; // Required to fetch user's SMS API key
     metadata?: { huntId?: string; adId?: string; leadId?: string; };
   }
   ```

2. Import required utilities and services:
   - Import `createDrizzleAdmin` from `@auto-prospect/db` for database access (worker uses admin client, no RLS)
   - Import `accounts` schema from `@auto-prospect/db`
   - Copy or import `decryptCredentials` utility from `apps/web/src/utils/crypto.utils.ts` (may need to move to shared package)
   - Import `sendSms` function from web app or duplicate the simple implementation

3. Implement `smsWorker` function following the pattern from `apps/web/src/actions/message.actions.ts:278-336`:
   ```typescript
   export async function smsWorker(job: Job<SmsJob>) {
     const { recipientPhone, message, accountId, metadata } = job.data;
     
     // Step 1: Fetch user's account to get their encrypted SMS API key
     const db = createDrizzleAdmin();
     const account = await db.query.accounts.findFirst({
       where: (table, { eq }) => eq(table.id, accountId),
       columns: { smsApiKey: true },
     });
     
     if (!account?.smsApiKey) {
       throw new Error('ESmsErrorCode.API_KEY_REQUIRED');
     }
     
     // Step 2: Decrypt the API key
     const encryptionKey = process.env.SMS_API_KEY_ENCRYPTION_KEY;
     if (!encryptionKey) {
       throw new Error('ESmsErrorCode.ENCRYPTION_KEY_MISSING');
     }
     const decryptedApiKey = decryptCredentials(account.smsApiKey, encryptionKey);
     
     // Step 3: Call existing sendSms function (SMSMobileAPI)
     const result = await sendSms({ to: recipientPhone, message, apiKey: decryptedApiKey });
     
     return { success: true, messageId: result.message_id, timestamp: new Date().toISOString() };
   }
   ```

4. The `sendSms` function (from `apps/web/src/services/message.service.ts:260-286`) uses:
   - API endpoint: `https://api.smsmobileapi.com/sendsms/`
   - Content-Type: `application/x-www-form-urlencoded`
   - Parameters: `apikey`, `recipients`, `message`, `sendsms=1`

5. Add required environment variable to worker:
   - `SMS_API_KEY_ENCRYPTION_KEY` - same 32-byte hex key used in web app

6. Handle errors with appropriate error codes from `@auto-prospect/shared/src/config/error-codes.ts`:
   - `ESmsErrorCode.API_KEY_REQUIRED` - when account has no SMS API key
   - `ESmsErrorCode.ENCRYPTION_KEY_MISSING` - when env var not set
   - `ESmsErrorCode.MESSAGE_SEND_FAILED` - when API call fails

7. Optional: Move `decryptCredentials` from `apps/web/src/utils/crypto.utils.ts` to `packages/shared` for reuse across apps

**Test Strategy:**

1. Unit test with mocked database returning encrypted API key and verify decryption is called
2. Test error handling when account has no smsApiKey configured
3. Test error handling when SMS_API_KEY_ENCRYPTION_KEY env var is missing
4. Mock the SMSMobileAPI endpoint to verify correct request format (URLSearchParams with apikey, recipients, message, sendsms=1)
5. Integration test with SMSMobileAPI test credentials if available
6. Verify job retry behavior on transient API failures
7. Test metadata propagation when huntId/leadId is provided

## Subtasks

### 81.1. Move crypto utilities to shared package for worker access

**Status:** done  
**Dependencies:** None  

Move `encryptCredentials` and `decryptCredentials` functions from `apps/web/src/utils/crypto.utils.ts` to `packages/shared/src/utils/crypto.utils.ts` to enable reuse in the worker app.

**Details:**

1. Create `packages/shared/src/utils/crypto.utils.ts` with the existing crypto functions
2. Export from `packages/shared/src/index.ts`
3. Update `apps/web/src/utils/crypto.utils.ts` to re-export from shared package
4. Verify existing web app imports still work

### 81.2. Update SmsJob interface with accountId field

**Status:** done  
**Dependencies:** None  

Extend the SmsJob interface in `apps/worker/src/workers/sms.ts` to include the required `accountId` field for fetching user's SMS API key.

**Details:**

Update interface to:
```typescript
interface SmsJob {
  recipientPhone: string;
  message: string;
  accountId: string; // Required to fetch user's SMS API key
  metadata?: { huntId?: string; adId?: string; leadId?: string; };
}
```

### 81.3. Implement SMS worker with sendSms integration

**Status:** done  
**Dependencies:** 81.1, 81.2  

Complete the smsWorker function to fetch user's encrypted API key from database, decrypt it, and call the existing SMSMobileAPI sendSms function.

**Details:**

1. Import `createDrizzleAdmin` and `accounts` from `@auto-prospect/db`
2. Import `decryptCredentials` from `@auto-prospect/shared`
3. Copy the `sendSms` function from `apps/web/src/services/message.service.ts:260-286` or import if moved to shared
4. Implement the worker following the pattern from `sendSmsAction` in `apps/web/src/actions/message.actions.ts:278-336`
5. Fetch account by accountId, decrypt smsApiKey, call sendSms
6. Return success with messageId from API response

### 81.4. Add SMS_API_KEY_ENCRYPTION_KEY to worker environment

**Status:** done  
**Dependencies:** None  

Configure the worker app to use the SMS_API_KEY_ENCRYPTION_KEY environment variable for decrypting user API keys.

**Details:**

1. Add `SMS_API_KEY_ENCRYPTION_KEY` to `apps/worker/.env.example`
2. Document that this must be the same 32-byte hex key used in the web app
3. Verify the worker loads this env var correctly at startup

### 81.5. Add error handling with shared error codes

**Status:** done  
**Dependencies:** 81.3  

Implement proper error handling using ESmsErrorCode from the shared package for consistent error messaging across apps.

**Details:**

1. Import `ESmsErrorCode` from `@auto-prospect/shared/src/config/error-codes`
2. Throw descriptive errors for:
   - Missing API key: `ESmsErrorCode.API_KEY_REQUIRED`
   - Missing encryption key: `ESmsErrorCode.ENCRYPTION_KEY_MISSING`
   - API call failure: `ESmsErrorCode.MESSAGE_SEND_FAILED`
3. Ensure BullMQ can properly retry on transient failures vs permanent failures
