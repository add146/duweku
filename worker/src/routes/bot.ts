import { Hono } from 'hono';
import { createBot } from '../bot-instance';
import { initBot } from '../bot';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: any }>();

// Simple in-memory deduplication to prevent Telegram retries from double-processing
const processedUpdates = new Set<number>();

// Webhook handler
app.post('/', async (c) => {
    console.log("=== BOT WEBHOOK HIT ===");

    // Parse the body to check update_id for dedup
    const body = await c.req.json();
    const updateId = body.update_id;
    console.log("Update ID:", updateId, "Type:", body.message ? "message" : body.callback_query ? "callback" : "other");

    // Skip if already processed (Telegram retry)
    if (processedUpdates.has(updateId)) {
        console.log("Skipping duplicate update:", updateId);
        return c.json({ ok: true });
    }

    // Mark as processed
    processedUpdates.add(updateId);

    // Keep set small (last 100 updates)
    if (processedUpdates.size > 100) {
        const first = processedUpdates.values().next().value;
        if (first !== undefined) processedUpdates.delete(first);
    }

    const bot = createBot(c.env);
    initBot(bot, c.env);

    // bot.init() is required when using handleUpdate directly (not webhookCallback)
    await bot.init();

    // Process update and handle errors gracefully
    try {
        console.log("Processing update...");
        await bot.handleUpdate(body);
        console.log("Update processed successfully");
    } catch (err) {
        console.error("Bot handler error:", err);
    }

    return c.json({ ok: true });
});

export default app;
