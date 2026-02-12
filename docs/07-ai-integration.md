# 07 — AI Integration (Google Gemini)

Detail integrasi Google Gemini API untuk NLP parsing dan OCR di DuweKu.

---

## 1. Dual AI Model (Global + BYOK)

DuweKu mendukung **2 mode** penggunaan Gemini API berdasarkan paket user:

### Mode Overview

| Mode | Disimpan di | Sumber API Key | Siapa yang bayar |
|------|-------------|----------------|------------------|
| **`global`** | `users.ai_mode = 'global'` | Platform global key (env `GEMINI_API_KEY`) | Platform (termasuk harga paket) |
| **`byok`** | `users.ai_mode = 'byok'` | Key milik user sendiri (encrypted di DB) | User (gratis dari Google) |

### Flow: Resolusi API Key

```
User kirim chat "kopi 15rb"
        │
        ▼
┌─ Worker Handler ──────────────────────────┐
│ 1. Ambil user dari DB                     │
│ 2. Cek user.ai_mode                       │
│    ┌──────────────┬──────────────────────┐ │
│    │ ai_mode =    │ ai_mode =            │ │
│    │ 'global'     │ 'byok'               │ │
│    ├──────────────┼──────────────────────┤ │
│    │ Ambil key    │ Ambil key dari       │ │
│    │ dari env:    │ user.gemini_api_key   │ │
│    │ GEMINI_API_  │ lalu decrypt         │ │
│    │ KEY          │                      │ │
│    └──────┬───────┴──────────┬───────────┘ │
│           │                  │              │
│           ▼                  ▼              │
│     ┌─────────────────────────────┐        │
│     │ 3. POST ke Google Gemini    │        │
│     │    pakai resolved API key   │        │
│     └─────────────────────────────┘        │
└────────────────────────────────────────────┘
```

### Error 429 Handling per Mode

| Situasi | Mode `byok` | Mode `global` |
|---------|-------------|---------------|
| Rate limit 429 | Switch ke `gemini_api_key_backup` user. Jika tidak ada, notify user buat key baru | Platform auto-rotate ke key pool berikutnya |
| Semua key habis | User harus buat key baru di AI Studio | Platform tanggung jawab, notify Super Admin |
| UI handling | Banner kuning + link ke aistudio.google.com | Banner: "Sedang ada gangguan, coba lagi nanti" |

---

## 2. NLP Prompt Engineering

### System Prompt (Untuk Parse Transaksi Teks)

```
Kamu adalah asisten pencatatan keuangan. User akan mengirim pesan dalam bahasa Indonesia
yang berisi informasi transaksi keuangan. Tugasmu adalah mengekstrak informasi transaksi
dan mengembalikan dalam format JSON.

RULES:
1. Tentukan "type": jika ada kata beli/bayar/jajan/belanja → "expense".
   Jika ada kata gaji/dapat/terima/bonus → "income".
   Jika ada kata transfer/pindah → "transfer".
2. Ekstrak "amount" (nominal uang). Konversi format Indonesia:
   - "25k" atau "25rb" → 25000
   - "5jt" atau "5juta" → 5000000
   - "1.5jt" → 1500000
3. Ekstrak "description" (deskripsi singkat transaksi).
4. Tentukan "category" dari konteks:
   - makanan/kopi/bakso/makan → "Makanan & Minuman"
   - bensin/grab/gojek/parkir → "Transportasi"
   - listrik/air/internet/wifi → "Utilitas"
   - belanja/baju/sepatu → "Belanja"
   - dll.
5. Jika ada nama akun (gopay/bca/cash/ovo/dana), set "account_name".
6. Jika ada tanggal, set "date" (format YYYY-MM-DD). Jika tidak, gunakan hari ini.

RESPONSE FORMAT (JSON only, no markdown):
{
  "type": "expense|income|transfer",
  "amount": 25000,
  "description": "Jajan bakso",
  "category": "Makanan & Minuman",
  "account_name": "Cash",
  "date": "2026-02-12",
  "confidence": 0.95
}

Jika tidak bisa diparse, return:
{ "error": true, "message": "Tidak bisa memahami transaksi" }
```

### Contoh Input → Output

| Input | JSON Output |
|-------|-------------|
| `"makan siang 20rb"` | `{"type":"expense","amount":20000,"description":"Makan siang","category":"Makanan & Minuman","confidence":0.95}` |
| `"gaji bulan ini 5jt"` | `{"type":"income","amount":5000000,"description":"Gaji bulan ini","category":"Gaji","confidence":0.98}` |
| `"beli bensin 50k pake bca"` | `{"type":"expense","amount":50000,"description":"Beli bensin","category":"Transportasi","account_name":"BCA","confidence":0.97}` |
| `"transfer bca ke gopay 200rb"` | `{"type":"transfer","amount":200000,"description":"Transfer","account_name":"BCA","transfer_to":"GoPay","confidence":0.96}` |

