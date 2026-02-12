import { Bot, InlineKeyboard } from "grammy";
import { eq, and, sql } from "drizzle-orm";
import { createDb } from "./db";
import { users, transactions, accounts, workspaces, workspaceMembers } from "./db/schema";
import { Env } from "./index";
import { MyContext } from "./bot-instance";
import { resolveGeminiKey, parseTransactionText, parseReceiptImage } from "./services/gemini-service";
import { v4 as uuidv4 } from "uuid";

export const initBot = (bot: Bot<MyContext>, env: Env) => {
    const db = createDb(env.DB);

    // Middleware: Attach user logic could be here if needed globally

    // Command: /start <token>
    bot.command("start", async (ctx) => {
        const args = ctx.match;
        if (!args) {
            return ctx.reply("Welcome to DuweKu Bot! Please link your account from the web dashboard.");
        }

        try {
            const { jwtVerify } = await import('jose');
            const secret = new TextEncoder().encode(env.JWT_SECRET);
            const { payload } = await jwtVerify(args, secret);

            const userId = payload.sub as string;
            if (!userId) throw new Error("Invalid token");

            await db.update(users)
                .set({ telegram_chat_id: ctx.chat.id.toString() })
                .where(eq(users.id, userId));

            return ctx.reply("✅ Account linked successfully! You can now send me transaction texts or photos.");
        } catch (e) {
            return ctx.reply("❌ Invalid or expired linking token.");
        }
    });

    // Handle Text Messages (NLP)
    bot.on("message:text", async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const user = await db.query.users.findFirst({
            where: eq(users.telegram_chat_id, chatId),
        });

        if (!user) {
            return ctx.reply("Please link your account first.");
        }

        const text = ctx.message.text;
        await ctx.reply("⏳ Reading text...");

        try {
            const apiKey = await resolveGeminiKey(user, env);
            const result = await parseTransactionText(text, apiKey);

            handleTransactionResult(ctx, db, user, result);

        } catch (e: any) {
            console.error(e);
            await ctx.reply(`Error: ${e.message}`);
        }
    });

    // Handle Photo Messages (OCR)
    bot.on("message:photo", async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const user = await db.query.users.findFirst({
            where: eq(users.telegram_chat_id, chatId),
        });

        if (!user) {
            return ctx.reply("Please link your account first.");
        }

        await ctx.reply("⏳ Analyzing receipt...");

        try {
            // Get highest res photo
            const photo = ctx.message.photo[ctx.message.photo.length - 1];
            const file = await ctx.api.getFile(photo.file_id);

            // Download file
            // URL: https://api.telegram.org/file/bot<token>/<file_path>
            const url = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

            const apiKey = await resolveGeminiKey(user, env);

            const imageParts = [{
                inlineData: {
                    data: base64, // pure base64
                    mimeType: "image/jpeg" // Telegram usually returns JPEGs
                }
            }];

            const result = await parseReceiptImage(imageParts, apiKey);
            // result: { merchant, date, total, items, category_guess }

            // Map to transaction format
            const txResult = {
                type: "expense", // Receipts are usually expenses
                amount: result.total,
                description: `${result.merchant || "Unknown Merchant"} (${result.items?.length || 0} items)`,
                date: result.date,
                category_guess: result.category_guess
            };

            handleTransactionResult(ctx, db, user, txResult);

        } catch (e: any) {
            console.error(e);
            await ctx.reply(`Error analyzing image: ${e.message}`);
        }
    });

    // Reusable handler
    async function handleTransactionResult(ctx: any, db: any, user: any, result: any) {
        // Pick workspace/account logic
        const items = await db.select({
            workspaceId: workspaces.id,
            accountId: accounts.id,
            accountName: accounts.name
        })
            .from(workspaces)
            .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspace_id))
            .innerJoin(accounts, eq(workspaces.id, accounts.workspace_id))
            .where(and(
                eq(workspaceMembers.user_id, user.id),
                eq(workspaces.type, 'personal')
            ))
            .limit(1);

        if (items.length === 0) {
            return ctx.reply("No personal workspace/account found.");
        }

        const { workspaceId, accountId, accountName } = items[0];

        const txId = uuidv4();
        await db.insert(transactions).values({
            id: txId,
            workspace_id: workspaceId,
            account_id: accountId,
            user_id: user.id,
            type: result.type as any,
            amount: result.amount,
            description: result.description,
            date: result.date || new Date().toISOString().split('T')[0],
            source: ctx.message.photo ? 'telegram_image' : 'telegram_text',
            status: 'pending',
        });

        const keyboard = new InlineKeyboard()
            .text("✅ Confirm", `confirm:${txId}`)
            .text("🗑 Delete", `delete:${txId}`);

        await ctx.reply(
            `Please confirm:\n` +
            `Type: ${result.type}\n` +
            `Amount: ${result.amount}\n` +
            `Desc: ${result.description}\n` +
            `Account: ${accountName}\n` +
            `Date: ${result.date}`,
            { reply_markup: keyboard }
        );
    }

    // Confirm/Delete logic (unchanged)
    bot.callbackQuery(/^confirm:(.+)$/, async (ctx) => {
        const txId = ctx.match[1];
        const tx = await db.query.transactions.findFirst({ where: eq(transactions.id, txId) });

        if (!tx || tx.status !== 'pending') {
            return ctx.answerCallbackQuery("Trans already processed.");
        }

        try {
            await db.batch([
                db.update(transactions).set({ status: 'confirmed' }).where(eq(transactions.id, txId)),
                tx.type === 'income'
                    ? db.update(accounts).set({ balance: sql`${accounts.balance} + ${tx.amount}` }).where(eq(accounts.id, tx.account_id!))
                    : db.update(accounts).set({ balance: sql`${accounts.balance} - ${tx.amount}` }).where(eq(accounts.id, tx.account_id!))
            ] as any);

            await ctx.editMessageText(`✅ Saved!\n${tx.type.toUpperCase()} ${tx.amount}\n${tx.description}`);
            await ctx.answerCallbackQuery("Confirmed!");
        } catch (e) {
            await ctx.answerCallbackQuery("Error saving.");
        }
    });

    bot.callbackQuery(/^delete:(.+)$/, async (ctx) => {
        const txId = ctx.match[1];
        await db.delete(transactions).where(eq(transactions.id, txId));
        await ctx.editMessageText("🗑 Deleted.");
        await ctx.answerCallbackQuery("Deleted.");
    });
};
