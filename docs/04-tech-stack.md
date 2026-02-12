# 04 — Tech Stack

Detail teknologi dan arsitektur deployment DuweKu menggunakan ekosistem **Cloudflare**.

---

## 1. Arsitektur Deployment

```
┌─────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                       │
│                                                          │
│  ┌────────────────┐      ┌───────────────────────────┐  │
│  │ CF Pages       │      │ CF Worker (Backend API)    │  │
│  │ ───────────    │      │ ────────────────────────   │  │
│  │ React + Vite   │─────▶│ Hono.js Framework         │  │
│  │ Dashboard SPA  │ API  │ REST API Routes            │  │
│  │ Static Assets  │      │ Telegram Webhook Handler   │  │
│  └────────────────┘      │ AI Orchestration Layer     │  │
│                          └───┬──────┬──────┬──────┬──┘  │
│                              │      │      │      │     │
│                        ┌─────▼─┐ ┌──▼──┐ ┌─▼───┐ │     │
│                        │  D1   │ │ R2  │ │ KV  │ │     │
│                        │SQLite │ │Blob │ │Cache│ │     │
│                        └───────┘ └─────┘ └─────┘ │     │
└────────────────────────────────────────────────────┘     │
         │                           │                     │
         ▼                           ▼                     │
  ┌──────────────┐           ┌──────────────┐             │
  │ Telegram     │           │ Google       │             │
  │ Bot API      │           │ Gemini API   │◀────────────┘
  │ (Webhook)    │           │ (User BYOK)  │
  └──────────────┘           └──────────────┘
```

---

## 2. Stack Detail

### Frontend (Cloudflare Pages)

| Item | Pilihan | Justifikasi |
|------|---------|-------------|
| **Framework** | React 19 + Vite | Fast HMR, modern, ecosystem besar |
| **Routing** | React Router v7 | SPA routing |
| **State** | TanStack Query (React Query) | Server state caching, auto-refetch |
| **UI Components** | Shadcn/ui + Radix UI | Accessible, customizable, modern |
| **Styling** | Tailwind CSS v4 | Utility-first, rapid development |
| **Charts** | Recharts | React-native charts, responsive |
| **Icons** | Lucide React | Consistent, lightweight |
| **Forms** | React Hook Form + Zod | Validation, type-safe |
| **Build Output** | Static SPA → CF Pages | Edge-served CDN, unlimited bandwidth free |

### Backend (Cloudflare Worker)

| Item | Pilihan | Justifikasi |
|------|---------|-------------|
| **Runtime** | Cloudflare Workers | Serverless edge, 0ms cold start |
| **Framework** | Hono.js | Lightweight, edge-native, middleware system |
| **ORM** | Drizzle ORM | Type-safe, D1-compatible, lightweight |
| **Auth** | JWT (jose library) | Stateless, edge-compatible |
| **Validation** | Zod | Schema validation, shared with frontend |
| **Excel Export** | SheetJS (xlsx) | Generate .xlsx di Worker |
| **Telegram Bot** | Grammy atau hono-telegram | Webhook handler, inline keyboards |
| **Encryption** | Web Crypto API | Native di Workers, AES-256-GCM untuk API keys |

### Database & Storage

| Service | Fungsi | Keterangan |
|---------|--------|------------|
| **Cloudflare D1** | Database utama (SQLite) | Relational, ACID, edge-native, 5GB free |
| **Cloudflare R2** | Object storage | Gambar struk, export files, avatars. No egress fees |
| **Cloudflare KV** | Key-Value cache (opsional) | Rate limit counter, session cache |

### External Services

| Service | Fungsi | Model |
|---------|--------|-------|
| **Google Gemini API** | NLP parsing + OCR gambar | BYOK (user bawa key sendiri) |
| **Telegram Bot API** | Chat interface (input transaksi) | Webhook mode |

---

## 3. Kenapa Cloudflare Stack?

| Kriteria | Cloudflare | Alternatif (VPS/Supabase) |
|----------|------------|--------------------------|
| **Biaya awal** | $0 (free tier sangat generous) | $5-20/bulan |
| **Cold start** | 0ms (edge) | 50-500ms (serverless) |
| **Global latency** | <50ms worldwide | Satu region |
| **Maintenance** | Zero (serverless) | Perlu manage server |
| **Scaling** | Auto (pay-per-use) | Manual scaling |
| **Egress** | R2: $0 egress | S3: $0.09/GB |
| **Database** | D1: SQLite edge-native | PostgreSQL (heavier) |

---

