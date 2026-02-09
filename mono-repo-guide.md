# Guide complet : Migrer vers un monorepo Turborepo + déployer le worker sur Railway

## Ce que tu vas avoir à la fin

```
auto-prospect/                          ← ton repo GitHub (le même)
├── apps/
│   ├── web/                            ← ton app Next.js actuelle → Vercel
│   └── worker/                         ← serveur Express → Railway
├── packages/
│   ├── shared/                         ← types, constantes, Zod schemas
│   └── db/                             ← Drizzle schemas, config Supabase, migrations
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

**Avantages :**
- Un seul repo, un seul `git push`
- Types partagés — pas de duplication
- Drizzle + Supabase dans un package commun
- `import { accounts } from "@auto-prospect/db"` dans les deux apps

---

## PARTIE 1 : PRÉPARER LE MONOREPO

### Étape 1.1 — Sauvegarder ton repo actuel

Avant toute modification, crée une branche de backup :

```bash
cd auto-prospect
git checkout -b backup-before-monorepo
git push origin backup-before-monorepo
git checkout main
```

Si quelque chose se passe mal, tu pourras toujours revenir à cette branche.

---

### Étape 1.2 — Créer la structure de dossiers

Depuis la racine de ton repo `auto-prospect` :

```bash
mkdir -p apps/web
mkdir -p apps/worker/src/queues
mkdir -p apps/worker/src/workers
mkdir -p apps/worker/src/routes
mkdir -p packages/shared/src
mkdir -p packages/db/src
```

---

### Étape 1.3 — Déplacer ton app Next.js dans apps/web

Tu vas déplacer **tout** le contenu actuel de ton projet dans `apps/web/`.

```bash
# Fichiers de config Next.js
mv next.config.* apps/web/ 2>/dev/null
mv next-env.d.ts apps/web/ 2>/dev/null
mv postcss.config.* apps/web/ 2>/dev/null
mv tailwind.config.* apps/web/ 2>/dev/null
mv components.json apps/web/ 2>/dev/null

# Le dossier src (ton code)
mv src apps/web/

# Config TypeScript
mv tsconfig.json apps/web/

# Variables d'environnement
mv .env* apps/web/ 2>/dev/null

# Dossier public
mv public apps/web/ 2>/dev/null

# Scripts de DB
mv scripts apps/web/ 2>/dev/null

# Config ESLint / Prettier
mv eslint.config.* apps/web/ 2>/dev/null
mv .prettierrc* apps/web/ 2>/dev/null

# Config Drizzle
mv drizzle.config.* apps/web/ 2>/dev/null
```

**⚠️ IMPORTANT : ne déplace PAS ces fichiers (ils restent à la racine) :**
- `.git/`
- `.gitignore`
- `node_modules/` (on le supprimera)
- `pnpm-lock.yaml` (on le régénérera)
- `package.json` (on le remplacera)

---

### Étape 1.4 — Extraire les packages partagés

#### 1.4a — Le package `db` (Drizzle + Supabase)

```bash
mv apps/web/src/schema packages/db/src/schema
mv apps/web/src/drizzle packages/db/src/drizzle
mv apps/web/src/supabase packages/db/src/supabase
```

Si tu as un `drizzle.config.ts` :
```bash
mv apps/web/drizzle.config.* packages/db/ 2>/dev/null
```

Les scripts de migration aussi :
```bash
mv apps/web/scripts packages/db/scripts 2>/dev/null
```

#### 1.4b — Le package `shared` (types, constantes)

```bash
# Déplace les types/constantes/enums partagés
mv apps/web/src/types packages/shared/src/types 2>/dev/null
mv apps/web/src/constants packages/shared/src/constants 2>/dev/null
mv apps/web/src/validation packages/shared/src/validation 2>/dev/null
```

**Note :** Tu n'es pas obligé de tout extraire d'un coup. Seuls les fichiers dont le worker a aussi besoin doivent être dans `packages/`. Tu pourras en extraire d'autres plus tard.

---

### Étape 1.5 — Créer les fichiers de configuration

#### 1.5a — `pnpm-workspace.yaml` (à la racine)

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

#### 1.5b — `turbo.json` (à la racine)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    }
  }
}
```

#### 1.5c — `package.json` racine (REMPLACE l'ancien)

