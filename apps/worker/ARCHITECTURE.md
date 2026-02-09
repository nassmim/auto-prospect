# Worker Architecture

## Overview

The worker is a standalone Express + BullMQ service that handles background jobs for Auto-Prospect.

It processes:
- WhatsApp messaging (via Baileys)
- SMS messaging
- Ringless voice messages
- Hunt execution (automated prospect outreach)

## Why a Separate Worker?

### Problems Solved

1. **Next.js Edge Function Limitations**
   - Max execution time: 25 seconds (Vercel Hobby/Pro), 5 minutes (Enterprise)
   - No persistent connections (needed for WhatsApp/Baileys)
   - Limited CPU/memory for heavy operations

2. **Baileys Requirements**
   - Needs long-running WebSocket connections
   - Maintains session state
   - Handles real-time WhatsApp events

3. **Scalability**
   - Independent scaling from web app
   - Handles spikes in messaging load
   - Queue-based processing prevents overload

4. **Reliability**
   - Job retries on failure
   - Graceful degradation
   - No impact on web app if worker crashes

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Auto-Prospect                             │
│                                                                   │
│  ┌──────────────┐         HTTP + Auth         ┌───────────────┐ │
│  │   Next.js    │────────────────────────────▶│    Worker     │ │
│  │   Web App    │  POST /api/hunt/execute     │   (Express)   │ │
│  │  (Vercel)    │  POST /api/whatsapp/text    │   (Railway)   │ │
│  └──────────────┘                              └───────┬───────┘ │
│         │                                              │         │
│         │                                              │         │
│         ▼                                              ▼         │
│  ┌──────────────┐                              ┌───────────────┐ │
│  │   Supabase   │◀─────────────────────────────│     Redis     │ │
│  │  (Postgres)  │  Read: accounts, hunts, etc  │   (BullMQ)    │ │
│  └──────────────┘  Write: messages, leads      └───────────────┘ │
│                                                         │         │
│                                                         │         │
│                                           ┌─────────────┼────────┐│
│                                           │             │        ││
│                     ┌─────────────────────▼─┐  ┌───────▼──────┐ ││
│                     │  WhatsApp Queue       │  │  SMS Queue   │ ││
│                     │  (Baileys Messages)   │  │              │ ││
│                     └─────────┬─────────────┘  └──────┬───────┘ ││
│                               │                       │         ││
│                               ▼                       ▼         ││
│                     ┌─────────────────┐     ┌─────────────────┐││
│                     │ WhatsApp Worker │     │   SMS Worker    │││
│                     └─────────────────┘     └─────────────────┘││
│                                                                  ││
│  Similar structure for: Voice Queue/Worker, Hunt Queue/Worker   ││
└──────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
apps/worker/
├── src/
│   ├── index.ts              # Express server + graceful shutdown
│   ├── queues/
│   │   └── index.ts          # BullMQ queue definitions
│   ├── workers/
│   │   ├── index.ts          # Worker orchestration
│   │   ├── whatsapp.ts       # WhatsApp message sender
│   │   ├── sms.ts            # SMS sender
│   │   ├── voice.ts          # Ringless voice sender
│   │   ├── scraping.ts       # Web scraper (future)
│   │   └── hunt.ts           # Hunt orchestrator
│   └── routes/
│       ├── index.ts          # Route aggregator
│       ├── whatsapp.routes.ts # WhatsApp endpoints
│       ├── phone.routes.ts    # SMS + voice endpoints
│       ├── hunt.routes.ts     # Hunt endpoints
│       └── jobs.routes.ts     # Job monitoring
├── package.json
├── tsconfig.json
├── .env.example
├── ARCHITECTURE.md           # This file
└── GRACEFUL-SHUTDOWN.md      # Shutdown documentation
```

## Queue & Worker System

### How It Works

1. **API Request** → Route handler
2. **Route Handler** → Adds job to queue (Redis)
3. **Worker** → Picks up job from queue
4. **Worker** → Processes job (sends message, etc.)
5. **Worker** → Updates job status (success/failure)

### Queue Names

- `whatsapp` - WhatsApp text messages
- `sms` - SMS text messages
- `voice` - Ringless voice messages
- `scraping` - Web scraping (future use)
- `hunt` - Automated hunt orchestration

### Job Flow Example

```typescript
// 1. Web app calls worker API
await executeHunt({
  huntId: "hunt_123",
  accountId: "acc_456",
  contacts: [
    {
      adId: "ad_789",
      recipientPhone: "+33612345678",
      channel: "whatsapp_text",
      message: "Bonjour...",
      senderPhone: "+33601020304"
    }
  ]
});

