import { Hono } from 'hono';
import { createDb } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { resolveGeminiKey, parseTransactionText, parseReceiptImage } from '../services/gemini-service';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: any }>();

app.use('*', authMiddleware);

app.post('/parse-text', async (c) => {
    const user = c.get('user');
    const { text } = await c.req.json();

    if (!text) return c.json({ error: 'Text required' }, 400);

    // Get full user data including API keys if BYOK
    // Middleware user might not have sensitive fields if reused from somewhere, 
    // but if we fetched from DB in middleware, it has everything properly typed?
    // Our middleware fetches full user record.

    try {
        const apiKey = await resolveGeminiKey(user, c.env);
        const result = await parseTransactionText(text, apiKey);

        // Log usage?
        // TODO: Phase 2.3 ai_logs schema exists. Insert log.

        return c.json({ data: result });
    } catch (error: any) {
        console.error("AI Error:", error);
        return c.json({ error: error.message || "AI processing failed" }, 500);
    }
});

app.post('/parse-image', async (c) => {
    const user = c.get('user');
    // Handle file upload
    const formData = await c.req.parseBody();
    const file = formData['image']; // File | string

    if (!file || typeof file === 'string') {
        return c.json({ error: 'Image file required' }, 400);
    }

    // Convert File to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = file.type;

    try {
        const apiKey = await resolveGeminiKey(user, c.env);

        const imageParts = [
            {
                inlineData: {
                    data: base64,
                    mimeType
                },
            },
        ];

        const result = await parseReceiptImage(imageParts, apiKey);
        return c.json({ data: result });
    } catch (error: any) {
        console.error("AI Error:", error);
        return c.json({ error: error.message || "AI processing failed" }, 500);
    }
});

export default app;
