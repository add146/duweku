# 09 — Referensi & Context7

Sumber riset dan panduan Context7 MCP untuk implementasi DuweKu.

---

## 1. Sumber Riset Catat Uang AI

### Dokumen Teknis

| # | Sumber | Link |
|---|--------|------|
| 📄 | Analisis Komprehensif (9 bab) | [Google Docs](https://docs.google.com/document/d/e/2PACX-1vTtdIcws1u-EYrj667RpcF7c_OKFnBagqX1cHOn27QG7ZrAe_Y0XTRK2VFi7PNAYRQcNiIVP0JZ6Y4J/pub) |
| 🌐 | Website Resmi | [catatuang.rumahdigital.net](https://catatuang.rumahdigital.net/) |

### Video Tutorial

| # | Judul | Link | Topik |
|---|-------|------|-------|
| 1 | Preview Cara CatatUang Pakai AI | [YouTube](https://www.youtube.com/watch?v=MyEEilIxitE) | Demo NLP input |
| 2 | Cara Setting API KEYS | [YouTube](https://www.youtube.com/watch?v=K-HSGbjwuh8) | BYOK setup |
| 3 | Hubungkan Telegram | [YouTube](https://www.youtube.com/watch?v=a5zP3ctDI1Y) | Telegram linking |
| 4 | Dashboard & Fitur | [YouTube](https://www.youtube.com/watch?v=f3PKVcpEIy0) | Dashboard tour |
| 5 | Setting Akun Pribadi | [YouTube](https://www.youtube.com/watch?v=rjv-4khCDYc) | Akun keuangan setup |
| 6 | Pengenalan Telegram | [YouTube](https://www.youtube.com/watch?v=WaC5N4Cr6E8) | Bot features |
| 7 | Kirim Text yang Benar | [YouTube](https://www.youtube.com/watch?v=FXTfDRUkGhQ) | Input format |
| 8 | Kirim Gambar (OCR) | [YouTube](https://www.youtube.com/watch?v=eBkG3-ops74) | Scan struk |
| 9 | Download Laporan | [YouTube](https://www.youtube.com/watch?v=anHSrJQHSpU) | Export Excel |
| 10 | Workspace Bisnis | [YouTube](https://www.youtube.com/watch?v=V5mKnvUESvI) | Multi-workspace |
| 11 | Switch Akun Bisnis | [YouTube](https://www.youtube.com/watch?v=cqLJ8OnTflA) | Switch workspace |
| 12 | Pindahkan Saldo Akun | [YouTube](https://www.youtube.com/watch?v=gcl7m8DD8iE) | Transfer antar akun |
| 13 | Hapus Data Inputan | [YouTube](https://www.youtube.com/watch?v=tU4MWrbs710) | Delete + rollback |
| 14 | Error & Limit AI | [YouTube](https://www.youtube.com/watch?v=71lv1MgYW_g) | Handle error 429 |
| 15 | Preview Terbaru | [YouTube](https://www.youtube.com/watch?v=jbOVlAmWJZs) | Latest UI preview |
| 16 | Family Plan | [YouTube](https://www.youtube.com/watch?v=xqSf9-XuyZk) | Invite anggota |
| 17 | Affiliate | [YouTube](https://www.youtube.com/watch?v=5CUcuxnFM-E) | Program afiliasi |

---

## 2. Context7 MCP — Referensi Dokumentasi Coding

**Context7** adalah MCP server yang menyediakan dokumentasi up-to-date langsung ke AI coding assistant. Saat implementasi, gunakan `use context7` untuk mendapatkan API signatures terbaru.

### Library → Context7 Query

| Library | Context7 Resolve ID | Fungsi di DuweKu |
|---------|---------------------|-------------------|
| `hono` | Hono - Web Framework | Backend routing, middleware, Workers binding |
| `drizzle-orm` | Drizzle ORM | Schema definition, D1 query builder |
| `@google/generative-ai` | Google Generative AI SDK | Gemini API client (NLP + Vision) |
| `grammy` | grammY - Telegram Bot Framework | Bot handler, inline keyboards, webhook |
| `react` | React | Frontend UI components |
| `@tanstack/react-query` | TanStack Query | Server state management, caching |
| `recharts` | Recharts | Dashboard charts (donut, line, bar) |
| `react-hook-form` | React Hook Form | Form handling + validation |
| `zod` | Zod | Schema validation (shared FE/BE) |
| `jose` | jose (JWT) | JWT sign/verify di Workers |
| `xlsx` / `sheetjs` | SheetJS | Generate Excel reports |
| `tailwindcss` | Tailwind CSS | Utility-first styling |

### Cara Pakai Context7

Saat coding, tambahkan `use context7` di prompt untuk mendapatkan:
1. **API signatures** terbaru sesuai versi
2. **Contoh kode** yang working
3. **Breaking changes** yang perlu diwaspadai

Contoh:
```
"Buatkan Hono route untuk handle POST /api/auth/login dengan D1 database, use context7"
```

Context7 akan resolve dokumentasi Hono terbaru dan memberikan contoh yang sesuai dengan versi yang dipakai, mencegah penggunaan API deprecated.

---

## 3. Dokumentasi Resmi (Bookmark)

| Teknologi | URL Dokumentasi |
|-----------|----------------|
| Cloudflare Workers | https://developers.cloudflare.com/workers/ |
| Cloudflare D1 | https://developers.cloudflare.com/d1/ |
| Cloudflare R2 | https://developers.cloudflare.com/r2/ |
| Cloudflare Pages | https://developers.cloudflare.com/pages/ |
| Hono.js | https://hono.dev/ |
| Drizzle ORM | https://orm.drizzle.team/ |
| Google Gemini API | https://ai.google.dev/docs |
| Telegram Bot API | https://core.telegram.org/bots/api |
| grammY | https://grammy.dev/ |
| React | https://react.dev/ |
| TanStack Query | https://tanstack.com/query |
| Recharts | https://recharts.org/ |
| Shadcn/ui | https://ui.shadcn.com/ |
| Tailwind CSS | https://tailwindcss.com/ |
