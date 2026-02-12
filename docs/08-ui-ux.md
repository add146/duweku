# 08 — UI/UX Design

Panduan desain antarmuka dan pengalaman pengguna untuk dashboard web DuweKu.

---

## 1. Prinsip Desain

> **"Chat-First, Dashboard-Second"**  
> Input di Telegram = semudah chat biasa. Dashboard web = hanya untuk visualisasi & konfigurasi.

| Prinsip | Implementasi |
|---------|-------------|
| **Minimal Friction** | Kurangi jumlah klik, form pendek, default cerdas |
| **Instant Feedback** | Toast notification, real-time update, loading skeleton |
| **Mobile-First** | Responsive, bottom nav, thumb-friendly |
| **Visual Clarity** | Warna per kategori, emoji icons, angka mudah dibaca |
| **Dark Mode Default** | Target pengguna sering pakai malam hari di HP |

---

## 2. Visual Design System

### Color Palette

| Nama | Hex | Fungsi |
|------|-----|--------|
| **Primary** | `#0D9488` (Teal 600) | CTA buttons, links, active states |
| **Primary Light** | `#14B8A6` (Teal 500) | Hover states |
| **Primary Dark** | `#0F766E` (Teal 700) | Pressed states |
| **Accent** | `#F59E0B` (Amber 500) | Highlights, badges, income |
| **Danger** | `#EF4444` (Red 500) | Expense, delete, errors |
| **Success** | `#10B981` (Emerald 500) | Income, success states |
| **Background** | `#0F172A` (Slate 900) | Dark mode main bg |
| **Surface** | `#1E293B` (Slate 800) | Card background |
| **Surface Hover** | `#334155` (Slate 700) | Card hover |
| **Text Primary** | `#F8FAFC` (Slate 50) | Main text |
| **Text Secondary** | `#94A3B8` (Slate 400) | Secondary text |
| **Border** | `#334155` (Slate 700) | Borders & dividers |

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| **Heading 1** | Plus Jakarta Sans | Bold (700) | 28px |
| **Heading 2** | Plus Jakarta Sans | Semibold (600) | 22px |
| **Heading 3** | Plus Jakarta Sans | Semibold (600) | 18px |
| **Body** | Inter | Regular (400) | 14px |
| **Body Small** | Inter | Regular (400) | 12px |
| **Numbers/Money** | JetBrains Mono | Medium (500) | 16px |
| **Big Number** | JetBrains Mono | Bold (700) | 32px |

### Spacing & Radius

