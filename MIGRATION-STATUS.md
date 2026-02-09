# Migration Status - Monorepo with Worker

## ✅ Completed (PARTIE 2)

### Worker Setup
- ✅ Created `apps/worker/package.json` with all necessary dependencies (using dotenvx)
- ✅ Created `apps/worker/tsconfig.json`
- ✅ Created `apps/worker/src/index.ts` - Express server with auth middleware (using dotenvx)
- ✅ Created `apps/worker/src/queues/index.ts` - BullMQ queue definitions
- ✅ Created `apps/worker/src/workers/index.ts` - Worker orchestration
- ✅ Created individual workers:
  - `apps/worker/src/workers/whatsapp.ts` (with Baileys placeholder)
  - `apps/worker/src/workers/sms.ts`
  - `apps/worker/src/workers/voice.ts`
  - `apps/worker/src/workers/scraping.ts`
  - `apps/worker/src/workers/bulk.ts`
- ✅ Created `apps/worker/src/routes/index.ts` - API routes for all services
- ✅ Created `apps/worker/.env.example`

### Worker Client (Web App)
- ✅ Created `apps/web/src/lib/worker-client.ts` - Client to communicate with worker API
- ✅ Updated `apps/web/.env.example` with worker configuration

### Package Configuration
- ✅ Installed all dependencies (`pnpm install`)
- ✅ Added `build:web` and `build:worker` scripts to root `package.json`

## 📋 Next Steps (PARTIE 3 & 4)

### Testing
1. Test the web app runs:
   ```bash
   pnpm dev:web
   ```

2. Set up Redis locally (required for worker):
   ```bash
   # macOS (using Homebrew)
   brew install redis
   brew services start redis

   # Or using Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

3. Create `apps/worker/.env` (copy from `.env.example` and fill in values):
   ```env
   PORT=3001
   REDIS_URL=redis://localhost:6379
   API_SECRET=your-secret-here
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_KEY=your-supabase-service-key
   ```

4. Test the worker runs:
   ```bash
   pnpm dev:worker
   ```

5. Test both together:
   ```bash
   pnpm dev
   ```

### Deployment (PARTIE 4)

#### GitHub
```bash
git add .
git commit -m "Migrate to Turborepo monorepo with worker"
git push origin main
```

#### Vercel (Web App)
1. Go to vercel.com → your project
2. Settings → General
3. **Root Directory**: `apps/web`
4. **Build Command**: auto-detected (or `cd ../.. && pnpm turbo build --filter=web`)
5. **Install Command**: `pnpm install`
6. Add environment variables:
   - `WORKER_API_URL` → `https://your-worker.up.railway.app`
   - `WORKER_API_SECRET` → your secret

#### Railway (Worker)
1. Go to https://railway.com/new
2. Deploy from GitHub repo → select auto-prospect
3. Service → Settings:
   - **Root Directory**: `apps/worker`
   - **Watch Paths**:
     ```
     /apps/worker/**
     /packages/**
     ```
   - **Start Command**: `pnpm start`
4. Add Redis:
   - On canvas, click + New → Redis
5. Environment variables:
   - `REDIS_URL` → `${{Redis.REDIS_URL}}`
   - `API_SECRET` → your secret
   - `SUPABASE_URL` → your Supabase URL
   - `SUPABASE_SERVICE_KEY` → your service key
   - `PORT` → `3000`
6. Settings → Networking → Generate Domain
7. Copy the URL and add it to Vercel as `WORKER_API_URL`

## 🔧 Implementation Notes

### WhatsApp Worker
The WhatsApp worker (`apps/worker/src/workers/whatsapp.ts`) currently has a placeholder implementation. To complete it:

1. Uncomment the imports from `@auto-prospect/db` and `@auto-prospect/shared`
2. Implement the Baileys logic:
   - Get sender account from database
   - Initialize Baileys connection
   - Send message
   - Update message status

### Using the Worker from Web App

```typescript
import { sendWhatsAppMessage, bulkWhatsApp, getJobStatus } from "@/lib/worker-client";

// Send a single message
const result = await sendWhatsAppMessage({
  recipientPhone: "+1234567890",
  senderPhone: "+0987654321",
  message: "Hello from Auto Prospect!"
});

// Send bulk messages
await bulkWhatsApp([
  { phone: "+1111111111", message: "Message 1", senderPhone: "+0987654321" },
  { phone: "+2222222222", message: "Message 2", senderPhone: "+0987654321" },
]);

// Check job status
const status = await getJobStatus("whatsapp", result.jobId);
```

## 📁 Final Structure

```
auto-prospect/
├── apps/
│   ├── web/                          ← Next.js → Vercel
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   └── worker-client.ts  ✅ NEW
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── worker/                       ← Express → Railway ✅ NEW
│       ├── src/
│       │   ├── index.ts              ✅
│       │   ├── queues/               ✅
│       │   ├── workers/              ✅
│       │   └── routes/               ✅
│       ├── .env.example              ✅
│       ├── package.json              ✅
│       └── tsconfig.json             ✅
│
├── packages/
│   ├── db/                           ← Already set up
│   └── shared/                       ← Already set up
│
├── pnpm-workspace.yaml
├── turbo.json
└── package.json                      ✅ Updated with build scripts
```

## ⚙️ Available Commands

```bash
# Development
pnpm dev                # Launch web + worker in parallel
pnpm dev:web            # Launch web only
pnpm dev:worker         # Launch worker only

# Build
pnpm build              # Build everything
pnpm build:web          # Build web only
pnpm build:worker       # Build worker only

# Database (from root)
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm db:fresh

# Add dependencies
pnpm --filter web add package-name
pnpm --filter worker add package-name
pnpm --filter @auto-prospect/db add package-name
pnpm --filter @auto-prospect/shared add package-name
```
