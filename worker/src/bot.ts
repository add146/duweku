import { Bot, InlineKeyboard } from "grammy";
import { eq, and, sql, not, or, isNull } from "drizzle-orm";
import { createDb } from "./db";
import { users, transactions, accounts, workspaces, workspaceMembers, categories } from "./db/schema";
import { Env } from "./index";
import { MyContext } from "./bot-instance";
import { resolveGeminiKey, resolveGeminiConfig, parseTransactionText, parseReceiptImage, parseIndonesianAmount } from "./services/gemini-service";
import { v4 as uuidv4 } from "uuid";

export const initBot = (bot: Bot<MyContext>, env: Env) => {
    const db = createDb(env.DB);

    const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

    function translateType(type: string, upper = false) {
        if (type === 'income') return upper ? 'PEMASUKAN' : 'Pemasukan';
        if (type === 'expense') return upper ? 'PENGELUARAN' : 'Pengeluaran';
        if (type === 'transfer') return upper ? 'TRANSFER' : 'Transfer';
        return upper ? type.toUpperCase() : type;
    }

    // Command: /start <token>
    bot.command("start", async (ctx) => {
        const args = ctx.match;
        if (!args) {
            return ctx.reply("Selamat datang di DuweKu Bot! Silakan hubungkan akun Anda melalui dashboard web.\n\n" + getHelpMessage(), { parse_mode: "Markdown" });
        }

        try {
            const { jwtVerify } = await import('jose');
            const secret = new TextEncoder().encode(env.JWT_SECRET);
            const { payload } = await jwtVerify(args, secret);

            const userId = payload.sub as string;
            if (!userId) throw new Error("Invalid token");

            const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
            if (!user) throw new Error("User not found");

            await db.update(users)
                .set({ telegram_chat_id: ctx.chat.id.toString() })
                .where(eq(users.id, userId));

            const welcomeMsg = `🤝 **Halo, ${user.name}!**\n\n` +
                `Akun DuweKu Anda berhasil terhubung dengan Telegram. Sekarang Anda bisa mencatat keuangan langsung dari sini!\n\n` +
                getHelpMessage();

            return ctx.reply(welcomeMsg, { parse_mode: "Markdown" });
        } catch (e) {
            return ctx.reply("❌ Token tautan tidak valid atau kadaluwarsa.");
        }
    });

    // Helper: Shared help message
    function getHelpMessage() {
        return `📖 *Panduan Penggunaan DuweKu Bot:*\n\n` +
            `/saldo - Cek semua saldo akun Anda\n` +
            `/transaksi - Lihat 5 transaksi terakhir\n` +
            `/transfer - Pindah saldo antar akun (Terpandu)\n` +
            `/gantisaldo - Pilih akun default untuk transaksi\n` +
            `/help - Tampilkan pesan bantuan ini\n` +
            `/info - Sama seperti /help\n\n` +
            `💡 *Tips:*\n` +
            `• *Kirim Teks*: Ketik pesan seperti "Beli kopi 20rb" untuk mencatat transaksi secara otomatis.\n` +
            `• *Kirim Foto*: Kirim foto struk belanja untuk dianalisa oleh AI DuweKu.\n\n` +
            `Pastikan akun Anda sudah terhubung via Dashboard Web.`;
    }

    // Command: /help & /info
    bot.command(["help", "info"], async (ctx) => {
        return ctx.reply(getHelpMessage(), { parse_mode: "Markdown" });
    });

    // Command: /saldo
    bot.command("saldo", async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const user = await db.query.users.findFirst({ where: eq(users.telegram_chat_id, chatId) });
        if (!user) return ctx.reply("Silakan hubungkan akun Anda terlebih dahulu.");

        const ws = await db.query.workspaces.findFirst({
            where: and(eq(workspaces.owner_id, user.id), eq(workspaces.type, 'personal'))
        });

        if (!ws) return ctx.reply("Workspace personal tidak ditemukan.");

        const accs = await db.query.accounts.findMany({
            where: and(eq(accounts.workspace_id, ws.id), eq(accounts.is_active, true))
        });

        if (accs.length === 0) return ctx.reply("Tidak ada akun ditemukan.");

        const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
        let msg = "💰 *Saldo Anda:*\n\n";
        let total = 0;
        accs.forEach(acc => {
            msg += `*${acc.name}*: ${formatter.format(acc.balance)}\n`;
            total += acc.balance;
        });

        msg += `\n────────────────\n`;
        msg += `*Total:* ${formatter.format(total)}`;

        return ctx.reply(msg, { parse_mode: "Markdown" });
    });

    // Command: /transaksi
    bot.command("transaksi", async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const user = await db.query.users.findFirst({ where: eq(users.telegram_chat_id, chatId) });
        if (!user) return ctx.reply("Silakan hubungkan akun Anda terlebih dahulu.");

        const latestTxs = await db.select({
            id: transactions.id,
            amount: transactions.amount,
            type: transactions.type,
            date: transactions.date,
            description: transactions.description,
            categoryName: categories.name,
            accountName: accounts.name
        })
            .from(transactions)
            .leftJoin(categories, eq(transactions.category_id, categories.id))
            .leftJoin(accounts, eq(transactions.account_id, accounts.id))
            .where(eq(transactions.user_id, user.id))
            .orderBy(sql`${transactions.date} DESC`, sql`${transactions.created_at} DESC`)
            .limit(5);

        if (latestTxs.length === 0) return ctx.reply("Tidak ada transaksi ditemukan.");

        let msg = "📝 *5 Transaksi Terakhir:*\n\n";
        latestTxs.forEach(tx => {
            const icon = tx.type === 'income' ? '📈' : tx.type === 'expense' ? '📉' : '🔄';
            msg += `${icon} *${tx.date}* - ${translateType(tx.type)}\n`;
            msg += `    *${formatter.format(tx.amount)}* (${tx.categoryName || 'Tanpa Kategori'})\n`;
            msg += `    ${tx.description || '-'}\n`;
            msg += `    via ${tx.accountName}\n\n`;
        });

        return ctx.reply(msg, { parse_mode: "Markdown" });
    });

    // Command: /gantisaldo
    bot.command("gantisaldo", async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const user = await db.query.users.findFirst({ where: eq(users.telegram_chat_id, chatId) });
        if (!user) return ctx.reply("Silakan hubungkan akun Anda terlebih dahulu.");

        const ws = await db.query.workspaces.findFirst({
            where: and(eq(workspaces.owner_id, user.id), eq(workspaces.type, 'personal'))
        });

        if (!ws) return ctx.reply("Workspace personal tidak ditemukan.");

        const accs = await db.query.accounts.findMany({ where: eq(accounts.workspace_id, ws.id) });
        if (accs.length === 0) return ctx.reply("Tidak ada akun ditemukan.");

        const keyboard = new InlineKeyboard();
        accs.forEach((acc, index) => {
            keyboard.text(`${acc.is_default ? '⭐ ' : ''}${acc.name}`, `set_default:${acc.id}`);
            if ((index + 1) % 2 === 0) keyboard.row();
        });

        return ctx.reply("Pilih akun default untuk transaksi:", { reply_markup: keyboard });
    });

    // Command: /transfer (Guided Transfer)
    bot.command("transfer", async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const user = await db.query.users.findFirst({ where: eq(users.telegram_chat_id, chatId) });
        if (!user) return ctx.reply("Silakan hubungkan akun Anda terlebih dahulu.");

        const ws = await db.query.workspaces.findFirst({
            where: and(eq(workspaces.owner_id, user.id), eq(workspaces.type, 'personal'))
        });

        if (!ws) return ctx.reply("Workspace personal tidak ditemukan.");

        const accs = await db.query.accounts.findMany({
            where: and(eq(accounts.workspace_id, ws.id), eq(accounts.is_active, true))
        });
        if (accs.length === 0) return ctx.reply("Tidak ada akun ditemukan.");

        const keyboard = new InlineKeyboard();
        accs.forEach((acc, index) => {
            keyboard.text(acc.name, `tr_from:${acc.id}`);
            if ((index + 1) % 2 === 0) keyboard.row();
        });

        return ctx.reply("💸 *Transfer Saldo*\nPilih akun asal (Satu):", { reply_markup: keyboard, parse_mode: "Markdown" });
    });

    // Callback tr_from
    bot.callbackQuery(/^tr_from:(.+)$/, async (ctx) => {
        try {
            const fromId = ctx.match[1];
            const accFrom = await db.query.accounts.findFirst({ where: eq(accounts.id, fromId) });
            if (!accFrom) return ctx.answerCallbackQuery("Akun tidak ditemukan.");

            const accsTo = await db.query.accounts.findMany({
                where: and(
                    eq(accounts.workspace_id, accFrom.workspace_id),
                    eq(accounts.is_active, true),
                    not(eq(accounts.id, fromId))
                )
            });

            if (accsTo.length === 0) {
                await ctx.reply("Tidak ada akun lain untuk tujuan transfer.");
                return ctx.answerCallbackQuery();
            }

            const keyboard = new InlineKeyboard();
            accsTo.forEach((acc: any, index: number) => {
                keyboard.text(acc.name, `tr_to:${acc.id}`);
                if ((index + 1) % 2 === 0) keyboard.row();
            });

            await ctx.editMessageText(`💸 *Transfer Saldo*\nDari: *${accFrom.name}*\n\nPilih akun tujuan:`, { reply_markup: keyboard, parse_mode: "Markdown" });
            await ctx.answerCallbackQuery();
        } catch (e: any) {
            console.error("tr_from error:", e);
            await ctx.reply(`Gagal memilih akun asal: ${e.message}`);
            await ctx.answerCallbackQuery("Terjadi kesalahan.");
        }
    });

    // Callback tr_to (Ask for amount)
    bot.callbackQuery(/^tr_to:(.+)$/, async (ctx) => {
        try {
            const toId = ctx.match[1];

            // Context recovery from message text
            const msgText = ctx.callbackQuery.message?.text || "";
            const fromMatch = msgText.match(/Dari:\s*(.+)/);
            if (!fromMatch) return ctx.answerCallbackQuery("Konteks hilang.");
            const fromName = fromMatch[1].replace(/\*/g, '').trim();

            const chatId = ctx.chat?.id.toString();
            const user = await db.query.users.findFirst({ where: eq(users.telegram_chat_id, chatId!) });
            if (!user) return ctx.answerCallbackQuery("User tidak ditemukan.");

            const wsInfo = await getPersonalWorkspace(user.id);
            if (!wsInfo) return ctx.answerCallbackQuery("Workspace tidak ditemukan.");

            const allAccounts = await db.query.accounts.findMany({
                where: and(eq(accounts.workspace_id, wsInfo.workspaceId), eq(accounts.is_active, true))
            });
            const accFrom = allAccounts.find(a => a.name === fromName);
            const accTo = allAccounts.find(a => a.id === toId);

            if (!accFrom || !accTo) return ctx.answerCallbackQuery("Akun tidak ditemukan.");

            await ctx.reply(
                `💸 *Transfer Saldo*\nDari: *${accFrom.name}*\nKe: *${accTo.name}*\n\nBerapa jumlah yang ingin ditransfer?\n(Balas pesan ini dengan angka saja)`,
                {
                    reply_markup: { force_reply: true, selective: true },
                    parse_mode: "Markdown"
                }
            );
            await ctx.answerCallbackQuery();
        } catch (e: any) {
            console.error("tr_to error:", e);
            await ctx.reply(`Gagal memilih akun tujuan: ${e.message}`);
            await ctx.answerCallbackQuery("Terjadi kesalahan.");
        }
    });

    // Helper: Get Personal Workspace & Account
    async function getPersonalWorkspace(userId: string) {
        const items = await db.select({
            workspaceId: workspaces.id,
            accountId: accounts.id,
            accountName: accounts.name
        })
            .from(workspaces)
            .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspace_id))
            .innerJoin(accounts, eq(workspaces.id, accounts.workspace_id))
            .where(and(
                eq(workspaceMembers.user_id, userId),
                eq(workspaces.type, 'personal')
            ))
            .limit(1);
        return items[0] || null;
    }

    // Handle Text Messages (NLP)
    bot.on("message:text", async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const user = await db.query.users.findFirst({
            where: eq(users.telegram_chat_id, chatId),
        });

        if (!user) return ctx.reply("Silakan hubungkan akun Anda terlebih dahulu.");

        const text = ctx.message.text;

        // Check if this is a reply to a transfer amount prompt
        if (ctx.message.reply_to_message && ctx.message.reply_to_message.text?.includes("Transfer Saldo")) {
            const replyText = ctx.message.reply_to_message.text;
            const fromMatch = replyText.match(/Dari:\s*(.+)/);
            const toMatch = replyText.match(/Ke:\s*(.+)/);

            if (fromMatch && toMatch) {
                const amount = parseIndonesianAmount(text);
                if (isNaN(amount) || amount <= 0) {
                    return ctx.reply("Format jumlah tidak valid. Silakan balas dengan angka atau format seperti 20k/20rb.");
                }

                const fromName = fromMatch[1].replace(/\*/g, '').trim();
                const toName = toMatch[1].replace(/\*/g, '').trim();

                await ctx.reply("⏳ Memproses transfer...");

                try {
                    const wsInfo = await getPersonalWorkspace(user.id);
                    if (!wsInfo) throw new Error("Workspace tidak ditemukan");

                    const allAccounts = await db.query.accounts.findMany({ where: eq(accounts.workspace_id, wsInfo.workspaceId) });
                    const accFrom = allAccounts.find((a: any) => a.name === fromName);
                    const accTo = allAccounts.find((a: any) => a.name === toName);

                    if (!accFrom || !accTo) throw new Error("Akun tidak ditemukan atau tidak sesuai");

                    const txResult = {
                        type: "transfer",
                        amount: amount,
                        description: `Transfer dari ${fromName} ke ${toName}`,
                        date: new Date().toISOString().split('T')[0],
                        from_account_guess: fromName,
                        to_account_guess: toName
                    };

                    return await handleTransactionResult(ctx, db, user, txResult, wsInfo, []);
                } catch (e: any) {
                    return ctx.reply(`Kesalahan saat memproses transfer manual: ${e.message}`);
                }
            }
        }

        await ctx.reply("⏳ Membaca teks...");

        try {
            // 1. Get Workspace & Categories
            const wsInfo = await getPersonalWorkspace(user.id);
            let categoryNames: string[] = [];
            let allCategories: any[] = [];

            if (wsInfo) {
                allCategories = await db.query.categories.findMany({
                    where: or(
                        eq(categories.workspace_id, wsInfo.workspaceId),
                        isNull(categories.workspace_id)
                    )
                });
                categoryNames = allCategories.map(c => c.name);
            }

            // 2. AI processing with categories
            const apiKey = await resolveGeminiKey(user, env);
            const config = await resolveGeminiConfig(env);
            const result = await parseTransactionText(text, apiKey, config.textModel, categoryNames);

            if (result.is_transaction === false) {
                return ctx.reply(result.reply || "Saya hanya bisa memproses pesan terkait transaksi keuangan.");
            }

            // 3. Handle Results (can be multiple)
            const txs = result.transactions || (result.amount ? [result] : []);

            if (txs.length > 1) {
                const batchId = uuidv4();
                const prepared = [];
                for (const t of txs) {
                    const data = await prepareTransactionData(db, user, t, wsInfo, allCategories);
                    if (data) prepared.push({ ...data, batch_id: batchId, source: 'telegram_text', status: 'pending' });
                }

                if (prepared.length) {
                    await db.insert(transactions).values(prepared.map(({ account_name, category_name, transfer_to_account_name, ...rest }: any) => rest));

                    let msg = `📋 **Mohon konfirmasi ${prepared.length} transaksi:**\n\n`;
                    prepared.forEach((p, i) => {
                        msg += `${i + 1}. ${translateType(p.type, true)} ${formatter.format(p.amount)}\n   📖 ${p.category_name}: ${p.description}\n\n`;
                    });

                    const kb = new InlineKeyboard()
                        .text("✅ Konfirmasi Semua", `confirm_batch:${batchId}`)
                        .text("🗑 Hapus Semua", `delete_batch:${batchId}`);

                    await ctx.reply(msg, { reply_markup: kb, parse_mode: "Markdown" });
                }
            } else if (txs.length === 1) {
                await handleTransactionResult(ctx, db, user, txs[0], wsInfo, allCategories);
            }

        } catch (e: any) {
            console.error("Bot Error:", e);
            await ctx.reply(`Error: ${e.message}`);
        }
    });

    // Handle Photo Messages (OCR)
    bot.on("message:photo", async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const user = await db.query.users.findFirst({
            where: eq(users.telegram_chat_id, chatId),
        });

        if (!user) return ctx.reply("Silakan hubungkan akun Anda terlebih dahulu.");

        await ctx.reply("⏳ Menganalisa struk...");

        try {
            const photo = ctx.message.photo[ctx.message.photo.length - 1];
            const file = await ctx.api.getFile(photo.file_id);
            const url = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            const chunkSize = 8192;
            for (let i = 0; i < bytes.length; i += chunkSize) {
                binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
            }
            const base64 = btoa(binary);

            // 1. Get Workspace & Categories
            const wsInfo = await getPersonalWorkspace(user.id);
            let categoryNames: string[] = [];
            let allCategories: any[] = [];

            if (wsInfo) {
                allCategories = await db.query.categories.findMany({
                    where: or(
                        eq(categories.workspace_id, wsInfo.workspaceId),
                        isNull(categories.workspace_id)
                    )
                });
                categoryNames = allCategories.map(c => c.name);
            }

            // 2. AI Processing
            const apiKey = await resolveGeminiKey(user, env);
            const config = await resolveGeminiConfig(env);
            const imageParts = [{ inlineData: { data: base64, mimeType: "image/jpeg" } }];
            const result = await parseReceiptImage(imageParts, apiKey, config.imageModel, categoryNames);

            // Map to transaction format
            const txResult = {
                ...result,
                type: result.type || "expense",
                amount: result.total,
                description: `${result.merchant || "Merchant Tidak Diketahui"} (${result.items?.length || 0} item)`,
                date: result.date,
                category_guess: result.category_guess
            };

            await handleTransactionResult(ctx, db, user, txResult, wsInfo, allCategories);

        } catch (e: any) {
            console.error(e);
            await ctx.reply(`Kesalahan saat menganalisa gambar: ${e.message}`);
        }
    });

    // Reusable helpers
    async function prepareTransactionData(db: any, user: any, result: any, wsInfo: any, allCategories: any[]) {
        if (!wsInfo) return null;

        const { workspaceId } = wsInfo;
        const allAccounts = await db.query.accounts.findMany({
            where: and(eq(accounts.workspace_id, workspaceId), eq(accounts.is_active, true))
        });
        const defaultAccount = allAccounts.find((a: any) => a.is_default) || allAccounts[0];

        if (!allAccounts.length) return null;

        let sourceAccountId = defaultAccount.id;
        let sourceAccountName = defaultAccount.name;
        let targetAccountId = null;
        let targetAccountName = null;

        if (result.from_account_guess) {
            const guess = result.from_account_guess.toLowerCase();
            const matched = allAccounts.find((a: any) => a.name.toLowerCase().includes(guess));
            if (matched) {
                sourceAccountId = matched.id;
                sourceAccountName = matched.name;
            }
        }

        if (result.type === 'transfer' && result.to_account_guess) {
            const guess = result.to_account_guess.toLowerCase();
            const matched = allAccounts.find((a: any) => a.name.toLowerCase().includes(guess) && a.id !== sourceAccountId);
            if (matched) {
                targetAccountId = matched.id;
                targetAccountName = matched.name;
            }
        }

        let categoryId = null;
        let categoryName = "Tanpa Kategori";
        if (result.category_guess) {
            const guess = result.category_guess.toLowerCase();
            const matchedCategory = allCategories.find((c: any) =>
                c.name.toLowerCase() === guess ||
                c.name.toLowerCase().includes(guess)
            );
            if (matchedCategory) {
                categoryId = matchedCategory.id;
                categoryName = matchedCategory.name;
            }
        }

        return {
            id: uuidv4(),
            workspace_id: workspaceId,
            account_id: sourceAccountId,
            account_name: sourceAccountName,
            transfer_to_account_id: targetAccountId,
            transfer_to_account_name: targetAccountName,
            user_id: user.id,
            type: result.type,
            amount: result.amount,
            description: result.description,
            date: result.date || new Date().toISOString().split('T')[0],
            category_id: categoryId,
            category_name: categoryName
        };
    }

    async function handleTransactionResult(ctx: any, db: any, user: any, result: any, wsInfo: any, allCategories: any[]) {
        if (!wsInfo) {
            return ctx.reply("Workspace/akun personal tidak ditemukan.");
        }

        const { workspaceId } = wsInfo;
        const allAccounts = await db.query.accounts.findMany({
            where: and(eq(accounts.workspace_id, workspaceId), eq(accounts.is_active, true))
        });
        const defaultAccount = allAccounts.find((a: any) => a.is_default) || allAccounts[0];

        if (!allAccounts.length) {
            return ctx.reply("Tidak ada akun di workspace Anda.");
        }

        // --- Account Matching Logic ---
        let sourceAccountId = defaultAccount.id;
        let sourceAccountName = defaultAccount.name;
        let targetAccountId = null;
        let targetAccountName = null;

        if (result.from_account_guess) {
            const guess = result.from_account_guess.toLowerCase();
            const matched = allAccounts.find((a: any) => a.name.toLowerCase().includes(guess));
            if (matched) {
                sourceAccountId = matched.id;
                sourceAccountName = matched.name;
            }
        }

        if (result.type === 'transfer' && result.to_account_guess) {
            const guess = result.to_account_guess.toLowerCase();
            const matched = allAccounts.find((a: any) => a.name.toLowerCase().includes(guess) && a.id !== sourceAccountId);
            if (matched) {
                targetAccountId = matched.id;
                targetAccountName = matched.name;
            } else {
                return ctx.reply(`Mohon maaf, saya tidak dapat menemukan akun tujuan "${result.to_account_guess}".`);
            }
        }
        // -------------------------------

        // --- Category Matching Logic ---
        let categoryId = null;
        let categoryName = "Tanpa Kategori";

        if (result.category_guess) {
            // AI returned an exact name from our list (or a guess)
            const guess = result.category_guess.toLowerCase();

            // Try exact/fuzzy match against fetched categories
            const matchedCategory = allCategories.find((c: any) =>
                c.name.toLowerCase() === guess ||
                c.name.toLowerCase().includes(guess)
            );

            if (matchedCategory) {
                categoryId = matchedCategory.id;
                categoryName = matchedCategory.name;
            }
        }
        // -------------------------------

        const txId = uuidv4();
        await db.insert(transactions).values({
            id: txId,
            workspace_id: workspaceId,
            account_id: sourceAccountId,
            transfer_to_account_id: targetAccountId,
            user_id: user.id,
            type: result.type as any,
            amount: result.amount,
            description: result.description,
            date: result.date || new Date().toISOString().split('T')[0],
            source: ctx.message.photo ? 'telegram_image' : 'telegram_text',
            status: 'pending',
            category_id: categoryId,
        });

        const keyboard = new InlineKeyboard()
            .text("✅ Konfirmasi", `confirm:${txId}`)
            .text("🗑 Hapus", `delete:${txId}`)
            .row();

        if (result.type === 'transfer') {
            keyboard.text("💸 Jadikan Pengeluaran", `switch_to_expense:${txId}`);
        } else if (result.type === 'expense') {
            keyboard.text("🔄 Jadikan Transfer", `switch_to_transfer:${txId}`);
        }

        let detailMsg = `Mohon konfirmasi:\n` +
            `Tipe: ${translateType(result.type)}\n` +
            `Jumlah: ${formatter.format(result.amount)}\n` +
            `Kategori: ${categoryName}\n` +
            `Ket: ${result.description}\n` +
            `Akun: ${sourceAccountName}`;

        if (result.type === 'transfer' && targetAccountName) {
            detailMsg += `\nKe Akun: ${targetAccountName}`;
        }

        detailMsg += `\nDate: ${result.date}`;

        await ctx.reply(detailMsg, { reply_markup: keyboard });
    }

    // Confirm/Delete logic (unchanged)
    bot.callbackQuery(/^confirm:(.+)$/, async (ctx) => {
        const txId = ctx.match[1];
        const tx = await db.query.transactions.findFirst({ where: eq(transactions.id, txId) });

        if (!tx || tx.status !== 'pending') {
            return ctx.answerCallbackQuery("Transaksi sudah diproses.");
        }

        try {
            const acc = await db.query.accounts.findFirst({ where: eq(accounts.id, tx.account_id!) });
            if (!acc) throw new Error("Akun tidak ditemukan");

            // Balance Check for Expense/Transfer
            if (tx.type !== 'income' && acc.balance < tx.amount) {
                await ctx.reply(`⚠️ Peringatan: Saldo ${acc.name} tidak cukup (${acc.balance}), tetap simpan?`);
                // Proceed anyway as confirmed by user clicking confirm? 
                // Or stop? The user specifically asked for "notifikasi jika saldo tidak sesuai".
                // I'll show the warning and proceed since they clicked "Confirm".
            }

            const batch = [
                db.update(transactions).set({ status: 'confirmed' }).where(eq(transactions.id, txId)),
            ];

            if (tx.type === 'income') {
                batch.push(db.update(accounts).set({ balance: sql`${accounts.balance} + ${tx.amount}` }).where(eq(accounts.id, tx.account_id!)) as any);
            } else if (tx.type === 'expense') {
                batch.push(db.update(accounts).set({ balance: sql`${accounts.balance} - ${tx.amount}` }).where(eq(accounts.id, tx.account_id!)) as any);
            } else if (tx.type === 'transfer' && tx.transfer_to_account_id) {
                batch.push(db.update(accounts).set({ balance: sql`${accounts.balance} - ${tx.amount}` }).where(eq(accounts.id, tx.account_id!)) as any);
                batch.push(db.update(accounts).set({ balance: sql`${accounts.balance} + ${tx.amount}` }).where(eq(accounts.id, tx.transfer_to_account_id!)) as any);
            }

            await db.batch(batch as any);

            await ctx.editMessageText(`✅ Berhasil disimpan!\n${translateType(tx.type, true)} ${formatter.format(tx.amount)}\n${tx.description}`);
            await ctx.answerCallbackQuery("Konfirmasi Berhasil!");
        } catch (e) {
            console.error(e);
            await ctx.answerCallbackQuery("Gagal menyimpan.");
        }
    });

    bot.callbackQuery(/^delete:(.+)$/, async (ctx) => {
        const txId = ctx.match[1];
        await db.delete(transactions).where(eq(transactions.id, txId));
        await ctx.editMessageText("🗑 Dihapus.");
        await ctx.answerCallbackQuery("Dihapus.");
    });

    bot.callbackQuery(/^switch_to_expense:(.+)$/, async (ctx) => {
        const txId = ctx.match[1];
        const tx = await db.query.transactions.findFirst({ where: eq(transactions.id, txId) });
        if (!tx || tx.status !== 'pending') return ctx.answerCallbackQuery("Sudah diproses.");

        await db.update(transactions).set({ type: 'expense', transfer_to_account_id: null }).where(eq(transactions.id, txId));
        await ctx.answerCallbackQuery("Diubah ke Pengeluaran");

        // Refresh message
        const user = await db.query.users.findFirst({ where: eq(users.telegram_chat_id, ctx.chat!.id.toString()) });
        const wsInfo = await getPersonalWorkspace(user!.id);
        const allCategories = await db.query.categories.findMany(); // Simplification for refresh
        await handleTransactionResult(ctx, db, user, { ...tx, type: 'expense', category_guess: tx.category_id ? (allCategories.find(c => c.id === tx.category_id)?.name || null) : null }, wsInfo, allCategories);
    });

    bot.callbackQuery(/^switch_to_transfer:(.+)$/, async (ctx) => {
        const txId = ctx.match[1];
        const tx = await db.query.transactions.findFirst({ where: eq(transactions.id, txId) });
        if (!tx || tx.status !== 'pending') return ctx.answerCallbackQuery("Sudah diproses.");

        // For transfer we need a target. If none, we'll suggest one or just switch.
        await db.update(transactions).set({ type: 'transfer' }).where(eq(transactions.id, txId));
        await ctx.answerCallbackQuery("Diubah ke Transfer");

        // Refresh message
        const user = await db.query.users.findFirst({ where: eq(users.telegram_chat_id, ctx.chat!.id.toString()) });
        const wsInfo = await getPersonalWorkspace(user!.id);
        const allCategories = await db.query.categories.findMany();
        await handleTransactionResult(ctx, db, user, { ...tx, type: 'transfer', category_guess: tx.category_id ? (allCategories.find(c => c.id === tx.category_id)?.name || null) : null }, wsInfo, allCategories);
    });

    bot.callbackQuery(/^confirm_batch:(.+)$/, async (ctx) => {
        const batchId = ctx.match[1];
        const txs = await db.query.transactions.findMany({ where: eq(transactions.batch_id, batchId) });
        const pendingTxs = txs.filter(t => t.status === 'pending');

        if (!pendingTxs.length) {
            return ctx.answerCallbackQuery("Transaksi sudah diproses.");
        }

        try {
            const batchUpdate = [];
            for (const tx of pendingTxs) {
                batchUpdate.push(db.update(transactions).set({ status: 'confirmed' }).where(eq(transactions.id, tx.id)));
                if (tx.type === 'income') {
                    batchUpdate.push(db.update(accounts).set({ balance: sql`${accounts.balance} + ${tx.amount}` }).where(eq(accounts.id, tx.account_id!)));
                } else if (tx.type === 'expense') {
                    batchUpdate.push(db.update(accounts).set({ balance: sql`${accounts.balance} - ${tx.amount}` }).where(eq(accounts.id, tx.account_id!)));
                } else if (tx.type === 'transfer' && tx.transfer_to_account_id) {
                    batchUpdate.push(db.update(accounts).set({ balance: sql`${accounts.balance} - ${tx.amount}` }).where(eq(accounts.id, tx.account_id!)));
                    batchUpdate.push(db.update(accounts).set({ balance: sql`${accounts.balance} + ${tx.amount}` }).where(eq(accounts.id, tx.transfer_to_account_id!)));
                }
            }
            await db.batch(batchUpdate as any);
            await ctx.editMessageText(`✅ ${pendingTxs.length} transaksi berhasil disimpan!`);
            await ctx.answerCallbackQuery("Selesai!");
        } catch (e) {
            console.error(e);
            await ctx.answerCallbackQuery("Gagal menyimpan.");
        }
    });

    bot.callbackQuery(/^delete_batch:(.+)$/, async (ctx) => {
        const batchId = ctx.match[1];
        await db.delete(transactions).where(eq(transactions.batch_id, batchId));
        await ctx.editMessageText("🗑 Semua transaksi dihapus.");
        await ctx.answerCallbackQuery("Dihapus.");
    });

    bot.callbackQuery(/^set_default:(.+)$/, async (ctx) => {
        const accountId = ctx.match[1];
        const acc = await db.query.accounts.findFirst({ where: eq(accounts.id, accountId) });

        if (!acc) return ctx.answerCallbackQuery("Akun tidak ditemukan.");

        try {
            // Unset all other defaults in the same workspace
            await db.update(accounts)
                .set({ is_default: false })
                .where(eq(accounts.workspace_id, acc.workspace_id));

            // Set as default
            await db.update(accounts)
                .set({ is_default: true })
                .where(eq(accounts.id, accountId));

            await ctx.editMessageText(`✅ Account default diganti ke: *${acc.name}*`, { parse_mode: "Markdown" });
            await ctx.answerCallbackQuery("Akun default diperbarui!");
        } catch (e) {
            await ctx.answerCallbackQuery("Gagal memperbarui akun.");
        }
    });
};
