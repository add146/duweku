import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
    test: {
        poolOptions: {
            workers: {
                wrangler: { configPath: './wrangler.toml' },
                miniflare: {
                    bindings: {
                        JWT_SECRET: 'test-secret-at-least-32-chars-long-for-security-reasons',
                        ENCRYPTION_SECRET: 'test-encryption-secret',
                        GEMINI_API_KEY: 'test-gemini-key',
                        TELEGRAM_BOT_TOKEN: 'test-bot-token',
                        TELEGRAM_BOT_USERNAME: 'test_bot',
                        MIDTRANS_SERVER_KEY: 'test-midtrans-server',
                        MIDTRANS_CLIENT_KEY: 'test-midtrans-client',
                        MIDTRANS_IS_PRODUCTION: 'false'
                    }
                }
            },
        },
    },
});