| Token | Value |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--radius-sm` | 8px |
| `--radius-md` | 12px |
| `--radius-lg` | 16px |
| `--radius-full` | 9999px |

### Design Effects

| Effect | CSS |
|--------|-----|
| **Glassmorphism Card** | `background: rgba(30,41,59,0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1);` |
| **Subtle Glow** | `box-shadow: 0 0 20px rgba(13,148,136,0.15);` |
| **Elevation 1** | `box-shadow: 0 1px 3px rgba(0,0,0,0.3);` |
| **Elevation 2** | `box-shadow: 0 4px 12px rgba(0,0,0,0.4);` |

---

## 3. Layout Structure (Responsive App-Like)

> **Konsep**: Backoffice Owner/Member dibuat seperti **aplikasi mobile** — simple saat portrait di HP, detail saat dibuka di desktop. Bukan website biasa, tapi **web app** yang terasa native.

### Breakpoint Behavior

| Breakpoint | Layar | Layout | Navigasi |
|------------|-------|--------|----------|
| **Mobile** (<640px) | HP portrait | Full-width, no sidebar | **Bottom Nav** (4 icon simpel) |
| **Tablet** (640-1023px) | HP landscape / tablet | Full-width, collapsible | **Bottom Nav** + header actions |
| **Desktop** (≥1024px) | PC / laptop | Sidebar + content | **Sidebar kiri** (icon + label) |

---

### 📱 Mobile Portrait (<640px) — Simple App

```
┌──────────────────────────┐
│  DuweKu    🏢 Pribadi ▾  │ ← Header: logo + workspace pill
├──────────────────────────┤
│                          │
│                          │
│     Page Content         │
│     (full width)         │
│     (scrollable)         │
│                          │
│                          │
│                          │
│                          │
├──────────────────────────┤
│                          │
│  🏠     💳     📊     ⚙️  │ ← Bottom Nav: 4 ikon saja
│ Home  Trans  Stats  More │    (simpel, thumb-friendly)
│                          │
└──────────────────────────┘
```

**Detail Bottom Nav Mobile:**
- Hanya **4 ikon utama** (max 5) agar tidak crowded
- Label teks kecil di bawah setiap ikon
- Ikon aktif: warna Primary (Teal), yang lain: abu-abu
- "More" / ⚙️ membuka **sheet dari bawah** dengan menu lengkap:

```
┌──────────────────────────┐
│  ⚙️ Menu Lainnya    [✕]  │ ← Bottom Sheet (slide up)
├──────────────────────────┤
│  💰  Akun Keuangan       │
│  📋  Laporan & Export    │
│  👥  Anggota Tim          │
│  🏢  Ganti Workspace    │
│  🔑  API Key & Telegram │
│  👤  Profil              │
│  🚪  Logout              │
└──────────────────────────┘
```

---

### 🖥️ Desktop (≥1024px) — Detail Sidebar

```
┌─────────────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌────────────────────────────────────┐ │
│ │  🟢 DuweKu   │ │  🏢 Pribadi ▾          👤 Budi ▾  │ │
│ │              │ ├────────────────────────────────────┤ │
│ │  🏠 Dashboard │ │                                    │ │
│ │  💳 Transaksi │ │                                    │ │
│ │  💰 Akun      │ │       Page Content                │ │
│ │  📊 Laporan   │ │       (dengan detail lebih)       │ │
│ │  👥 Tim       │ │                                    │ │
│ │              │ │   • Charts side by side            │ │
│ │  ────────    │ │   • Table dengan kolom lengkap     │ │
│ │  🏢 Workspace │ │   • Filter bar horizontal         │ │
│ │  ⚙️ Pengaturan│ │                                    │ │
│ │              │ │                                    │ │
│ │  ────────    │ │                                    │ │
│ │  🛡️ Admin    │ │  ← Super Admin only                │ │
│ └──────────────┘ └────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

### Perbedaan Konten Mobile vs Desktop

| Elemen | 📱 Mobile | 🖥️ Desktop |
|--------|-----------|------------|
| **Hero Saldo** | 1 card full-width | Card + mini sparkline chart |
| **Quick Stats** | 3 card scroll horizontal | 3 card grid side-by-side |
| **Charts** | 1 chart per section, stack vertical | 2 chart side-by-side (donut + line) |
| **Tabel Transaksi** | List sederhana (emoji + deskripsi + nominal) | Tabel full: tanggal, kategori, akun, source, nominal |
| **Filter** | Chip horizontal scroll | Full filter bar + date range picker |
| **Transaksi Actions** | Swipe-to-delete | Hover → tombol Edit/Hapus muncul |
| **Form Input** | Full-screen modal | Side panel / inline form |
| **Navigation** | Bottom nav 4 ikon | Sidebar dengan label teks |

---

### Role-Based Menu Visibility

| Menu | Owner | Member | Super Admin |
|------|:-----:|:------:|:-----------:|
| 🏠 Dashboard | ✅ | ✅ | ✅ |
| 💳 Transaksi | ✅ | ✅ | ✅ |
| 💰 Akun Keuangan | ✅ | ❌ (hidden) | ✅ |
| 📊 Laporan & Export | ✅ | ❌ (hidden) | ✅ |
| 👥 Tim / Anggota | ✅ | ❌ (hidden) | ✅ |
| 🏢 Workspace | ✅ | ✅ (switch saja) | ✅ |
| ⚙️ Pengaturan | ✅ (full) | ✅ (profil + telegram saja) | ✅ |
| 🛡️ Admin Panel | ❌ | ❌ | ✅ |