// 2. Route adds job to hunt queue
const job = await huntQueue.add("execute-hunt", data);

// 3. Hunt worker picks up job
export async function huntWorker(job: Job<HuntJob>) {
  // 4. Dispatches to individual channel queues
  for (const contact of contacts) {
    if (contact.channel === "whatsapp_text") {
      await whatsappQueue.add("send-text", {
        recipientPhone: contact.recipientPhone,
        senderPhone: contact.senderPhone,
        message: contact.message
      });
    }
    // ... other channels
  }
}

// 5. WhatsApp worker sends message
export async function whatsappWorker(job: Job<WhatsAppJob>) {
  // Send via Baileys
  await sock.sendMessage(recipientPhone, { text: message });
}
```

## API Routes

### WhatsApp Routes (`/api/whatsapp/*`)

- `POST /api/whatsapp/text` - Send WhatsApp text message
- `POST /api/whatsapp/audio` - (Future) Send audio
- `POST /api/whatsapp/video` - (Future) Send video

### Phone Routes (`/api/phone/*`)

- `POST /api/phone/sms` - Send SMS
- `POST /api/phone/ringless-voice` - Send ringless voice message

### Hunt Routes (`/api/hunt/*`)

- `POST /api/hunt/execute` - Execute a hunt (bulk messaging)
- `GET /api/hunt/status/:jobId` - Get hunt execution status

### Job Monitoring (`/api/jobs/*` & `/api/queues/*`)

- `GET /api/jobs/:queue/:jobId` - Get job status
- `GET /api/queues/stats` - Get all queue statistics
- `GET /api/queues/:queue/stats` - Get specific queue stats

## Channel Types

Auto-Prospect uses three communication channels:

### 1. WhatsApp (`whatsapp_text`)

- **Implementation**: Baileys (WhatsApp Web API)
- **Requires**: Sender phone number (WhatsApp Business account)
- **Session**: Persistent connection stored in database
- **Future**: Audio, video, documents

### 2. SMS (`sms`)

- **Implementation**: Provider API (Twilio, Vonage, etc.)
- **Requires**: SMS provider configuration
- **Limits**: 160 characters per message (longer = multiple SMS)

### 3. Ringless Voice (`ringless_voice`)

- **Implementation**: Provider API
- **Requires**: Voice provider configuration
- **Options**: Text-to-speech OR pre-recorded audio file

## Hunt System

A "hunt" is Auto-Prospect's core feature:

### What is a Hunt?

1. User configures search criteria (location, category, keywords, etc.)
2. Robot scrapes ads matching criteria (LeBonCoin, etc.)
3. Ads are allocated to channels based on:
   - Channel priority (user preference)
   - Available credits per channel
   - Daily pacing limits
4. Worker sends messages to ad owners
5. Leads are created in CRM pipeline

### Hunt Flow

```
Web App (runDailyHunts)
  ↓
Fetch matching ads
  ↓
Allocate ads to channels (priority + credits + limits)
  ↓
Call Worker API: executeHunt()
  ↓
Worker: Hunt Queue
  ↓
Hunt Worker: Dispatch to channel queues
  ↓
Channel Workers: Send actual messages
  ↓
Update database (messages, leads, credits)
```

### Why "Hunt" instead of "Bulk"?

- Matches the app's domain language
- Users understand "hunt" as "search for prospects"
- "Bulk" is too generic and doesn't convey the automation aspect

## Authentication

All worker API routes require Bearer token authentication:

```typescript
headers: {
  "Authorization": "Bearer <WORKER_API_SECRET>"
}
```

- Token is configured via `API_SECRET` environment variable
- Web app uses `WORKER_API_SECRET` (same value)
- Middleware validates token before processing requests
- Health check endpoint (`/health`) is public (no auth)

## Environment Variables

### Required

- `PORT` - HTTP server port (default: 3001)
- `REDIS_URL` - Redis connection string (for BullMQ)
- `API_SECRET` - Bearer token for authentication
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key (bypass RLS)

### Optional

- SMS provider credentials (Twilio, Vonage, etc.)
- Voice provider credentials
- Other provider-specific config

## Error Handling & Retries

### Job Retries

All channel jobs (WhatsApp, SMS, Voice) are configured with:

```typescript
{
  attempts: 3,  // Retry up to 3 times
  backoff: {
    type: "exponential",
    delay: 2000,  // Start with 2s, doubles each retry (2s, 4s, 8s)
  }
}
```

### Failure Handling

- **Individual failures** don't block other jobs
- Failed jobs remain in Redis (can be inspected/retried)
- Hunt worker tracks successes vs failures
- Web app receives detailed results

### Graceful Shutdown

On `SIGTERM` or `SIGINT`:

1. Stop accepting new HTTP requests
2. Stop accepting new jobs from queues
3. Wait for active jobs to complete
4. Close Redis connections
5. Exit cleanly

See [GRACEFUL-SHUTDOWN.md](./GRACEFUL-SHUTDOWN.md) for details.

## Deployment

### Local Development

```bash
# Install Redis
brew install redis
brew services start redis

# Configure environment
cp .env.example .env
# Edit .env with your values

# Run worker
pnpm dev:worker
```

### Railway (Production)

1. Deploy from GitHub
2. Set Root Directory: `apps/worker`
3. Watch Paths: `/apps/worker/**`, `/packages/**`
4. Add Redis service
5. Environment variables:
   - `REDIS_URL=${{Redis.REDIS_URL}}`
   - `API_SECRET=<your-secret>`
   - `SUPABASE_URL=<your-url>`
   - `SUPABASE_SERVICE_KEY=<your-key>`
   - `PORT=3000`

### Vercel (Web App Config)

Add environment variables:

- `WORKER_API_URL=https://your-worker.up.railway.app`
- `WORKER_API_SECRET=<same-as-worker-api-secret>`

## Monitoring

### Queue Stats

```bash
# Get all queue statistics
GET /api/queues/stats

# Get specific queue stats
GET /api/queues/whatsapp/stats
```

Returns:

```json
{
  "name": "whatsapp",
  "waiting": 5,    // Jobs waiting to be processed
  "active": 2,     // Jobs currently being processed
  "completed": 1234, // Successfully completed jobs
  "failed": 12,    // Failed jobs
  "delayed": 0     // Jobs scheduled for later
}
```

### Job Status

```bash
# Get job status
GET /api/jobs/whatsapp/job_123456
```

Returns job state, progress, errors, timestamps.

## Future Enhancements

### WhatsApp

- [ ] Audio messages
- [ ] Video messages
- [ ] Document sharing
- [ ] Media messages (images)
- [ ] Message templates
- [ ] Interactive buttons

### Infrastructure

- [ ] Bull Board UI (web interface for queues)
- [ ] Metrics (Prometheus + Grafana)
- [ ] Alerting (failed job notifications)
- [ ] Rate limiting per channel
- [ ] Job prioritization

### Features

- [ ] Scheduled messaging (send at specific time)
- [ ] A/B testing (multiple message versions)
- [ ] Smart throttling (adapt to provider limits)
- [ ] Webhook callbacks (notify web app of events)

## Troubleshooting

### Worker won't start

- Check Redis is running: `redis-cli ping`
- Verify environment variables are set
- Check logs for connection errors

### Jobs stuck in queue

- Check worker logs for errors
- Inspect job details: `GET /api/jobs/:queue/:jobId`
- Verify database connectivity

### WhatsApp messages not sending

- Confirm Baileys connection is active
- Check WhatsApp account is not banned
- Verify auth state in database
- Check for rate limiting

### High queue backlog

- Scale worker instances (Railway)
- Check for slow jobs (inspect logs)
- Verify external providers are responding
- Consider increasing worker concurrency

## Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- [Railway Deployment](https://docs.railway.com/)
- [Express.js](https://expressjs.com/)
