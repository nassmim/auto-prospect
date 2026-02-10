# Auto-Prospect Worker

Background job processor for Auto-Prospect messaging operations.

## Quick Start

### Prerequisites

- Node.js 20+
- Redis (for BullMQ queues)
- pnpm

### Local Development

```bash
# Install Redis (macOS)
brew install redis
brew services start redis

# Configure environment
cp .env.example .env
# Edit .env with your values

# Install dependencies (from monorepo root)
pnpm install

# Run worker
pnpm dev:worker
```

### Environment Variables

Copy `.env.example` and fill in:

```env
PORT=3001
REDIS_URL=redis://localhost:6379
API_SECRET=<generate-with-node-crypto>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_KEY=<your-service-key>
```

Generate API_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## What It Does

The worker processes background jobs:

- **WhatsApp** - Send text messages via Baileys (WhatsApp Web API)
- **SMS** - Send SMS messages via provider (Twilio, Vonage, etc.)
- **Voice** - Send ringless voice messages
- **Hunt** - Execute automated prospect outreach campaigns

## Architecture

```
Web App → Worker API → Queue → Worker → External Service
                        ↓         ↓
                     Redis    Database
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details.

## API Endpoints

### WhatsApp
- `POST /api/whatsapp/text` - Send text message

### Phone
- `POST /api/phone/sms` - Send SMS
- `POST /api/phone/ringless-voice` - Send voice message

### Hunt
- `POST /api/hunt/execute` - Execute hunt (bulk messaging)
- `GET /api/hunt/status/:jobId` - Get hunt status

### Monitoring
- `GET /api/jobs/:queue/:jobId` - Get job status
- `GET /api/queues/stats` - Get all queue stats

All endpoints require `Authorization: Bearer <API_SECRET>` header.

## Directory Structure

```
src/
├── index.ts          # Express server
├── queues/           # BullMQ queue definitions
├── workers/          # Job processors
│   ├── whatsapp.ts   # WhatsApp messaging
│   ├── sms.ts        # SMS messaging
│   ├── voice.ts      # Voice messaging
│   ├── hunt.ts       # Hunt orchestration
│   └── scraping.ts   # Web scraping (future)
└── routes/           # API endpoints
    ├── whatsapp.routes.ts
    ├── phone.routes.ts
    ├── hunt.routes.ts
    └── jobs.routes.ts
```

## Deployment

### Railway (Recommended)

1. Connect GitHub repository
2. Set Root Directory: `apps/worker`
3. Watch Paths: `/apps/worker/**`, `/packages/**`
4. Add Redis service
5. Configure environment variables
6. Deploy

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed deployment guide.

## Development

### Adding a New Worker

1. Create file in `src/workers/` (e.g., `email.ts`)
2. Define job interface and worker function
3. Add queue in `src/queues/index.ts`
4. Register worker in `src/workers/index.ts`
5. Create routes in `src/routes/` (e.g., `email.routes.ts`)
6. Update `src/routes/index.ts` to mount routes

### Testing a Route

```bash
curl -X POST http://localhost:3001/api/whatsapp/text \
  -H "Authorization: Bearer <your-api-secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientPhone": "+33612345678",
    "senderPhone": "+33601020304",
    "message": "Test message"
  }'
```

### Monitoring Queues

```bash
# Get all queue stats
curl http://localhost:3001/api/queues/stats \
  -H "Authorization: Bearer <your-api-secret>"

# Get specific job status
curl http://localhost:3001/api/jobs/whatsapp/job_123 \
  -H "Authorization: Bearer <your-api-secret>"
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Full system architecture
- [GRACEFUL-SHUTDOWN.md](./GRACEFUL-SHUTDOWN.md) - Shutdown behavior
- [../../WORKER-REFACTORING-SUMMARY.md](../../WORKER-REFACTORING-SUMMARY.md) - Recent changes

## Troubleshooting

### Worker won't start

- Check Redis: `redis-cli ping` (should return PONG)
- Verify `.env` file exists and has all required variables
- Check logs for connection errors

### Jobs not processing

- Verify worker is running: `pnpm dev:worker`
- Check queue stats: `GET /api/queues/stats`
- Inspect job: `GET /api/jobs/:queue/:jobId`
- Check worker logs for errors

### WhatsApp not working

- Verify Baileys implementation is complete
- Check WhatsApp account connection status
- Review logs for Baileys errors

## Support

- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Review inline documentation in source files
- Check [BullMQ docs](https://docs.bullmq.io/) for queue issues
- Check [Baileys docs](https://github.com/WhiskeySockets/Baileys) for WhatsApp issues