```json
{
  "name": "auto-prospect",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",
    "dev:worker": "turbo run dev --filter=worker",
    "build": "turbo run build",
    "build:web": "turbo run build --filter=web",
    "build:worker": "turbo run build --filter=worker",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2"
  }
}
```

#### 1.5d — `.gitignore` racine (ajouter ces lignes si absentes)

```
node_modules
dist
.next
.turbo
.env
.env.local
.env.development.local
```

---

### Étape 1.6 — Configurer le package `db`

#### `packages/db/package.json`

```json
{
  "name": "@auto-prospect/db",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "echo 'no build needed'",
    "db:generate": "drizzle-kit generate",
    "db:migrate-only": "dotenvx run --env-file=../../apps/web/.env.development.local -- tsx scripts/migrate.ts",
    "db:migrate": "drizzle-kit generate && dotenvx run --env-file=../../apps/web/.env.development.local -- tsx scripts/migrate.ts",
    "db:reset": "dotenvx run --env-file=../../apps/web/.env.development.local -- tsx scripts/reset-db.ts",
    "db:seed": "dotenvx run --env-file=../../apps/web/.env.development.local -- tsx scripts/seed.ts",
    "db:fresh": "pnpm db:reset && pnpm db:seed",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "^0.45.1",
    "postgres": "^3.4.8",
    "@supabase/supabase-js": "^2.90.1",
    "@supabase/ssr": "^0.8.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.8",
    "@dotenvx/dotenvx": "^1.51.4",
    "tsx": "^4.21.0"
  }
}
```

#### `packages/db/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"]
}
```

#### `packages/db/src/index.ts`

```typescript
// Réexporte les schémas
export * from "./schema";

// Réexporte les utilitaires Drizzle (client, helpers, etc.)
export * from "./drizzle";

// Réexporte le client Supabase
export * from "./supabase";
```

Adapte ce fichier selon ce que tes dossiers `schema/`, `drizzle/` et `supabase/` exportent réellement.

---

### Étape 1.7 — Configurer le package `shared`

#### `packages/shared/package.json`

```json
{
  "name": "@auto-prospect/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "echo 'no build needed'"
  },
  "dependencies": {
    "zod": "^4.3.5"
  }
}
```

#### `packages/shared/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"]
}
```

#### `packages/shared/src/index.ts`

```typescript
// Réexporte les types
export * from "./types";

// Réexporte les constantes
export * from "./constants";

// Si tu as des schémas Zod de validation partagés :
// export * from "./validation";
```

---

### Étape 1.8 — Le package.json de l'app web

Crée `apps/web/package.json` avec les dépendances front-only :

```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "dotenvx run -- sh -c 'next dev --port ${NEXT_PUBLIC_PORT:-3000}'",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "supabase:start": "npx dotenvx run --env-file=.env --env-file=.env.local --env-file=.env.development --env-file=.env.development.local -- supabase start",
    "db:dump": "docker exec -it supabase_db_auto-prospect pg_dump -U postgres -d postgres --data-only --schema=auth --schema=public > supabase/seed.sql",
    "create-user": "dotenvx run --env-file=.env.development.local -- tsx scripts/create-user.ts"
  },
  "dependencies": {
    "@auto-prospect/db": "workspace:*",
    "@auto-prospect/shared": "workspace:*",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@heroicons/react": "^2.2.0",
    "@hookform/resolvers": "^5.2.2",
    "@next/env": "^16.1.1",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-tabs": "^1.1.13",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "jwt-decode": "^4.0.0",
    "libphonenumber-js": "^1.12.34",
    "lucide-react": "^0.562.0",
    "next": "16.1.1",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-hook-form": "^7.71.1",
    "sharp": "^0.34.5",
    "swr": "^2.4.0",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "@dotenvx/dotenvx": "^1.51.4",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.1",
    "eslint-config-prettier": "^10.1.8",
    "prettier": "^3.8.0",
    "tailwindcss": "^4",
    "tsx": "^4.21.0",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5"
  }
}
```

**Ce qui a changé par rapport à ton ancien package.json :**
- `"name"` → `"web"` (au lieu de `"auto-prospect"`)
- Ajout de `@auto-prospect/db` et `@auto-prospect/shared` dans les dépendances
- **Retiré** (migré vers `packages/db`) : `drizzle-orm`, `postgres`, `@supabase/supabase-js`, `@supabase/ssr`, `drizzle-kit`
- **Retiré** (migré vers `packages/shared`) : `zod`
- **Retiré** (migré vers `apps/worker`) : `@whiskeysockets/baileys`, `@hapi/boom`, `qrcode`, `@types/qrcode`
- **Retiré** les scripts `db:*` (maintenant dans `packages/db`)

---

### Étape 1.9 — Mettre à jour les imports dans l'app web

Partout dans `apps/web/src/` où tu importais depuis les dossiers déplacés :

```typescript
// ❌ Avant
import { accounts } from "@/schema/accounts";
import { createDrizzleSupabaseClient } from "@/drizzle/client";
import { EWhatsAppErrorCode } from "@/types/whatsapp";

