import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { SignJWT } from 'jose';
import { eq } from 'drizzle-orm';
import { createDb } from '../db';
import { users, plans, workspaces, workspaceMembers } from '../db/schema';
import { hashPassword, verifyPassword } from '../services/hash-service';
import { RegisterSchema, LoginSchema } from '@duweku/shared';
import { authMiddleware } from '../middleware/auth';

import { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: any }>();

app.post('/register', async (c) => {
    const body = await c.req.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
        return c.json({ error: 'Validasi gagal', details: result.error.format() }, 400);
    }

    const { name, email, password } = result.data;
    const db = createDb(c.env.DB);

    // Check existing user
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existingUser) {
        return c.json({ error: 'Email sudah terdaftar' }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Get default plan (Basic BYOK)
    const defaultPlan = await db.query.plans.findFirst({
        where: eq(plans.slug, 'basic-byok'),
    });

    if (!defaultPlan) {
        // Fallback or error? better error.
        return c.json({ error: 'Konfigurasi paket default hilang' }, 500);
    }

    const userId = uuidv4();
    const workspaceId = uuidv4();

    // Transaction: Create User -> Create Personal Workspace -> Add Member
    try {
        await db.batch([
            db.insert(users).values({
                id: userId,
                name,
                email,
                password_hash: passwordHash,
                plan_id: defaultPlan.id,
                ai_mode: defaultPlan.ai_mode as "byok" | "global",
                role: 'user',
                status: 'active',
            }),
            db.insert(workspaces).values({
                id: workspaceId,
                name: 'Pribadi',
                type: 'personal',
                owner_id: userId,
            }),
            db.insert(workspaceMembers).values({
                id: uuidv4(),
                workspace_id: workspaceId,
                user_id: userId,
                role: 'owner',
            })
        ]);

        // Generate JWT
        const secret = new TextEncoder().encode(c.env.JWT_SECRET);
        const token = await new SignJWT({ sub: userId, email, role: 'user' })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(secret);

        return c.json({
            token,
            user: { id: userId, name, email, plan_id: defaultPlan.id, role: 'user' },
        }, 201);

    } catch (error) {
        console.error('Register error:', error);
        return c.json({ error: 'Pendaftaran gagal' }, 500);
    }
});

app.post('/login', async (c) => {
    const body = await c.req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
        return c.json({ error: 'Input tidak valid' }, 400);
    }

    const { email, password } = result.data;
    const db = createDb(c.env.DB);

    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user || user.status !== 'active') {
        return c.json({ error: 'Email atau password salah' }, 401);
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
        return c.json({ error: 'Email atau password salah' }, 401);
    }

    // Generate JWT
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const token = await new SignJWT({ sub: user.id, email: user.email, role: user.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);

    return c.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            plan_id: user.plan_id,
            ai_mode: user.ai_mode,
        },
    });
});

// Generate Telegram Link
app.get('/telegram-link', authMiddleware, async (c) => {
    const user = c.get('user');
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);

    // Short lived token (1 hour)
    const linkToken = await new SignJWT({ sub: user.id, type: 'telegram_link' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret);

    // URL Generation:
    // 1. Try to get username from DB settings
    // 2. Fallback to Env variable
    // 3. Fallback to 'DuweKuBot'
    const db = createDb(c.env.DB);
    const { settings } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');

    const setting = await db.query.settings.findFirst({
        where: eq(settings.key, 'telegram_bot_username')
    });

    const botUsername = setting?.value || c.env.TELEGRAM_BOT_USERNAME || 'DuweKuBot';

    return c.json({
        url: `https://t.me/${botUsername}?start=${linkToken}`,
        token: linkToken
    });
});

app.get('/me', authMiddleware, async (c) => {
    const user = c.get('user');
    // Return user with has_api_key flag, but exclude sensitive fields if needed (though middleware attaches full user)
    // We strictly should not return password_hash or actual api key
    const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan_id: user.plan_id,
        ai_mode: user.ai_mode,
        has_api_key: !!user.gemini_api_key
    };
    return c.json({ user: safeUser });
});

export default app;
