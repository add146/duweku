# 10 — Estimasi Biaya

Analisis biaya operasional DuweKu menggunakan ekosistem Cloudflare.

---

## 1. Cloudflare Free Tier

| Service | Free Tier | Cukup untuk |
|---------|-----------|-------------|
| **Workers** | 100.000 req/hari | ~100 users aktif |
| **Pages** | Unlimited bandwidth, 500 builds/bulan | Unlimited |
| **D1** | 5M rows read/hari, 100K rows write/hari | ~500 users |
| **R2** | 10GB storage, 10M Class B reads/bulan | ~10K struk |
| **KV** | 100K reads/hari, 1K writes/hari | Session cache |

> **Kesimpulan Free Tier**: Cukup untuk **0-100 users aktif** tanpa biaya sama sekali.

---

## 2. Cloudflare Paid Plan ($5/bulan Workers Paid)

| Service | Paid Tier | Harga |
|---------|-----------|-------|
| **Workers** | 10M req/bulan included | $5/bulan base |
| **Workers** | +$0.50 per 1M req tambahan | Pay-per-use |
| **D1** | 25B rows read, 50M rows write/bulan | Included |
| **R2** | 10GB free, +$0.015/GB/bulan | Very cheap |
| **R2 Operations** | 10M Class B reads free | Included |

---

## 3. Estimasi Per Skala

### 100 Users Aktif

| Item | Estimasi | Biaya |
|------|----------|-------|
| Workers requests | ~50K req/hari | **$0** (free tier) |
| D1 reads | ~500K/hari | **$0** (free tier) |
| D1 writes | ~10K/hari | **$0** (free tier) |
| R2 storage | ~500MB (struk) | **$0** (under 10GB) |
| **Total** | | **$0/bulan** |

### 1.000 Users Aktif

| Item | Estimasi | Biaya |
|------|----------|-------|
| Workers requests | ~500K req/hari (~15M/bulan) | $5 + $2.50 |
| D1 reads | ~5M/hari | Included in paid |
| D1 writes | ~100K/hari | Included in paid |
| R2 storage | ~5GB | **$0** (under 10GB) |
| **Total** | | **~$7.50/bulan** |

### 10.000 Users Aktif

| Item | Estimasi | Biaya |
|------|----------|-------|
| Workers requests | ~5M req/hari (~150M/bulan) | $5 + $70 |
| D1 reads | ~50M/hari | Included |
| D1 writes | ~1M/hari | Included |
| R2 storage | ~50GB | $0.60 |
| **Total** | | **~$76/bulan** |

---

## 4. Biaya AI (Dual Model)

### Paket BYOK (user bayar sendiri)

| Provider | Tier | Kuota | Biaya User |
|----------|------|-------|------------|
| Google AI Studio | Free | 60 RPM, 1500 RPD | **$0** |
| Google AI Studio | Pay-as-you-go | Gemini Pro: $0.50/1M input tokens | Minimal |

> 1 transaksi ≈ 200-500 tokens. Dengan free tier (1500 req/hari), user bisa catat ~1500 transaksi/hari.

### Paket Pro / AI Included (platform bayar)

| Item | Estimasi per User/bulan | Keterangan |
|------|------------------------|------------|
| Gemini API calls | ~150 req/bulan/user | Rata-rata 5 transaksi/hari |
| Token usage | ~50K tokens/bulan/user | ~300 tokens/transaksi |
| **Biaya Gemini** | **~$0.025/user/bulan** | Gemini Pro pricing |
| **Biaya 1000 Pro users** | **~$25/bulan** | Very affordable |

> Platform menyimpan **pool global keys** (multiple API keys) di env `GEMINI_API_KEY` dan auto-rotate saat mendekati rate limit.

---

## 5. Paket Harga SaaS

| Paket | Harga | Tipe | AI Mode | Fitur |
|-------|-------|------|---------|-------|
| 🟢 **Basic (BYOK)** | **Rp 200.000** | Sekali bayar (selamanya) | `byok` | 5 workspace, unlimited transaksi |
| 🔵 **Pro (AI Included)** | **Rp 30.000/bulan** | Langganan bulanan | `global` | 10 workspace, unlimited, AI included |

---

## 6. Perbandingan vs VPS Tradisional

| Item | Cloudflare Stack | VPS (DigitalOcean/Contabo) |
|------|-----------------|---------------------------|
| Server | $0-$5/bulan | $5-20/bulan |
| Database | $0 (D1) | $0 (self-hosted SQLite/Postgres) |
| Storage | $0-$1 (R2) | Termasuk VPS disk |
| SSL | Free (auto) | Free (Let's Encrypt) |
| CDN | Built-in | Perlu setup sendiri |
| Maintenance | Zero | Perlu monitor, update, backup |
| Scaling | Auto | Manual upgrade |
| Cold start | 0ms | Always-on |
| DDoS protection | Built-in | Perlu setup |
| **Total (1K users)** | **~$7.50/bulan** | **~$10-25/bulan** |

---

## 7. Break-Even Analysis (Revenue Model)

### Revenue Bulanan (Skenario 500 total users)

| Distribusi | BYOK (one-time) | Pro (recurring) | Revenue bulanan |
|------------|-----------------|-----------------|-----------------|
| 80% BYOK, 20% Pro | 400 × Rp 200K = Rp 80jt (sekali) | 100 × Rp 30K = **Rp 3jt/bulan** | Rp 3jt + one-time |
| 50% BYOK, 50% Pro | 250 × Rp 200K = Rp 50jt (sekali) | 250 × Rp 30K = **Rp 7.5jt/bulan** | Rp 7.5jt + one-time |

### Margin (recurring Pro only)

| Item | 100 Pro users | 250 Pro users |
|------|---------------|---------------|
| Revenue/bulan | Rp 3.000.000 | Rp 7.500.000 |
| Server (CF Workers) | ~Rp 120.000 | ~Rp 120.000 |
| AI cost (Gemini) | ~Rp 40.000 | ~Rp 100.000 |
| **Net margin** | **Rp 2.840.000 (95%)** | **Rp 7.280.000 (97%)** |

> **Model hybrid**: BYOK = revenue besar di awal (one-time), Pro = revenue stabil recurring. Margin tetap tinggi ~95-97%.

---

## 8. Hidden Costs (Perlu Dipertimbangkan)

| Item | Estimasi | Frekuensi |
|------|----------|-----------|
| Domain (.my.id) | Rp 15.000 | /tahun |
| Domain (.com jika perlu) | Rp 150.000 | /tahun |
| Payment gateway (Midtrans dsb) | 2.9% + Rp 2000/transaksi | Per payment |
| Email transaksional (opsional) | $0-$20/bulan | Bulanan |
| Monitoring (opsional) | $0 (Cloudflare Analytics free) | — |
| Gemini API pool keys (Pro plan) | ~$25/1000 users | Bulanan |
