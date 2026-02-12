# 06 — Telegram Bot Integration

Detail integrasi Telegram Bot sebagai frontend chat DuweKu.

---

## 1. Arsitektur Bot

```
Telegram Server
    │
    │ Webhook (HTTPS POST)
    ▼
Cloudflare Worker
    │
    ├── /webhook/telegram (route)
    │       │
    │       ▼
    │   Grammy Framework
    │       │
    │       ├── on("message:text")  → NLP Processing
    │       ├── on("message:photo") → OCR Processing
    │       ├── on("callback_query") → Button Actions
    │       └── on("command")       → Bot Commands
    │
    ├── AI Service (Gemini API)
    ├── Transaction Service (D1)
    └── R2 Storage (images)
```

---

## 2. Setup Webhook

### Registrasi Bot
1. Chat `@BotFather` di Telegram
2. `/newbot` → beri nama: **DuweKu Bot**
3. Dapatkan `BOT_TOKEN`
4. Simpan sebagai Wrangler secret: `wrangler secret put TELEGRAM_BOT_TOKEN`

### Set Webhook URL
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.duweku.my.id/webhook/telegram"}'
```

---

## 3. Bot Commands

| Command | Fungsi | Contoh Response |
|---------|--------|-----------------|
| `/start` | Welcome message + panduan | "Selamat datang di DuweKu! 🎉" |
| `/help` | Daftar command & cara pakai | Menu bantuan lengkap |
| `/saldo` | Cek saldo semua akun | "💰 Cash: Rp500.000\n🏦 BCA: Rp2.000.000" |
| `/switch` | Ganti workspace aktif | Inline keyboard pilih workspace |
| `/transfer` | Transfer antar akun | "Pilih akun asal:" (inline keyboard) |
| `/hapus` | Hapus transaksi terakhir | Konfirmasi + rollback |
| `/laporan` | Ringkasan bulan ini | Income/Expense summary |
| `/link` | Status koneksi Telegram | "✅ Terhubung ke: budi@email.com" |

---

## 4. Message Handling

### 4.1 Text Message → NLP

```
User: "jajan bakso 25k"
         │
         ▼
┌─ Grammy Handler ────────────────────────┐
│ 1. Cari user by chat_id                 │
│ 2. Ambil active_workspace_id            │
│ 3. Ambil gemini_api_key (decrypt)       │
│ 4. Kirim ke Gemini API dengan prompt    │
│ 5. Parse JSON response                  │
│ 6. Insert transaction ke D1             │
│ 7. Update account balance               │
│ 8. Kirim konfirmasi ke user             │
└─────────────────────────────────────────┘
         │
         ▼
Bot Reply:
"✅ Transaksi Dicatat!
📝 Jajan bakso
💸 Pengeluaran: Rp25.000
🏷️ Kategori: Makanan
💳 Akun: Cash
📅 12 Feb 2026

[✏️ Edit] [❌ Hapus]"
```

### 4.2 Photo Message → OCR

```
User: 📷 (foto struk Alfamart)
         │
         ▼
┌─ Grammy Handler ────────────────────────┐
│ 1. Download foto via Telegram API       │
│ 2. Upload ke R2 Storage                 │
│ 3. Convert ke base64                    │
│ 4. Kirim ke Gemini Vision API           │
│ 5. Parse hasil OCR                      │
│ 6. Kirim ringkasan + minta konfirmasi  │
└─────────────────────────────────────────┘
         │
         ▼
Bot Reply:
"📋 Hasil Scan Struk:
🏪 Alfamart Jl. Sudirman
📅 12 Feb 2026
💰 Total: Rp87.500

Apakah data ini benar?
[✅ Ya, Simpan] [✏️ Edit] [❌ Batal]"
```

### 4.3 Callback Query (Button Actions)

```typescript
// Ketika user klik inline button
bot.callbackQuery("confirm_tx:TX_ID", async (ctx) => {
  // Simpan transaksi ke DB
  // Update saldo
  await ctx.answerCallbackQuery("✅ Tersimpan!");
  await ctx.editMessageText("✅ Transaksi berhasil disimpan.");
});

bot.callbackQuery("delete_tx:TX_ID", async (ctx) => {
  // Hapus transaksi
  // Rollback saldo
  await ctx.answerCallbackQuery("🗑️ Dihapus!");
  await ctx.editMessageText("🗑️ Transaksi dibatalkan, saldo dikembalikan.");
});
```

---

## 5. Telegram Linking Flow (Detail)

### Generate Token (Dashboard → DB)
```typescript
// POST /api/settings/telegram/generate-token
const token = crypto.randomUUID().slice(0, 8); // "a1b2c3d4"
const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

await db.update(users)
  .set({ telegram_link_token: token, telegram_token_expires: expires.toISOString() })
  .where(eq(users.id, userId));

return { token, expires_at: expires };
```

### Verify Token (Bot → DB)
```typescript
// Ketika bot menerima pesan yang looks like token
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;

  // Cek apakah ini token (format: 8 char alphanum)
  if (/^[a-z0-9]{8}$/.test(text)) {
    const user = await db.select().from(users)
      .where(eq(users.telegram_link_token, text))
      .where(gt(users.telegram_token_expires, new Date().toISOString()))
      .get();

    if (user) {
      await db.update(users)
        .set({
          telegram_chat_id: String(ctx.from.id),
          telegram_link_token: null,
          telegram_token_expires: null
        })
        .where(eq(users.id, user.id));

      await ctx.reply("✅ Akun berhasil dihubungkan! Ketik /help untuk mulai.");
    } else {
      await ctx.reply("❌ Token tidak valid atau sudah expired.");
    }
    return;
  }

  // Else: proses sebagai transaksi...
});
```

---

## 6. Error Messages

| Situasi | Pesan Bot |
|---------|-----------|
| User belum terhubung | "⚠️ Akun belum terhubung. Buka dashboard → Pengaturan → Telegram untuk menghubungkan." |
| API key belum diset | "🔑 API key belum diatur. Buka dashboard → Pengaturan → API Key." |
| Gemini 429 (rate limit) | "⚠️ Kuota AI habis! Buat API key baru di aistudio.google.com lalu update di Pengaturan." |
| AI gagal parse | "🤔 Maaf, saya tidak mengerti. Coba format: 'beli kopi 15rb'" |
| Workspace belum ada | "📂 Belum ada workspace. Buka dashboard untuk buat workspace pertama." |
