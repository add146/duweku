import { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import { createDb } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { Env } from '../index';

export const authMiddleware = async (c: Context<{ Bindings: Env; Variables: any }>, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = new TextEncoder().encode(c.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        if (!payload.sub) {
            throw new Error('Invalid token subject');
        }

        // Optional: Fetch fresh user data from DB to ensure validity/role
        // This adds a DB call per request but is safer.
        const db = createDb(c.env.DB);
        const user = await db.query.users.findFirst({
            where: eq(users.id, payload.sub),
        });

        if (!user || user.status !== 'active') {
            return c.json({ error: 'Unauthorized: User not found or suspended' }, 401);
        }

        c.set('user', user);
        await next();
    } catch (error) {
        console.error('Auth error:', error);
        return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }
};

export const requireSuperAdmin = async (c: Context<{ Bindings: Env; Variables: any }>, next: Next) => {
    const user = c.get('user');
    if (user?.role !== 'super_admin') {
        return c.json({ error: 'Forbidden: Super Admin only' }, 403);
    }
    await next();
};

export const getWorkspaceRole = async (db: any, userId: string, workspaceId: string) => {
    const { workspaceMembers } = await import('../db/schema');
    const { eq, and } = await import('drizzle-orm');

    const member = await db.query.workspaceMembers.findFirst({
        where: and(
            eq(workspaceMembers.workspace_id, workspaceId),
            eq(workspaceMembers.user_id, userId)
        ),
    });

    return member?.role || null;
};
