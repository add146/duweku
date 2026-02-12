import { Hono } from 'hono';
import { webhookCallback } from 'grammy';
import { createBot } from '../bot-instance';
import { initBot } from '../bot';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: any }>();

// Webhook handler
app.post('/', async (c) => {
    const bot = createBot(c.env);
    initBot(bot, c.env);
    return webhookCallback(bot, 'hono')(c);
});

export default app;