## 4. Project Structure

```
duweku/
├── docs/                          ← Dokumentasi (anda di sini)
│
├── worker/                        ← Cloudflare Worker (Backend)
│   ├── src/
│   │   ├── index.ts               ← Entry point, Hono app
│   │   ├── middleware/
│   │   │   ├── auth.ts            ← JWT verification
│   │   │   └── cors.ts            ← CORS handler
│   │   ├── routes/
│   │   │   ├── auth.ts            ← Register, login, me
│   │   │   ├── workspaces.ts      ← CRUD workspace
│   │   │   ├── accounts.ts        ← CRUD akun keuangan
│   │   │   ├── categories.ts      ← CRUD kategori
│   │   │   ├── transactions.ts    ← CRUD transaksi
│   │   │   ├── settings.ts        ← API key, telegram link
│   │   │   ├── team.ts            ← Invite/join tim (keluarga, perusahaan, komunitas)
│   │   │   ├── stats.ts           ← Dashboard aggregates
│   │   │   ├── export.ts          ← Excel generation
│   │   │   ├── admin.ts           ← 🛡️ Super Admin routes
│   │   │   ├── plans.ts           ← Paket langganan
│   │   │   └── telegram.ts        ← Telegram webhook handler
│   │   ├── services/
│   │   │   ├── ai-service.ts      ← Gemini API orchestration
│   │   │   ├── telegram-service.ts ← Bot message handling
│   │   │   ├── transaction-service.ts ← Business logic
│   │   │   └── crypto-service.ts  ← API key encryption
│   │   ├── db/
│   │   │   ├── schema.ts          ← Drizzle schema definitions
│   │   │   └── migrations/        ← D1 migrations
│   │   └── types/
│   │       └── index.ts           ← TypeScript interfaces
│   ├── wrangler.toml               ← Worker config (D1, R2 bindings)
│   ├── package.json
│   └── tsconfig.json
│
├── web/                            ← Cloudflare Pages (Frontend)
│   ├── src/
│   │   ├── main.tsx                ← React entry
│   │   ├── App.tsx                 ← Router setup
│   │   ├── components/
│   │   │   ├── ui/                 ← Shadcn components
│   │   │   ├── layout/             ← Sidebar, Navbar, BottomNav
│   │   │   ├── dashboard/          ← Stats cards, charts
│   │   │   ├── transactions/       ← Transaction list, filters
│   │   │   └── settings/           ← API key, Telegram setup
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Transactions.tsx
│   │   │   ├── Accounts.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   ├── Plans.tsx           ← Pilih paket (BYOK / Pro)
│   │   │   └── admin/              ← 🛡️ Super Admin pages
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── AdminUsers.tsx
│   │   │       └── AdminSettings.tsx
│   │   ├── hooks/                  ← Custom React hooks
│   │   ├── lib/
│   │   │   ├── api.ts              ← API client (fetch wrapper)
│   │   │   └── utils.ts            ← Formatters, helpers
│   │   └── styles/
│   │       └── globals.css         ← Tailwind + custom styles
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
└── package.json                    ← Root monorepo (optional)
```

---

## 5. Wrangler Config (Worker)

```toml
# wrangler.toml
name = "duweku-api"
main = "src/index.ts"
compatibility_date = "2026-02-01"

[[d1_databases]]
binding = "DB"
database_name = "duweku-db"
database_id = "<auto-generated>"

[[r2_buckets]]
binding = "R2"
bucket_name = "duweku-storage"

# [vars]
# TELEGRAM_BOT_TOKEN = "" ← set via wrangler secret
# GEMINI_API_KEY = ""     ← global key untuk paket AI Included
# ENCRYPTION_SECRET = ""  ← untuk encrypt/decrypt BYOK keys

# Optional KV for caching
# [[kv_namespaces]]
# binding = "KV"
# id = "<auto-generated>"
```

---

## 6. Key Dependencies

### Worker (Backend)

```json
{
  "dependencies": {
    "hono": "^4.x",
    "drizzle-orm": "^0.36.x",
    "@google/generative-ai": "^0.x",
    "grammy": "^1.x",
    "jose": "^5.x",
    "zod": "^3.x",
    "xlsx": "^0.18.x",
    "uuid": "^9.x"
  }
}
```

### Web (Frontend)

```json
{
  "dependencies": {
    "react": "^19.x",
    "react-dom": "^19.x",
    "react-router": "^7.x",
    "@tanstack/react-query": "^5.x",
    "recharts": "^2.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "lucide-react": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  }
}
```
