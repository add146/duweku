import { GoogleGenerativeAI } from "@google/generative-ai";
import { decryptApiKey } from "./crypto-service";
import { Env } from "../index";

// Resolve API Key based on user mode
export async function resolveGeminiKey(user: any, env: Env): Promise<string> {
    if (user.ai_mode === 'global') {
        return env.GEMINI_API_KEY;
    } else if (user.ai_mode === 'byok' && user.gemini_api_key) {
        return await decryptApiKey(user.gemini_api_key, env.ENCRYPTION_SECRET);
    }
    throw new Error("No valid Gemini API key found for user");
}

export async function parseTransactionText(text: string, apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Extract financial transaction details from this text to JSON.
    Output format:
    {
      "amount": number,
      "date": "YYYY-MM-DD",
      "description": string,
      "type": "income" | "expense" | "transfer",
      "category_guess": string
    }
    Text: "${text}"
    If transfer, description should mention source/dest.
    Return ONLY JSON.
  `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const textResponse = response.text();

    // Clean markdown code blocks if any
    const jsonString = textResponse.replace(/^```json\n|\n```$/g, "").trim();
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse Gemini JSON:", jsonString);
        throw new Error("AI response format error");
    }
}

export async function parseReceiptImage(imageParts: { inlineData: { data: string, mimeType: string } }[], apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Analyze this receipt image. Extract items, total amount, date, merchant name.
    Output JSON format:
    {
      "merchant": string,
      "date": "YYYY-MM-DD",
      "total": number,
      "items": [ { "name": string, "price": number, "qty": number } ],
      "category_guess": string
    }
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
