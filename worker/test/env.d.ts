/// <reference types="@cloudflare/vitest-pool-workers" />

declare module 'cloudflare:test' {
    interface ProvidedEnv {
        DB: D1Database;
        R2: R2Bucket;
        KV: KVNamespace;
    }
}