---

## 3. OCR Prompt (Untuk Scan Gambar)

### System Prompt (Gemini Vision)

```
Kamu adalah asisten pencatatan keuangan yang ahli membaca struk belanja dan bukti transfer.
Analisis gambar yang dikirim dan ekstrak informasi transaksi.

JENIS GAMBAR:
1. Struk fisik (Alfamart, Indomaret, restoran, dll)
2. Screenshot bukti transfer bank (BCA, Mandiri, BRI, dll)
3. Screenshot e-wallet (GoPay, OVO, DANA, dll)

EKSTRAK (JSON):
{
  "type": "expense|income|transfer",
  "amount": 87500,
  "description": "Belanja Alfamart",
  "merchant": "Alfamart Jl. Sudirman",
  "category": "Belanja",
  "date": "2026-02-12",
  "items": [
    {"name": "Indomie Goreng", "qty": 2, "price": 7000},
    {"name": "Aqua 600ml", "qty": 1, "price": 4000}
  ],
  "confidence": 0.85
}

Jika bukti transfer:
{
  "type": "expense",
  "amount": 500000,
  "description": "Transfer ke Budi",
  "bank_from": "BCA",
  "bank_to": "Mandiri",
  "date": "2026-02-12",
  "confidence": 0.90
}

Jika gambar tidak jelas, set confidence rendah dan beri "notes".
```

---

## 4. Implementation Code

### AI Service

```typescript
// worker/src/services/ai-service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { decryptApiKey } from "./crypto-service";

interface ParsedTransaction {
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  category?: string;
  account_name?: string;
  transfer_to?: string;
  date?: string;
  confidence: number;
  error?: boolean;
  message?: string;
}

// Resolve API key berdasarkan ai_mode user
function resolveApiKey(user: User, env: Env): string {
  if (user.ai_mode === "global") {
    // Paket Pro: pakai global key platform
    return env.GEMINI_API_KEY; // set via wrangler secret
  } else {
    // Paket BYOK: pakai key user sendiri (decrypt dari DB)
    if (!user.gemini_api_key) {
      throw new Error("API key belum diatur. Buka Pengaturan → API Key.");
    }
    return decryptApiKey(user.gemini_api_key, env.ENCRYPTION_SECRET);
  }
}

export class AIService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // Factory method: buat instance dari user + env
  static fromUser(user: User, env: Env): AIService {
    const key = resolveApiKey(user, env);
    return new AIService(key);
  }

  async parseTextTransaction(input: string): Promise<ParsedTransaction> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent([SYSTEM_PROMPT, input]);
    const text = result.response.text();
    return JSON.parse(text);
  }

  async parseImageTransaction(imageBase64: string, mimeType: string): Promise<ParsedTransaction> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    const result = await model.generateContent([
      OCR_SYSTEM_PROMPT,
      { inlineData: { data: imageBase64, mimeType } }
    ]);
    const text = result.response.text();
    return JSON.parse(text);
  }
}
```

### Encryption Service (Untuk API Key)

```typescript
// worker/src/services/crypto-service.ts
export async function encryptApiKey(key: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), "PBKDF2", false, ["deriveKey"]
  );
  const derivedKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: encoder.encode("duweku-salt"), iterations: 100000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, derivedKey, encoder.encode(key)
  );
  // Return iv + encrypted as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}
```

---

## 5. Error Handling

| Error | Kode | Handling |
|-------|------|---------|
| Rate limit | 429 | Auto-switch ke backup key. Jika tidak ada, notify user |
| Invalid key | 401/403 | Notify user: "API key tidak valid" |
| Quota exceeded | 429 | Panduan buat key baru |
| Parse failure | — | Minta user reformulasi input |
| Network error | 500/503 | Retry 1x, lalu error message |
| Low confidence (<0.7) | — | Minta konfirmasi manual dari user |

---

## 6. Confidence Threshold

| Confidence | Aksi |
|------------|------|
| ≥ 0.9 | Auto-save, kirim konfirmasi |
| 0.7 - 0.89 | Kirim preview, minta konfirmasi [✅/❌] |
| < 0.7 | "🤔 Saya kurang yakin. Bisa diperjelas?" |