> **Member** hanya melihat **3 menu utama** di bottom nav: 🏠 Home, 💳 Transaksi, ⚙️ Profil. Simpel dan tidak bingung.

---

## 4. Halaman Dashboard

```
┌────────────────────────────────────────────┐
│ 🏢 Pribadi ▾               👤 Budi ▾      │ ← Header
├────────────────────────────────────────────┤
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ 💰 Total Saldo                        │ │ ← Hero Card (Glassmorphism)
│ │                                        │ │
│ │     Rp 5.240.000                      │ │   Animated counter
│ │     ▲ +Rp 800.000 bulan ini           │ │   Green = naik
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │📈 Income  │ │📉 Expense │ │🔄Transfer │   │ ← Quick Stats (3 cards)
│ │Rp 2.5jt  │ │Rp 1.7jt  │ │Rp 300k   │   │
│ │ +15% ▲   │ │ -5% ▼    │ │          │   │
│ └──────────┘ └──────────┘ └──────────┘   │
│                                            │
│ ┌─────────────────┐ ┌──────────────────┐  │
│ │ 📊 Per Kategori  │ │ 📈 Tren Harian   │  │ ← Charts
│ │  🍕 Makanan 45% │ │ (Line chart)     │  │
│ │  🚗 Transport22%│ │                    │  │
│ │  ⚡ Utilitas 15%│ │                    │  │
│ │  (Donut chart)  │ │                    │  │
│ └─────────────────┘ └──────────────────┘  │
│                                            │
│ 📋 Transaksi Terbaru          [Lihat Semua]│
│ ┌────────────────────────────────────────┐ │
│ │ 🍕 Makan siang        -Rp 20.000  📱 │ │ ← Source icon: 📱=telegram
│ │    Cash · Hari ini · 10:30            │ │
│ ├────────────────────────────────────────┤ │
│ │ ⛽ Bensin              -Rp 50.000  📱 │ │
│ │    BCA · Hari ini · 09:15             │ │
│ ├────────────────────────────────────────┤ │
│ │ 💰 Gaji bulanan      +Rp 5.000.000 🌐│ │ ← 🌐=web manual
│ │    BCA · 1 Feb · 08:00                │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

---

## 5. UX Recommendations Spesifik

### Onboarding
- **Wizard 4 langkah** dengan progress bar di atas
- Video embed per langkah (YouTube tutorial)
- Tombol "Skip" hanya untuk langkah optional
- Highlight interaktif (tooltip/spotlight) pada element penting

### Workspace Switcher
- Dropdown di header dengan pill badges berwarna per workspace
- Warna border workspace: Pribadi=Teal, Bisnis=Purple, Keluarga=Amber, Organisasi=Blue, Komunitas=Pink
- Shortcut: Double-tap logo untuk switch

### Real-time Sync
- Toast notification muncul dari bawah saat transaksi baru dari Telegram:
  - `"✅ Makan siang Rp20.000 tercatat via Telegram"`
- Angka saldo animate (count up/down) saat berubah

### Transaction List
- Infinite scroll (bukan pagination biasa)
- Swipe-to-delete di mobile
- Emoji kategori di samping kiri setiap item
- Nominal merah (expense) / hijau (income) / biru (transfer)
- Chip filter di atas list: [Semua] [Income] [Expense] [Transfer]

### Empty States
- Ilustrasi friendly (SVG)
- CTA jelas: *"Belum ada transaksi. Ketik 'kopi 15k' di Telegram untuk mulai!"*
- Link ke tutorial video

### Halaman Settings — Conditional API Key

**Paket BYOK** (`ai_mode = 'byok'`):
```
┌────────────────────────────────────────┐
│ 🔑 API Key Gemini           [🟢 BYOK] │
├────────────────────────────────────────┤
│ API Key Utama                          │
│ ┌────────────────────────────────────┐ │
│ │ AIza...●●●●●●●●●●●●    [👁] [Test]  │ │
│ └────────────────────────────────────┘ │
│                                        │
│ API Key Cadangan (opsional)             │
│ ┌────────────────────────────────────┐ │
│ │ (opsional, untuk rotasi rate limit)  │ │
│ └────────────────────────────────────┘ │
│                          [💾 Simpan]   │
└────────────────────────────────────────┘
```

**Paket Pro / AI Included** (`ai_mode = 'global'`):
```
┌────────────────────────────────────────┐
│ 🔑 API Key Gemini           [🔵 Pro]  │
├────────────────────────────────────────┤
│                                        │
│  ✅ AI sudah termasuk dalam paket Anda   │
│  Tidak perlu setup API key.             │
│                                        │
│  Paket: Pro (AI Included)               │
│  Status: Aktif                          │
│                                        │
│  [🔄 Ganti ke paket BYOK]               │
└────────────────────────────────────────┘
```

### Error 429 (API Limit)
- **BYOK**: Banner kuning di atas dashboard + link langsung ke Google AI Studio
- **Pro**: Banner biru "Sistem sedang sibuk, coba beberapa saat lagi"

### Format Angka
- Selalu format Indonesia: `Rp 1.500.000` (titik sebagai pemisah ribuan)
- Abbreviation untuk angka besar: `Rp 1,5jt`
- Font monospace untuk nominal → alignment rapi

### Micro-Animations
| Element | Animasi |
|---------|---------|
| Saldo total | Count-up animation on load |
| Transaksi baru masuk | Slide-in dari kanan + glow |
| Hapus transaksi | Swipe out + saldo animate |
| Chart donut | Draw animation on viewport enter |
| Toggle dark/light | Smooth color transition 300ms |
| Button hover | Scale 1.02 + shadow increase |

---

## 6. Telegram Bot Response Design

### Konfirmasi Transaksi Teks

```
✅ Transaksi Dicatat!

