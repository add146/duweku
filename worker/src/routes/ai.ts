import { Hono } from 'hono';
import { createDb } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { resolveGeminiKey, resolveGeminiConfig, parseTransactionText, parseReceiptImage } from '../services/gemini-service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: any }>();

app.use('*', authMiddleware);

// Dedicated test endpoint with detailed error reporting
app.post('/test', async (c) => {
    const user = c.get('user');
    const steps: string[] = [];

    try {
        steps.push(`User ai_mode: ${user.ai_mode}`);
        steps.push(`Has encrypted key: ${!!user.gemini_api_key}`);

        // Step 1: Resolve key
        let apiKey: string;
        try {
            apiKey = await resolveGeminiKey(user, c.env);
            steps.push(`Key resolved successfully (length: ${apiKey.length})`);
        } catch (e: any) {
            steps.push(`Key resolution FAILED: ${e.message}`);
            return c.json({ success: false, error: `Key resolution failed: ${e.message}`, steps }, 400);
        }

        // Step 2: Quick Gemini API test
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
            const result = await model.generateContent("Reply with just: OK");
            const text = result.response.text();
            steps.push(`Gemini API responded: ${text.substring(0, 50)}`);
        } catch (e: any) {
            steps.push(`Gemini API FAILED: ${e.message}`);
            return c.json({ success: false, error: `Gemini API failed: ${e.message}`, steps }, 400);
        }

        return c.json({ success: true, message: "Connection successful!", steps });
    } catch (e: any) {
        return c.json({ success: false, error: e.message, steps }, 500);
    }
});

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
        const config = await resolveGeminiConfig(c.env);
        const result = await parseTransactionText(text, apiKey, config.textModel);

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

        const config = await resolveGeminiConfig(c.env);
        const result = await parseReceiptImage(imageParts, apiKey, config.imageModel);
        return c.json({ data: result });
    } catch (error: any) {
        console.error("AI Error:", error);
        return c.json({ error: error.message || "AI processing failed" }, 500);
    }
});

export default app;