// ✅ Après
import { accounts, createDrizzleSupabaseClient } from "@auto-prospect/db";
import { EWhatsAppErrorCode } from "@auto-prospect/shared";
```

**Astuce VS Code :** `Ctrl+Shift+H` pour chercher/remplacer en masse :
- `from "@/schema/` → imports depuis `@auto-prospect/db`
- `from "@/drizzle/` → imports depuis `@auto-prospect/db`
- `from "@/supabase/` → imports depuis `@auto-prospect/db`
- `from "@/types/` → imports depuis `@auto-prospect/shared`
- `from "@/constants/` → imports depuis `@auto-prospect/shared`

**Note :** Tu n'es pas obligé de tout migrer d'un coup. Les fichiers qui ne sont utilisés QUE par le web peuvent rester dans `apps/web/src/`.

---

### Étape 1.10 — Vérifier le tsconfig de l'app web

Dans `apps/web/tsconfig.json`, vérifie que le path alias pointe bien :

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## PARTIE 2 : CRÉER LE WORKER

### Étape 2.1 — `apps/worker/package.json`

```json
{
  "name": "worker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "echo 'no build needed - tsx runs ts directly'",
    "start": "tsx src/index.ts"
  },
  "dependencies": {
    "@auto-prospect/db": "workspace:*",
    "@auto-prospect/shared": "workspace:*",
    "@whiskeysockets/baileys": "7.0.0-rc.9",
    "@hapi/boom": "^10.0.1",
    "qrcode": "^1.5.4",
    "libphonenumber-js": "^1.12.34",
    "express": "^5.1.0",
    "bullmq": "^5.0.0",
    "ioredis": "^5.4.0",
    "node-cron": "^3.0.0",
    "dotenv": "^16.4.0",
    "cors": "^2.8.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.0",
    "@types/qrcode": "^1.5.6",
    "tsx": "^4.21.0"
  }
}
```

**Ce qu'il contient :**
- `@whiskeysockets/baileys`, `@hapi/boom`, `qrcode` → la logique WhatsApp qui était dans le web
- `libphonenumber-js` → validation des numéros (utilisé par WhatsApp et potentiellement SMS/Voice)
- `bullmq`, `ioredis` → système de queues
- `express`, `cors`, `dotenv` → serveur HTTP
- `node-cron` → crons

### Étape 2.2 — `apps/worker/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

### Étape 2.3 — Le code du worker

Réfère-toi au premier guide pour le contenu de ces fichiers :

- `apps/worker/src/index.ts` → point d'entrée Express
- `apps/worker/src/queues/index.ts` → définition des queues BullMQ
- `apps/worker/src/workers/index.ts` → workers
- `apps/worker/src/routes/index.ts` → routes API

Le worker peut maintenant importer depuis les packages partagés :

```typescript
// apps/worker/src/workers/whatsapp.ts
import { accounts, createDrizzleSupabaseClient } from "@auto-prospect/db";
import { EWhatsAppErrorCode } from "@auto-prospect/shared";

// Ta logique Baileys ici — avec accès aux mêmes types et DB que le web
```

### Étape 2.4 — `apps/worker/.env` (local uniquement)

```env
PORT=3001
REDIS_URL=redis://localhost:6379
API_SECRET=ton-secret-ici
SUPABASE_URL=ta-supabase-url
SUPABASE_SERVICE_KEY=ta-supabase-service-key
```

