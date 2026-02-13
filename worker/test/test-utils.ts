import { env } from 'cloudflare:test';
import app from '../src/index';

// Import raw SQL content for migrations
// @ts-ignore
import migration0000 from '../drizzle/0000_broken_ego.sql?raw';
// @ts-ignore
import migration0001 from '../drizzle/0001_aromatic_grey_gargoyle.sql?raw';
// @ts-ignore
import migration0002 from '../drizzle/0002_green_angel.sql?raw';
// @ts-ignore
import migration0003 from '../drizzle/0003_empty_the_anarchist.sql?raw';
// @ts-ignore
import seed from '../drizzle/seed.sql?raw';

export const applyMigrations = async () => {
    const applyMigration = async (name: string, content: string) => {
        if (!content) return;
        const statements = content.split('--> statement-breakpoint');
        for (const stmt of statements) {
            const query = stmt.trim();
            if (query) {
                try {
                    await env.DB.prepare(query).run();
                } catch (e) {
                    console.error(`Failed to execute statement in ${name}:`, query, e);
                    throw e;
                }
            }
        }
    };

    try {
        await applyMigration('0000', migration0000);
        await applyMigration('0001', migration0001);
        await applyMigration('0002', migration0002);
        await applyMigration('0003', migration0003);
        await applyMigration('seed', seed);
    } catch (e) {
        console.error('Migration failed:', e);
        throw e;
    }
};

export const createTestUser = async () => {
    const payload = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'password123'
    };

    const resReg = await app.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
    }, env);

    if (resReg.status !== 201) {
        throw new Error(`Failed to register test user: ${resReg.status}`);
    }

    const { token, user } = await resReg.json() as any;
    return {
        token, user, headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};
