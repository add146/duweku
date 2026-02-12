import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, isNull, or } from 'drizzle-orm';
import { createDb } from '../db';
import { categories } from '../db/schema';
import { getWorkspaceRole } from '../middleware/auth';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: any }>();

app.get('/', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const user = c.get('user');
    const db = createDb(c.env.DB);

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (!role) return c.json({ error: 'Forbidden' }, 403);

    const data = await db.query.categories.findMany({
        where: or(
            isNull(categories.workspace_id),
            eq(categories.workspace_id, workspaceId)
        ),
    });

    return c.json({ data });
});

app.post('/', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const user = c.get('user');
    const { name, type, icon, color } = await c.req.json();
    const db = createDb(c.env.DB);

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (role !== 'owner') return c.json({ error: 'Forbidden' }, 403);

    const id = uuidv4();
    await db.insert(categories).values({
        id,
        workspace_id: workspaceId,
        name,
        type,
        icon,
        color,
        is_system: false,
    });

    return c.json({ id, name }, 201);
});

app.put('/:id', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const categoryId = c.req.param('id');
    const user = c.get('user');
    const body = await c.req.json();
    const db = createDb(c.env.DB);

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (role !== 'owner') return c.json({ error: 'Forbidden' }, 403);

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;

    const res = await db.update(categories)
        .set(updateData)
        .where(and(
            eq(categories.id, categoryId),
            eq(categories.workspace_id, workspaceId)
        ))
        .returning();

    if (res.length === 0) {
        return c.json({ error: 'Category not found or system category' }, 404);
    }

    return c.json({ success: true, data: res[0] });
});

app.delete('/:id', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const categoryId = c.req.param('id');
    const user = c.get('user');
    const db = createDb(c.env.DB);

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (role !== 'owner') return c.json({ error: 'Forbidden' }, 403);

    const res = await db.delete(categories)
        .where(and(eq(categories.id, categoryId), eq(categories.workspace_id, workspaceId)))
        .returning();

    if (res.length === 0) {
        return c.json({ error: 'Category not found or system category' }, 404);
    }

    return c.json({ success: true });
});

export default app;
