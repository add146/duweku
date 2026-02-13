import { GoogleGenerativeAI } from "@google/generative-ai";
import { decryptApiKey } from "./crypto-service";
import { Env } from "../index";

import { createDb } from "../db";
import { settings } from "../db/schema";
import { eq } from "drizzle-orm";

// Resolve API Key based on user mode
export async function resolveGeminiKey(user: any, env: Env): Promise<string> {
    if (user.ai_mode === 'global') {
        const db = createDb(env.DB);
        // Try to get from settings first
        const setting = await db.query.settings.findFirst({
            where: eq(settings.key, 'gemini_api_key_pro')
        });

        if (setting?.value) {
            return setting.value;
        }

        // Fallback to Env
        return env.GEMINI_API_KEY;
    } else if (user.ai_mode === 'byok' && user.gemini_api_key) {
        return await decryptApiKey(user.gemini_api_key, env.ENCRYPTION_SECRET);
    }
    throw new Error("No valid Gemini API key found for user");
}

export async function resolveGeminiConfig(env: Env) {
    const db = createDb(env.DB);
    const textModel = await db.query.settings.findFirst({
        where: eq(settings.key, 'gemini_model_text')
    });
    const imageModel = await db.query.settings.findFirst({
        where: eq(settings.key, 'gemini_model_image')
    });

    return {
        textModel: textModel?.value || "gemini-2.5-flash-lite",
        imageModel: imageModel?.value || "gemini-2.5-flash"
    };
}

/**
 * Parses Indonesian currency strings like "20k", "20rb", "1jt", "20.000" into numbers.
 */
export function parseIndonesianAmount(text: string): number {
    if (!text) return 0;

    // Normalize: remove dots (thousands separator), commas (if any, treat as decimal later if needed), 
    // and lowercase everything.
    let clean = text.toLowerCase().replace(/\./g, '').replace(/,/g, '.').trim();

    // Extract numeric part and suffix
    const match = clean.match(/^([\d.]+)([a-z]*)$/);
    if (!match) {
        // Fallback for messy strings: just extract first numeric sequence
        const digits = clean.match(/[\d.]+/);
        if (!digits) return 0;
        let val = parseFloat(digits[0]);
        // Simple check if suffix exists elsewhere
        if (clean.includes('k') || clean.includes('rb')) val *= 1000;
        if (clean.includes('jt')) val *= 1000000;
        return val;
    }

    let value = parseFloat(match[1]);
    const suffix = match[2];

    if (suffix === 'k' || suffix === 'rb' || suffix === 'ribu') {
        value *= 1000;
    } else if (suffix === 'jt' || suffix === 'juta') {
        value *= 1000000;
    }

    return value;
}

export async function parseTransactionText(text: string, apiKey: string, modelName: string = "gemini-2.5-flash-lite", availableCategories: string[] = []) {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Using configured model
    const model = genAI.getGenerativeModel({ model: modelName });

    const categoriesPrompt = availableCategories.length > 0
        ? `\nValid Categories: ${JSON.stringify(availableCategories)}\nCRITICAL: Pick ONLY one of the valid categories above if it matches semantically (e.g., "bensin" -> "Transportasi", "bakso" -> "Makanan & Minuman"). Suggest a new one ONLY if it doesn't fit any of the above.`
        : "";

    const prompt = `You are a financial assistant for the DuweKu app. Analyze the following text.

If the text describes a financial transaction (expense, income, or transfer), extract the details into this JSON format:
{
  "is_transaction": boolean,
  "transactions": [
    {
      "amount": number,
      "date": "YYYY-MM-DD",
      "description": string,
      "type": "income" | "expense" | "transfer",
      "category_guess": string,
      "from_account_guess": string,
      "to_account_guess": string
    }
  ],
  "reply": string (only if is_transaction is false)
}

Use today's date (${new Date().toISOString().split('T')[0]}) if no date is mentioned.
If transfer, description should mention source/dest.${categoriesPrompt}
Respond strictly in Indonesian.
Return ONLY valid JSON, no other text.

User text: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const textResponse = response.text();

    // Clean markdown code blocks if any
    const jsonString = textResponse.replace(/```json\n?|\n?```/g, "").trim();
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse Gemini JSON:", jsonString);
        throw new Error("AI response format error");
    }
}

export async function parseReceiptImage(imageParts: { inlineData: { data: string, mimeType: string } }[], apiKey: string, modelName: string = "gemini-2.5-flash", availableCategories: string[] = []) {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Using configured model
    const model = genAI.getGenerativeModel({ model: modelName });

    const categoriesPrompt = availableCategories.length > 0
        ? `\nValid Categories: ${JSON.stringify(availableCategories)}\nMatch the receipt to one of these categories semantically. Use "Tanpa Kategori" if no match.`
        : "";

    const prompt = `
    Analyze this receipt image. Extract items, total amount, date, merchant name.
    Output JSON format:
    {
      "merchant": string,
      "date": "YYYY-MM-DD",
      "total": number,
      "items": [ { "name": string, "price": number, "qty": number } ],
      "category_guess": string,
      "type": "income" | "expense" | "transfer",
      "from_account_guess": string,
      "to_account_guess": string
    }
    
    If it's a transfer receipt (like Flip, Bank Transfer), set type to "transfer" and identify from/to accounts.
    Use today's date (${new Date().toISOString().split('T')[0]}) if not found.
    ${categoriesPrompt}
  `;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = result.response;
    const textResponse = response.text();

    const text = textResponse.replace(/```json\n?|\n?```/g, "").trim();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse Gemini JSON:", text);
        throw new Error("AI response format error");
    }
}
