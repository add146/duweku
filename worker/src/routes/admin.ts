import { Hono } from 'hono';
import { eq, desc, like, sql, and } from 'drizzle-orm';
import { createDb } from '../db';
import { users, workspaces, transactions, orders, settings } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: any }>();

// Middleware: Require Super Admin
app.use('*', authMiddleware, async (c, next) => {
    const user = c.get('user');
    if (user.role !== 'super_admin') {
        return c.json({ error: 'Unauthorized: Super Admin access required' }, 403);
    }
    await next();
});

// GET /stats - Overall Stats
app.get('/stats', async (c) => {
    const db = createDb(c.env.DB);

    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [workspaceCount] = await db.select({ count: sql<number>`count(*)` }).from(workspaces);
    const [transactionCount] = await db.select({ count: sql<number>`count(*)` }).from(transactions);
    const [revenue] = await db.select({ total: sql<number>`sum(${orders.amount})` }).from(orders).where(eq(orders.status, 'paid'));

    return c.json({
        users: userCount?.count || 0,
        workspaces: workspaceCount?.count || 0,
        transactions: transactionCount?.count || 0,
        revenue: revenue?.total || 0
    });
});

// GET /users - List Users with pagination & search
app.get('/users', async (c) => {
    const db = createDb(c.env.DB);
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const search = c.req.query('q') || '';
    const offset = (page - 1) * limit;

    let whereClause = undefined;
    if (search) {
        whereClause = and(
            like(users.email, `%${search}%`)
        );
    }

    const userList = await db.query.users.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(users.created_at)],
        columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            created_at: true,
            plan_id: true,
        }
    });

    const [total] = await db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause);

    return c.json({
        data: userList,
        pagination: {
            page,
            limit,
            total: total?.count || 0,
            totalPages: Math.ceil((total?.count || 0) / limit)
        }
    });
});

// PUT /users/:id/suspend - Toggle User Suspension
app.put('/users/:id/suspend', async (c) => {
    const db = createDb(c.env.DB);
    const userId = c.req.param('id');
    const { status } = await c.req.json(); // { status: 'active' | 'suspended' }

    if (!['active', 'suspended'].includes(status)) {
        return c.json({ error: 'Invalid status' }, 400);
    }

    await db.update(users)
        .set({ status })
        .where(eq(users.id, userId));

    return c.json({ success: true, status });
});

// GET /settings - List all settings
app.get('/settings', async (c) => {
    const db = createDb(c.env.DB);
    const allSettings = await db.query.settings.findMany();
    return c.json(allSettings);
});

// PUT /settings/:key - Update setting
app.put('/settings/:key', async (c) => {
    const db = createDb(c.env.DB);
    const key = c.req.param('key');
    const body = await c.req.json(); // { value: string, description?: string }

    if (!body.value) {
        return c.json({ error: 'Value is required' }, 400);
    }

    // Upsert equivalent (SQLite replace or insert on conflict)
    // For simplicity, defining explicit conflict handling
    await db.insert(settings)
        .values({
            key,
            value: body.value,
            description: body.description,
            updated_at: sql`CURRENT_TIMESTAMP`
        })
        .onConflictDoUpdate({
            target: settings.key,
            set: {
                value: body.value,
                description: body.description,
                updated_at: sql`CURRENT_TIMESTAMP`
            }
        });

    return c.json({ success: true });
});

// POST /set-webhook - Register Telegram Webhook
app.post('/set-webhook', async (c) => {
    if (!c.env.TELEGRAM_BOT_TOKEN) {
        return c.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, 400);
    }

    const url = new URL(c.req.url);
    // Construct webhook URL. 
    // If running on *.workers.dev, use that.
    // If running on custom domain, use that.
    // Note: c.req.url is the full request URL. origin is the protocol + host.
    const webhookUrl = `${url.origin}/api/bot`;

    console.log(`Setting webhook to: ${webhookUrl}`);

    const tgUrl = `https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/setWebhook?url=${webhookUrl}`;

    try {
        const res = await fetch(tgUrl);
        const data: any = await res.json();

        if (!data.ok) {
            return c.json({ error: 'Telegram API Error', details: data }, 500);
        }

        return c.json({ success: true, details: data });
    } catch (e: any) {
        return c.json({ error: 'Fetch failed', message: e.message }, 500);
    }
});

export default app;
