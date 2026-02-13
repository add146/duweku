# 01 — Ringkasan Produk

## Visi Produk

**DuweKu** adalah platform **SaaS (Software as a Service)** pencatatan keuangan berbasis AI untuk **individu, keluarga, perusahaan, instansi, maupun komunitas**. Pengguna cukup **chat di Telegram** menggunakan bahasa natural ("beli kopi 15rb") atau **kirim foto struk**, dan AI akan otomatis mengkategorikan serta menyimpan transaksi. Dashboard web menyediakan visualisasi analitik yang lengkap.

> **Model**: SaaS multi-tenant dengan 3 tingkatan role — **Super Admin** (platform), **Owner** (workspace), **Member** (workspace).

---

## Masalah yang Dipecahkan

Aplikasi keuangan konvensional memiliki hambatan utama:

| Masalah | Dampak |
|---------|--------|
| Harus buka app khusus, navigasi menu, isi form | Pengguna malas → berhenti pakai setelah beberapa minggu |
| Input manual: pilih tanggal, ketik nominal, pilih kategori dari dropdown | 30-45 detik per transaksi |
| Tidak bisa memisahkan keuangan pribadi & bisnis | Campur aduk, sulit analisis |
| Hanya satu orang yang catat | Tidak transparan untuk keluarga, tim, maupun organisasi |

## Solusi DuweKu

| Solusi | Benefit |
|--------|---------|
| **Chat-based input** via Telegram | 5-10 detik per transaksi, semudah kirim chat |
| **AI parsing** (NLP) otomatis kategorisasi | Tidak perlu pilih dari dropdown |
| **OCR scan struk** & bukti transfer | Foto → langsung tercatat |
| **Multi-workspace** (Pribadi, Bisnis, Keluarga, Organisasi, Komunitas) | Keuangan terpisah rapi |
| **Tim plan** — shared workspace | Transparansi keuangan bersama (keluarga, perusahaan, instansi, komunitas) |
| **Dashboard web** — grafik & laporan | Analisis big-picture |

---

## Arsitektur Tingkat Tinggi

Sistem beroperasi sebagai **ekosistem terdistribusi** yang menghubungkan 3 node utama:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  📱 TELEGRAM    │     │  ⚡ CLOUDFLARE   │     │  🌐 WEB         │
│  (Chat Input)   │────▶│  WORKER          │◀────│  DASHBOARD      │
│                 │     │  (Backend API)   │     │  (Visualisasi)  │
│  • Teks natural │     │                  │     │  • Grafik saldo │
│  • Foto struk   │     │  ┌────────────┐  │     │  • Tabel trans  │
│  • Commands     │     │  │ 🤖 Gemini  │  │     │  • Export Excel │
│                 │     │  │ AI Engine  │  │     │  • Settings     │
└─────────────────┘     │  └────────────┘  │     └─────────────────┘
                        │                  │
                        │  ┌────┐ ┌────┐   │
                        │  │ D1 │ │ R2 │   │
                        │  │ DB │ │ Img│   │
                        │  └────┘ └────┘   │
                        └──────────────────┘
```

### Tiga Pilar Sistem

1. **Antarmuka Klien (Telegram Bot)** — Tempat pengguna berinteraksi, mengirim teks/gambar transaksi
2. **Otak Pemrosesan (Google Gemini AI)** — NLP parsing teks + OCR gambar struk, mengubah input tidak terstruktur menjadi data terstruktur (JSON)
3. **Pusat Data & Visualisasi (Web Dashboard + D1/R2)** — Menyimpan, menampilkan, dan mengekspor data keuangan

---

## Model Bisnis: Dual Pricing (BYOK + AI Included)

DuweKu menawarkan **2 model paket harga** berdasarkan penggunaan AI:

### Paket Harga

| Paket | Gemini AI | Harga | Target |
|-------|-----------|-------|--------|
| 🟢 **Basic (BYOK)** | User bawa API key sendiri | **Rp 200.000 (selamanya)** | User teknis, hemat |
| 🔵 **Pro (AI Included)** | Pakai global key platform | **Rp 30.000/bulan** | User non-teknis, instant |

### Cara Kerja Gemini API

```
📦 Paket Basic (BYOK)
├── User daftar ke Google AI Studio → dapat API key gratis
├── Input API key di dashboard DuweKu (form terbuka)
├── Setiap request AI menggunakan key milik user ← ISOLATE
└── Kuota gratis Google: 60 RPM, cukup untuk personal

