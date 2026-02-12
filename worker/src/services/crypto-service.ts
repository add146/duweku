// Encrypt/Decrypt API Keys using AES-GCM (Web Crypto API)
// Keys are stored in Base64 encoded JSON containing iv and data.

export async function encryptApiKey(apiKey: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode("duweku-salt"), // Fixed salt for simplicity, or use unique salt? 
            // Ideally separate salt, but for environment variable based secret, fixed salt is common practice if IV is random.
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(apiKey)
    );

    const bundle = {
        iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
        data: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join(''),
    };

    return btoa(JSON.stringify(bundle));
}


export async function decryptApiKey(encryptedBundle: string, secret: string): Promise<string> {
    try {
        const bundle = JSON.parse(atob(encryptedBundle));
        const iv = new Uint8Array(bundle.iv.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)));
        const data = new Uint8Array(bundle.data.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)));

        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: encoder.encode("duweku-salt"),
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["decrypt"]
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            data
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Failed to decrypt API key");
    }
}
