# Task ID: 83

**Title:** Implement Voice/Ringless Voicemail Worker

**Status:** done

**Dependencies:** 80 ✓

**Priority:** high

**Description:** Create the Voice worker that integrates with the existing sendVoiceMessage() function from voice.actions.ts to process ringless voicemail delivery jobs using Voice Partner API.

**Details:**

**INTEGRATION-ONLY TASK**: Use the existing `sendVoiceMessage()` function from `apps/web/src/actions/voice.actions.ts` (lines 27-87).

## Existing Implementation Details
- **API Endpoint**: `https://api.voicepartner.fr/v1/campaign/send`
- **Environment Variable**: `VOICE_PARTNER_API_KEY`
- **Audio Support**: Pre-recorded audio ONLY via `tokenAudio` parameter (NO TTS support)
- **Function Signature**: `sendVoiceMessage(input: SendVoiceMessageInput): Promise<SendVoiceMessageResult>`

## Implementation Steps

1. **Update `apps/worker/src/workers/voice.ts` interface**:
   ```typescript
   interface VoiceJob {
     recipientPhone: string; // Phone number(s) to call - sent as phoneNumbers to Voice Partner
     tokenAudio: string; // Required: Pre-recorded audio token from Voice Partner
     sender?: string; // Optional: Caller ID
     emailForNotification?: string; // Optional: Email for delivery notifications
     scheduledDate?: string; // Optional: Schedule for future delivery
     metadata?: {
       huntId?: string;
       accountId?: string;
       adId?: string;
     };
   }
   ```

2. **Import existing `sendVoiceMessage` function**:
   ```typescript
   import { sendVoiceMessage } from '@auto-prospect/web/actions/voice.actions';
   ```

3. **Implement `voiceWorker` function**:
   - Extract job data: `recipientPhone`, `tokenAudio`, optional fields
   - Validate required fields (recipientPhone and tokenAudio are mandatory)
   - Call `sendVoiceMessage()` with proper input mapping:
     ```typescript
     const result = await sendVoiceMessage({
       phoneNumbers: job.data.recipientPhone,
       tokenAudio: job.data.tokenAudio,
       sender: job.data.sender,
       emailForNotification: job.data.emailForNotification,
       scheduledDate: job.data.scheduledDate,
     });
     ```
   - Handle response: check `result.success`, throw error if failed
   - Return success data with Voice Partner response

4. **Error Handling**:
   - Missing `tokenAudio` → throw validation error (pre-recorded audio is REQUIRED)
   - Missing `recipientPhone` → throw validation error
   - API key missing → caught by existing function, throws error
   - Voice Partner API errors → propagate from sendVoiceMessage result

5. **Logging**:
   - Log job start with job.id and metadata
   - Log success/failure with Voice Partner response data
   - Include huntId/adId in logs for traceability

## DO NOT Implement
- ❌ New voice provider integration (Twilio, Drop.co, Slybroadcast)
- ❌ Text-to-Speech (TTS) functionality
- ❌ Custom API calls to Voice Partner (use existing function)
- ❌ Additional environment variables beyond VOICE_PARTNER_API_KEY

**Test Strategy:**

1. **Unit tests** with mocked `sendVoiceMessage` function:
   - Test successful voice message delivery
   - Test with all optional parameters (sender, emailForNotification, scheduledDate)
   - Test with minimal required parameters only

2. **Validation tests**:
   - Test missing `tokenAudio` throws validation error
   - Test missing `recipientPhone` throws validation error

3. **Error handling tests**:
   - Test Voice Partner API error response handling
   - Test API key missing scenario
   - Verify errors are properly propagated for BullMQ retry logic

4. **Integration test** with Voice Partner sandbox/test credentials:
   - Verify actual API call succeeds with test token
   - Verify response data is correctly returned

5. **Metadata tracking test**:
   - Verify huntId, accountId, adId are logged correctly
   - Verify job completion returns expected data structure

## Subtasks

### 83.1. Update VoiceJob interface for Voice Partner integration

**Status:** in-progress  
**Dependencies:** None  

Modify the VoiceJob interface in apps/worker/src/workers/voice.ts to match Voice Partner API requirements with tokenAudio (required) instead of message/audioUrl.

**Details:**

Replace current interface with:
```typescript
interface VoiceJob {
  recipientPhone: string;
  tokenAudio: string; // Required: Pre-recorded audio token
  sender?: string;
  emailForNotification?: string;
  scheduledDate?: string;
  metadata?: { huntId?: string; accountId?: string; adId?: string; };
}
```
Remove the `message` field as TTS is not supported. The `tokenAudio` is now required.

### 83.2. Import and integrate sendVoiceMessage function

**Status:** pending  
**Dependencies:** 83.1  

Import the existing sendVoiceMessage function from apps/web/src/actions/voice.actions.ts and wire it into the voiceWorker.

**Details:**

Add import statement:
```typescript
import { sendVoiceMessage } from '@auto-prospect/web/actions/voice.actions';
```
Then call it in voiceWorker with mapped parameters:
```typescript
const result = await sendVoiceMessage({
  phoneNumbers: job.data.recipientPhone,
  tokenAudio: job.data.tokenAudio,
  sender: job.data.sender,
  emailForNotification: job.data.emailForNotification,
  scheduledDate: job.data.scheduledDate,
});
```

### 83.3. Implement error handling and response processing

**Status:** pending  
**Dependencies:** 83.2  

Add proper error handling for sendVoiceMessage responses and validation of required fields (tokenAudio, recipientPhone).

**Details:**

Handle the SendVoiceMessageResult:
```typescript
if (!result.success) {
  throw new Error(result.error || 'Voice message delivery failed');
}
return {
  success: true,
  data: result.data,
  timestamp: new Date().toISOString(),
};
```
Add validation at start:
```typescript
if (!job.data.tokenAudio) {
  throw new Error('tokenAudio is required - TTS is not supported');
}
if (!job.data.recipientPhone) {
  throw new Error('recipientPhone is required');
}
```

### 83.4. Add structured logging with metadata

**Status:** done  
**Dependencies:** 83.3  

Add consistent logging throughout voiceWorker to track job processing, including huntId/adId from metadata for traceability.

**Details:**

Add logging:
```typescript
console.log(`Processing Voice job ${job.id}:`, {
  recipientPhone: job.data.recipientPhone,
  hasScheduledDate: !!job.data.scheduledDate,
  metadata: job.data.metadata,
});
// After success:
console.log(`Voice job ${job.id} completed:`, result.data);
// On error:
console.error(`Voice job ${job.id} failed:`, error);
```
Follow pattern from whatsapp.ts worker for consistency.