📦 Paket Pro (AI Included)
├── User tidak perlu setup API key (form tersembunyi)
├── Platform menyediakan global Gemini API key
├── Setiap request AI menggunakan key milik platform ← GLOBAL
└── Biaya AI ditanggung platform, dibebankan via harga paket
```

### Perilaku UI berdasarkan Paket

| Elemen UI | Paket BYOK | Paket AI Included |
|-----------|------------|-------------------|
| Input API Key | ✅ Terbuka (wajib diisi) | ❌ Tersembunyi |
| Tombol "Test API Key" | ✅ Tampil | ❌ Tersembunyi |
| Input Backup Key | ✅ Tampil | ❌ Tersembunyi |
| Badge paket | `🟢 BYOK` | `🔵 Pro` |
| Error 429 handling | User ganti key sendiri | Platform auto-rotate key |

### Keuntungan Model Dual

| Aspek | BYOK | AI Included |
|-------|------|-------------|
| Biaya platform/user | ~$0 | Ada biaya API per user |
| Setup effort | User perlu setup key | Instant, tanpa setup |
| Rate limit | Per-user (isolate) | Shared (global pool) |
| Revenue model | Subscription saja | Subscription + margin AI |

---

## Model SaaS & Role Hierarchy

```
🛡️ Super Admin (Platform Level)
 └── Kelola seluruh platform: users, statistik global, settings

👑 Owner (Workspace Level)
 └── Full control workspace: CRUD akun, kategori, transaksi, invite member

👤 Member (Workspace Level)
 └── Input & lihat transaksi, hapus transaksi sendiri
```

| Role | Disimpan di | Scope |
|------|-------------|-------|
| Super Admin | `users.role = 'super_admin'` | Seluruh platform |
| Owner | `workspace_members.role = 'owner'` | Per workspace |
| Member | `workspace_members.role = 'member'` | Per workspace |

---

## Fitur Utama (Feature List)

### 🟢 Core Features (MVP)

- [x] Registrasi & login (email/password)
- [x] **Sistem role 3 tingkat** (Super Admin, Owner, Member)
- [x] **Admin panel** — manage user, statistik platform, settings
- [ ] Setup API Key Google Gemini (BYOK)
- [ ] Hubungkan akun Telegram (link token)
- [ ] Buat workspace (Pribadi/Bisnis/Keluarga/Organisasi/Komunitas)
- [ ] Buat akun keuangan (Cash, Bank, E-Wallet) + saldo awal
- [ ] Input transaksi via teks Telegram (NLP parsing)
- [ ] Input transaksi via foto struk (OCR)
- [ ] Konfirmasi AI → Human-in-the-Loop
- [ ] Dashboard: ringkasan saldo, grafik per kategori
- [ ] Daftar transaksi (filter, search)
- [ ] Hapus/edit transaksi (rollback saldo)
- [ ] Transfer antar akun (neutral transaction)
- [ ] Export laporan ke Excel (.xlsx)

### 🟡 Enhanced Features (V2)

- [ ] Tim plan (invite anggota ke workspace: keluarga, perusahaan, instansi, komunitas)
- [ ] Switch workspace via Telegram command
- [ ] Kategori custom
- [ ] Tren bulanan & perbandingan periode
- [ ] Dark mode / light mode toggle
- [ ] Notifikasi budget limit
- [ ] Multi API key cadangan (handle rate limit 429)

### 🔵 Future Features (V3+)

- [ ] Program afiliasi (komisi 20%)
- [x] Subscription/billing system (plans & pricing)
- [ ] Budget planning & goals
- [ ] Recurring transaction (langganan)
- [ ] AI insights ("Pengeluaran makanan bulan ini naik 30%")
- [ ] WhatsApp integration (selain Telegram)
- [ ] Mobile app (PWA)
- [ ] Admin: user analytics, churn tracking, revenue dashboard

---

## Target Pengguna

| Segmen | Usia | Karakteristik | Kebutuhan |
|--------|------|---------------|-----------|
| **Individu Muda** | 20-35 | Melek digital, mobile-first | Chat-first, instant, minim klik |
| **Ibu Rumah Tangga** | 25-45 | Catat belanja harian | Simple, visual, bahasa Indonesia |
| **Pemilik UMKM** | 25-50 | Pisah keuangan pribadi & bisnis | Workspace, laporan Excel |
| **Keluarga** | 25-45 | Transparansi keuangan bersama | Tim invite, shared dashboard |
| **Perusahaan/Instansi** | 30-55 | Kelola keuangan departemen/divisi | Multi-workspace, laporan, role-based access |
| **Komunitas/Organisasi** | 20-40 | Kas organisasi, event budget | Shared workspace, multi-member, transparansi |

---

## Keunggulan Kompetitif

| vs Kompetitor | DuweKu |
|---------------|--------|
| App keuangan manual (Money Manager, dll) | ✅ Input chat natural, 5 detik vs 45 detik |
| Spreadsheet / Excel manual | ✅ Otomatis kategorisasi, real-time dashboard |
| App serupa tanpa AI | ✅ NLP + OCR powered by Gemini |
| App dengan server AI mahal | ✅ BYOK model = biaya server < $11/bulan |
