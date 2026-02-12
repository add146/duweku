# 05 — API Endpoints

Spesifikasi lengkap REST API DuweKu yang berjalan di **Cloudflare Worker** dengan **Hono.js**.

---

## Base URL

```
Production: https://api.duweku.my.id
Development: http://localhost:8787
```

## Auth Header

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication

### POST `/api/auth/register`

Registrasi akun baru.

**Request Body:**
```json
{
  "name": "Budi Santoso",
  "email": "budi@email.com",
  "password": "min8karakter"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "Budi Santoso", "email": "budi@email.com" },
    "token": "eyJhbG..."
  }
}
```

### POST `/api/auth/login`

Login dengan email & password.

**Request Body:**
```json
{ "email": "budi@email.com", "password": "min8karakter" }
```

**Response (200):**
```json
{
  "success": true,
  "data": { "user": { ... }, "token": "eyJhbG..." }
}
```

### GET `/api/auth/me`

🔒 Authenticated. Ambil profil user saat ini.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Budi Santoso",
    "email": "budi@email.com",
    "telegram_connected": true,
    "gemini_key_set": true,
    "active_workspace_id": "ws-uuid"
  }
}
```

---

## 2. Workspaces

### GET `/api/workspaces`

🔒 Ambil semua workspace milik user.

**Response:**
```json
{
  "data": [
    { "id": "ws1", "name": "Pribadi", "type": "personal", "role": "owner", "member_count": 1 },
    { "id": "ws2", "name": "Kas RT 05", "type": "community", "role": "owner", "member_count": 8 }
  ]
}
```

### POST `/api/workspaces`

🔒 Buat workspace baru.

```json
{ "name": "Bisnis Kopi", "type": "business", "currency": "IDR" }
```

### PUT `/api/workspaces/:id`

🔒 Update nama/tipe workspace.

### DELETE `/api/workspaces/:id`

🔒 Hapus workspace (CASCADE semua data).

---

## 3. Accounts (Akun Keuangan)

### GET `/api/workspaces/:wid/accounts`

🔒 Daftar akun di workspace.

**Response:**
```json
{
  "data": [
    { "id": "acc1", "name": "Cash", "type": "cash", "current_balance": 500000, "icon": "💰", "is_default": true },
    { "id": "acc2", "name": "BCA", "type": "bank", "current_balance": 2000000, "icon": "🏦", "is_default": false }
  ],
  "total_balance": 2500000
}
```

### POST `/api/workspaces/:wid/accounts`

🔒 Tambah akun baru.

```json
{ "name": "GoPay", "type": "e-wallet", "initial_balance": 100000, "icon": "💳" }
```

### PUT `/api/workspaces/:wid/accounts/:id`

🔒 Update akun.

### POST `/api/workspaces/:wid/transfer`

🔒 Transfer antar akun (neutral transaction).

```json
{ "from_account_id": "acc-bca", "to_account_id": "acc-cash", "amount": 500000, "description": "Tarik tunai" }
```

---

## 4. Categories

### GET `/api/workspaces/:wid/categories`

🔒 Daftar kategori (system + custom).

### POST `/api/workspaces/:wid/categories`

🔒 Tambah kategori custom.

```json
{ "name": "Jajan Anak", "type": "expense", "icon": "🍭", "color": "#EC4899" }
```

---

## 5. Transactions

### GET `/api/workspaces/:wid/transactions`

🔒 Daftar transaksi dengan filter & pagination.

**Query Params:**
| Param | Tipe | Keterangan |
|-------|------|------------|
| `page` | number | Default: 1 |
| `limit` | number | Default: 20, max: 100 |
| `type` | string | `income` / `expense` / `transfer` |
| `category_id` | string | Filter kategori |
| `account_id` | string | Filter akun |
| `date_from` | string | YYYY-MM-DD |
| `date_to` | string | YYYY-MM-DD |
| `search` | string | Search di description |

**Response:**
```json
{
  "data": [
    {
      "id": "tx1",
      "type": "expense",
      "amount": 25000,
      "description": "Jajan bakso",
      "category": { "name": "Makanan", "icon": "🍕" },
      "account": { "name": "Cash" },
      "user": { "name": "Budi" },
      "source": "telegram_text",
      "date": "2026-02-12",
      "created_at": "2026-02-12T10:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 150, "pages": 8 }
}
```

### POST `/api/workspaces/:wid/transactions`

🔒 Buat transaksi manual (dari web).

```json
{
  "type": "expense",
  "amount": 25000,
  "description": "Jajan bakso",
  "category_id": "cat-makanan",
  "account_id": "acc-cash",
  "date": "2026-02-12"
}
```

### DELETE `/api/workspaces/:wid/transactions/:id`

🔒 Hapus transaksi + rollback saldo akun.

---

## 6. Dashboard Stats

### GET `/api/workspaces/:wid/stats`

🔒 Aggregate data untuk dashboard.

**Query Params:** `period` = `daily` / `weekly` / `monthly` / `yearly`, `date_from`, `date_to`

**Response:**
```json
{
  "total_balance": 5240000,
  "period_income": 2500000,
  "period_expense": 1700000,
  "period_net": 800000,
  "by_category": [
    { "category": "Makanan", "icon": "🍕", "color": "#EF4444", "total": 450000, "percentage": 45 },
    { "category": "Transportasi", "icon": "🚗", "color": "#3B82F6", "total": 220000, "percentage": 22 }
  ],
  "daily_trend": [
    { "date": "2026-02-01", "income": 0, "expense": 85000 },
    { "date": "2026-02-02", "income": 5000000, "expense": 120000 }
  ]
}
```

---

## 7. Export

### GET `/api/workspaces/:wid/export`

🔒 Download laporan Excel.

**Query Params:** `date_from`, `date_to`, `format` = `xlsx`

**Response**: Binary file download (`.xlsx`) atau URL R2 signed.

---

## 8. Settings

### POST `/api/settings/api-key`

🔒 Simpan/update Gemini API key.

```json
{ "api_key": "AIza...", "is_backup": false }
```

### POST `/api/settings/telegram/generate-token`

🔒 Generate link token (15 menit).

**Response:**
```json
{ "token": "abc123-def456", "expires_at": "2026-02-12T13:45:00Z" }
```

### POST `/api/settings/telegram/disconnect`

🔒 Putuskan koneksi Telegram.

---

## 9. Tim (Anggota Workspace)

### POST `/api/workspaces/:wid/team/invite`

🔒 Owner only. Generate invite link.

**Response:**
```json
{ "invite_url": "https://duweku.my.id/join/TOKEN", "expires_at": "..." }
```

### POST `/api/workspaces/:wid/team/join`

🔒 Join workspace via invite token.

```json
{ "invite_token": "TOKEN" }
```

### GET `/api/workspaces/:wid/team/members`

🔒 Daftar anggota workspace.

### DELETE `/api/workspaces/:wid/team/members/:uid`

🔒 Owner only. Remove member dari workspace.

---

## 10. Super Admin (Platform Management)

> 🛡️ Semua endpoint di section ini memerlukan `users.role = 'super_admin'`

### GET `/api/admin/users`

🛡️ Daftar semua user platform.

**Query Params:** `page`, `limit`, `search` (nama/email), `status` (`active`/`suspended`)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Budi Santoso",
      "email": "budi@email.com",
      "role": "user",
      "telegram_connected": true,
      "workspace_count": 2,
      "transaction_count": 150,
      "created_at": "2026-01-15T08:00:00Z",
      "status": "active"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 500 }
}
```

### GET `/api/admin/users/:id`

🛡️ Detail user tertentu (termasuk workspace & statistik).

### PUT `/api/admin/users/:id/status`

🛡️ Suspend / activate user.

```json
{ "status": "suspended", "reason": "Pelanggaran ToS" }
```

### DELETE `/api/admin/users/:id`

🛡️ Hapus user permanen (CASCADE semua data).

### GET `/api/admin/stats`

🛡️ Statistik global platform.

**Response:**
```json
{
  "total_users": 1250,
  "active_users_30d": 890,
  "total_workspaces": 2100,
  "total_transactions": 45000,
  "new_users_7d": 75,
  "ai_requests_today": 3200,
  "top_categories": [
    { "name": "Makanan", "count": 12000 },
    { "name": "Transportasi", "count": 8500 }
  ]
}
```

### GET `/api/admin/ai-logs`

🛡️ Monitor penggunaan AI seluruh platform.

**Query Params:** `user_id`, `date_from`, `date_to`, `model`

### PUT `/api/admin/settings`

🛡️ Update konfigurasi platform global.

```json
{
  "maintenance_mode": false,
  "max_workspaces_per_user": 5,
  "announcement": "Pemeliharaan server 14 Feb 2026 pukul 02:00 WIB"
}
```

---

## 11. Telegram Webhook

### POST `/webhook/telegram`

⚠️ **Tidak perlu auth JWT** — diverifikasi via Telegram Bot Token.

Endpoint ini menerima semua update dari Telegram Bot API. Tidak dipanggil oleh frontend.

Dihandle oleh Grammy/Telegraf framework secara internal.