📝 Jajan bakso
💸 Pengeluaran: Rp 25.000
🏷️ Kategori: Makanan & Minuman
💳 Akun: Cash (Saldo: Rp 475.000)
📅 12 Feb 2026

[✏️ Edit] [❌ Hapus]
```

### Konfirmasi Scan Struk (Minta Konfirmasi)

```
📋 Hasil Scan Struk:

🏪 Alfamart Jl. Sudirman
📅 12 Feb 2026
💰 Total: Rp 87.500

📦 Items:
  • Indomie Goreng x2 — Rp 7.000
  • Aqua 600ml x1 — Rp 4.000
  • Tisu Nice x1 — Rp 12.500

Apakah data ini benar?
[✅ Ya, Simpan] [✏️ Edit Nominal] [❌ Batal]
```

### Ringkasan Saldo (/saldo)

```
💰 Saldo Akun — Workspace: Pribadi

💵 Cash          Rp    500.000
🏦 BCA           Rp  2.000.000
💳 GoPay         Rp    100.000
─────────────────────────
📊 Total         Rp  2.600.000
```

---

## 7. Admin Panel UI (🛡️ Super Admin Only)

```
┌────────────────────────────────────────────┐
│ 🛡️ Admin Panel          👤 Admin Name ▾ │
├────────────────────────────────────────────┤
│                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │👥 Users  │ │📈 Trans  │ │🤖 AI Use │ │  ← Stat Cards
│ │  1,250   │ │  45,000  │ │  3,200  │ │
│ │ +75 (7d) │ │ today   │ │ today   │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│                                            │
│ 📊 User Growth (30d)                       │
│ ┌────────────────────────────────────────┐ │
│ │  ▂▃▄▅▆▇█  (bar chart)                   │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ 👥 Users Terbaru                   [Semua] │
│ ┌────────────────────────────────────────┐ │
│ │ Budi S.  budi@email.com  🟢BYOK  Active│ │
│ │ Ani R.   ani@email.com   🔵Pro   Active│ │
│ │ Candra   candra@mail.co  🟢BYOK  Susp. │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

> Admin panel menggunakan warna **Slate 800** (lebih gelap) sebagai pembeda dari user dashboard. Badge paket (🟢 BYOK / 🔵 Pro) ditampilkan di samping setiap user.
