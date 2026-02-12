import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { createDb } from '../db';
import { workspaces, workspaceMembers } from '../db/schema';
import { authMiddleware, getWorkspaceRole } from '../middleware/auth';
import { Env } from '../index';

import accountRoutes from './accounts';
import categoryRoutes from './categories';
import transactionRoutes from './transactions';
import statsRoutes from './stats';
import exportRoutes from './export';

const app = new Hono<{ Bindings: Env; Variables: any }>();

app.use('*', authMiddleware);

app.route('/:workspaceId/accounts', accountRoutes);
app.route('/:workspaceId/categories', categoryRoutes);
app.route('/:workspaceId/transactions', transactionRoutes);
app.route('/:workspaceId/stats', statsRoutes);
app.route('/:workspaceId/export', exportRoutes);

// List My Workspaces
app.get('/', async (c) => {
    const user = c.get('user');
    const db = createDb(c.env.DB);

    // Join workspaces with members to filter by user_id
    const userWorkspaces = await db.select({
        id: workspaces.id,
        name: workspaces.name,
        type: workspaces.type,
        role: workspaceMembers.role,
        currency: workspaces.currency,
    })
        .from(workspaceMembers)
        .innerJoin(workspaces, eq(workspaceMembers.workspace_id, workspaces.id))
        .where(eq(workspaceMembers.user_id, user.id));

    return c.json({ data: userWorkspaces });
});

// Create Workspace
app.post('/', async (c) => {
    const user = c.get('user');
    const { name, type, currency } = await c.req.json();

    if (!name || !type) {
        return c.json({ error: 'Name and Type are required' }, 400);
    }

    // TODO: Check plan limits (max workspaces)

    const db = createDb(c.env.DB);
    const workspaceId = uuidv4();

    try {
        await db.batch([
            db.insert(workspaces).values({
                id: workspaceId,
                name,
                type, // personal, business, family, organization, community
                currency: currency || 'IDR',
                owner_id: user.id,
            }),
            db.insert(workspaceMembers).values({
                id: uuidv4(),
                workspace_id: workspaceId,
                user_id: user.id,
                role: 'owner',
            })
        ]);

        return c.json({ id: workspaceId, name, role: 'owner' }, 201);
    } catch (error) {
        return c.json({ error: 'Failed to create workspace' }, 500);
    }
});

// Update Workspace
app.put('/:id', async (c) => {
    const user = c.get('user');
    const workspaceId = c.req.param('id');
    const { name, type } = await c.req.json();
    const db = createDb(c.env.DB);

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (role !== 'owner') {
        return c.json({ error: 'Forbidden: Owner access required' }, 403);
    }

    await db.update(workspaces)
        .set({ name, type })
        .where(eq(workspaces.id, workspaceId));

    return c.json({ success: true });
});

// Delete Workspace
app.delete('/:id', async (c) => {
    const user = c.get('user');
    const workspaceId = c.req.param('id');
    const db = createDb(c.env.DB);

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (role !== 'owner') {
        return c.json({ error: 'Forbidden: Owner access required' }, 403);
    }

    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));

    return c.json({ success: true });
});

export default app;