Port `3001` pour ne pas conflit avec le web sur `3000`.

---

## PARTIE 3 : INSTALLER ET TESTER

### Étape 3.1 — Nettoyer et réinstaller

Depuis la racine :

```bash
# Supprimer les anciens node_modules et lock file
rm -rf node_modules
rm -rf apps/web/node_modules
rm pnpm-lock.yaml

# Installer turbo à la racine
pnpm add -D turbo

# Installer toutes les dépendances du workspace
pnpm install
```

### Étape 3.2 — Vérifier que l'app web fonctionne

```bash
pnpm dev:web
```

**Erreurs fréquentes et solutions :**

| Erreur | Solution |
|--------|----------|
| `Cannot find module '@auto-prospect/db'` | Vérifie que `packages/db/package.json` a `"name": "@auto-prospect/db"` et `"main": "./src/index.ts"` |
| `Cannot find module '@/schema/...'` | Import pas encore mis à jour → remplace par `@auto-prospect/db` |
| `Cannot resolve 'drizzle-orm'` | `drizzle-orm` doit être dans `packages/db/package.json` → relance `pnpm install` |
| `Cannot resolve 'zod'` | `zod` doit être dans `packages/shared/package.json` → relance `pnpm install` |

### Étape 3.3 — Vérifier que le worker fonctionne

```bash
pnpm dev:worker
```

Tu devrais voir :
```
Worker server running on port 3001
All workers started
```

### Étape 3.4 — Lancer les deux en même temps

```bash
pnpm dev
```

Turborepo lance les deux apps en parallèle avec les logs préfixés.

---

## PARTIE 4 : DÉPLOYER

### Étape 4.1 — Pousser sur GitHub

```bash
git add .
git commit -m "Migrate to Turborepo monorepo"
git push origin main
```

### Étape 4.2 — Vercel (app web)

1. Va sur **vercel.com** > ton projet
2. **Settings** > **General**
3. **Root Directory** : `apps/web`
4. **Build Command** : auto-détecté (ou `cd ../.. && pnpm turbo build --filter=web`)
5. **Install Command** : `pnpm install`

Ajoute les variables d'environnement :
- `WORKER_API_URL` → `https://ton-worker.up.railway.app`
- `WORKER_API_SECRET` → ton secret

### Étape 4.3 — Railway (worker)

1. Va sur **https://railway.com/new**
2. **Deploy from GitHub repo** → sélectionne **auto-prospect**
3. Railway détecte le monorepo

**Configurer le service :**

4. Clique sur le service > **Settings**
5. **Root Directory** : `apps/worker`
6. **Watch Paths** (un par ligne) :
   ```
   /apps/worker/**
   /packages/**
   ```
7. **Start Command** : `pnpm start`

**Ajouter Redis :**

8. Sur le canvas, **+ New** > **Redis**

**Variables d'environnement :**

9. Service worker > **Variables** :
   - `REDIS_URL` → `${{Redis.REDIS_URL}}`
   - `API_SECRET` → ton secret
   - `SUPABASE_URL` → ton URL Supabase
   - `SUPABASE_SERVICE_KEY` → ta clé service
   - `PORT` → `3000`

**Domaine :**

10. **Settings** > **Networking** > **Generate Domain**
11. Note l'URL → mets-la dans `WORKER_API_URL` sur Vercel

---

## PARTIE 5 : LE CLIENT HTTP (côté web)

Crée `apps/web/src/lib/worker-client.ts` :

```typescript
const WORKER_URL = process.env.WORKER_API_URL;
const WORKER_SECRET = process.env.WORKER_API_SECRET;

const workerFetch = async (path: string, body: unknown) => {
  const response = await fetch(`${WORKER_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WORKER_SECRET}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Worker API error: ${response.status}`);
  }

  return response.json();
};

export const sendWhatsAppMessage = (data: {
  recipientPhone: string;
  senderPhone: string;
  message: string;
}) => workerFetch("/api/whatsapp/send", data);

export const makeVoiceCall = (data: unknown) =>
  workerFetch("/api/voice/call", data);

export const sendSms = (data: unknown) =>
  workerFetch("/api/sms/send", data);

export const startScraping = (data: unknown) =>
  workerFetch("/api/scraping/start", data);

export const bulkWhatsApp = (prospects: unknown[]) =>
  workerFetch("/api/bulk/whatsapp", { prospects });

export const getJobStatus = async (queue: string, jobId: string) => {
  const response = await fetch(
    `${WORKER_URL}/api/jobs/${queue}/${jobId}`,
    { headers: { Authorization: `Bearer ${WORKER_SECRET}` } },
  );
  return response.json();
};

export const getQueuesStats = async () => {
  const response = await fetch(`${WORKER_URL}/api/queues/stats`, {
    headers: { Authorization: `Bearer ${WORKER_SECRET}` },
  });
  return response.json();
};
```

