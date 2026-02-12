import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createDb } from '../db';
import { users } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { encryptApiKey } from '../services/crypto-service';
import { Env } from '../index';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env; Variables: any }>();

app.use('*', authMiddleware);

const settingsSchema = z.object({
    name: z.string().optional(),
    ai_mode: z.enum(['global', 'byok']).optional(),
    gemini_api_key: z.string().optional(),
});

app.put('/', async (c) => {
    const user = c.get('user');
    const body = await c.req.json();

    const result = settingsSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: 'Validation failed' }, 400);
    }

    const { name, ai_mode, gemini_api_key } = result.data;
    const db = createDb(c.env.DB);

    const updateData: any = {};
    if (name) updateData.name = name;
    if (ai_mode) updateData.ai_mode = ai_mode;
    if (gemini_api_key) {
        // Encrypt key
        const encrypted = await encryptApiKey(gemini_api_key, c.env.ENCRYPTION_SECRET);
        updateData.gemini_api_key = encrypted;
    }

    await db.update(users)
        .set(updateData)
        .where(eq(users.id, user.id));

    return c.json({ success: true });
});

export default app;
