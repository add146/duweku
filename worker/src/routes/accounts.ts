import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, sql } from 'drizzle-orm';
import { createDb } from '../db';
import { accounts } from '../db/schema';
import { getWorkspaceRole } from '../middleware/auth';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: any }>();

// GET /api/workspaces/:workspaceId/accounts
app.get('/', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const user = c.get('user');
    const db = createDb(c.env.DB);

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (!role) return c.json({ error: 'Forbidden' }, 403);

    const data = await db.query.accounts.findMany({
        where: eq(accounts.workspace_id, workspaceId),
        orderBy: sql`${accounts.is_active} DESC, ${accounts.name} ASC`
    });

    return c.json({ data });
});

app.post('/', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const user = c.get('user');
    const { name, type, balance, icon, is_default } = await c.req.json();
    const db = createDb(c.env.DB);

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (role !== 'owner') return c.json({ error: 'Forbidden: Owner only' }, 403);

    const id = uuidv4();
    await db.insert(accounts).values({
        id,
        workspace_id: workspaceId,
        name,
        type,
        balance: balance || 0,
        icon,
        is_default: is_default || false,
        is_active: true,
    });

    return c.json({ id, name, balance }, 201);
});

app.put('/:id', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const accountId = c.req.param('id');
    const user = c.get('user');
    const body = await c.req.json();
    const db = createDb(c.env.DB);

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (role !== 'owner') return c.json({ error: 'Forbidden' }, 403);

    // Validate body fields to ensure safety
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.is_default !== undefined) updateData.is_default = body.is_default;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.balance !== undefined) updateData.balance = body.balance;

    await db.update(accounts)
        .set(updateData)
        .where(and(eq(accounts.id, accountId), eq(accounts.workspace_id, workspaceId)));

    return c.json({ success: true });
});

app.delete('/:id', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const accountId = c.req.param('id');
    const user = c.get('user');
    const db = createDb(c.env.DB);

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (role !== 'owner') return c.json({ error: 'Forbidden' }, 403);

    // Instead of deleting, we set is_active to false (Archive)
    await db.update(accounts)
        .set({ is_active: false })
        .where(and(eq(accounts.id, accountId), eq(accounts.workspace_id, workspaceId)));

    return c.json({ success: true });
});

export default app;