---

## Résumé : répartition des dépendances

### `packages/db/` (base de données)
| Package | Version |
|---------|---------|
| drizzle-orm | ^0.45.1 |
| postgres | ^3.4.8 |
| @supabase/supabase-js | ^2.90.1 |
| @supabase/ssr | ^0.8.0 |
| drizzle-kit (dev) | ^0.31.8 |

### `packages/shared/` (types, validation)
| Package | Version |
|---------|---------|
| zod | ^4.3.5 |

### `apps/web/` (frontend Next.js)
| Catégorie | Packages |
|-----------|----------|
| Framework | next, react, react-dom |
| UI | tous les @radix-ui/*, lucide-react, @heroicons/react |
| Styling | tailwindcss, tailwind-merge, clsx, class-variance-authority, tw-animate-css |
| Forms | react-hook-form, @hookform/resolvers |
| DnD | @dnd-kit/* |
| Data fetching | swr |
| Utils | date-fns, jwt-decode, sharp |
| Dev | eslint, prettier, typescript, @types/react* |

### `apps/worker/` (background jobs)
| Catégorie | Packages |
|-----------|----------|
| WhatsApp | @whiskeysockets/baileys, @hapi/boom, qrcode |
| Queues | bullmq, ioredis |
| Serveur | express, cors, dotenv |
| Crons | node-cron |
| Utils | libphonenumber-js |
| Dev | typescript, tsx, @types/* |

---

## Structure finale

```
auto-prospect/
├── apps/
│   ├── web/                          ← Next.js → Vercel
│   │   ├── src/
│   │   │   ├── app/                  ← Pages & routes
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   │   └── worker-client.ts
│   │   │   └── ...
│   │   ├── .env.local
│   │   ├── .env.development.local
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   │
│   └── worker/                       ← Express → Railway
│       ├── src/
│       │   ├── index.ts
│       │   ├── queues/
│       │   ├── workers/
│       │   └── routes/
│       ├── .env
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── db/                           ← Drizzle + Supabase
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   ├── drizzle/
│   │   │   ├── supabase/
│   │   │   └── index.ts
│   │   ├── scripts/                  ← migrate.ts, seed.ts, etc.
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                       ← Types, constantes, Zod
│       ├── src/
│       │   ├── types/
│       │   ├── constants/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── .gitignore
```

---

## Commandes utiles

```bash
# Dev
pnpm dev                # Lance web + worker en parallèle
pnpm dev:web            # Lance uniquement le web
pnpm dev:worker         # Lance uniquement le worker

# Build
pnpm build              # Build tout
pnpm build:web          # Build uniquement le web

# Base de données (depuis la racine)
pnpm --filter @auto-prospect/db db:generate
pnpm --filter @auto-prospect/db db:migrate
pnpm --filter @auto-prospect/db db:push
pnpm --filter @auto-prospect/db db:studio
pnpm --filter @auto-prospect/db db:fresh

# Ajouter une dépendance
pnpm --filter web add nom-du-package            # à l'app web
pnpm --filter worker add nom-du-package          # au worker
pnpm --filter @auto-prospect/db add nom-du-package    # au package db
pnpm --filter @auto-prospect/shared add nom-du-package # au package shared

# Déployer (automatique)
git add . && git commit -m "message" && git push
```

---

## Sources

- Turborepo docs : https://turbo.build/repo/docs
- pnpm workspaces : https://pnpm.io/workspaces
- Railway monorepo : https://docs.railway.com/guides/monorepo
- Railway build config : https://docs.railway.com/guides/build-configuration
- Vercel monorepo : https://vercel.com/docs/monorepos