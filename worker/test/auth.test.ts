import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../src/index';
// @ts-ignore
import { verifyPassword } from '../src/services/hash-service';
// @ts-ignore
import { users } from '../src/db/schema';
// @ts-ignore
import { eq } from 'drizzle-orm';
// @ts-ignore
import { createDb } from '../src/db';

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

describe('Auth API', () => {
    beforeAll(async () => {
        const applyMigration = async (name: string, content: string) => {
            console.log(`Applying migration ${name}`);
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
    });

    it('should register and then login', async () => {
        const payload = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        };

        // 1. Register
        const resReg = await app.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        }, env);

        const bodyReg = await resReg.json();
        if (resReg.status !== 201) {
            console.error('Register failed status:', resReg.status);
            console.error('Register failed body:', JSON.stringify(bodyReg, null, 2));
        }
        expect(resReg.status).toBe(201);
        expect(bodyReg).toHaveProperty('token');

        // 2. Login
        const loginPayload = {
            email: 'test@example.com',
            password: 'password123'
        };

        const resLogin = await app.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(loginPayload),
            headers: { 'Content-Type': 'application/json' }
        }, env);

        const bodyLogin = await resLogin.json();
        if (resLogin.status !== 200) {
            console.error('Login failed status:', resLogin.status);
            console.error('Login failed body:', JSON.stringify(bodyLogin, null, 2));

            // Debug DB if login fails
            const db = createDb(env.DB);
            const user = await db.query.users.findFirst({
                where: eq(users.email, payload.email)
            });
            console.log('User in DB after login fail:', user);
        }

        expect(resLogin.status).toBe(200);
        expect(bodyLogin).toHaveProperty('token');
    });
});
