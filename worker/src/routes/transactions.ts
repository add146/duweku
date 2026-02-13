import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, sql } from 'drizzle-orm';
import { createDb } from '../db';
import { transactions, accounts } from '../db/schema';
import { getWorkspaceRole } from '../middleware/auth';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: any }>();

app.get('/', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const user = c.get('user');
    const db = createDb(c.env.DB);

    // Filtering params (date range, type, account)
    const { startDate, endDate, accountId, type } = c.req.query();

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (!role) return c.json({ error: 'Forbidden' }, 403);

    const conditions = [eq(transactions.workspace_id, workspaceId)];
    if (startDate) conditions.push(sql`${transactions.date} >= ${startDate}`);
    if (endDate) conditions.push(sql`${transactions.date} <= ${endDate}`);
    if (accountId) conditions.push(eq(transactions.account_id, accountId));
    // For transfer filter, maybe check transfer_to_account_id too?
    if (type) conditions.push(eq(transactions.type, type as any));

    const data = await db.query.transactions.findMany({
        where: and(...conditions),
        orderBy: (t, { desc }) => [desc(t.date), desc(t.created_at)],
        limit: 100, // Pagination needed later
        with: {
            // Include related account/category names if needed
            account: true,
            category: true,
            // user: true,
        }
    });

    return c.json({ data });
});

app.post('/', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const user = c.get('user');
    const { account_id, category_id, amount, type, description, date, transfer_to_account_id } = await c.req.json();
    const db = createDb(c.env.DB);

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (!role) return c.json({ error: 'Forbidden' }, 403);

    // Validations
    if (!amount || amount <= 0) return c.json({ error: 'Invalid amount' }, 400);
    if (!account_id) return c.json({ error: 'Account required' }, 400);
    if (type === 'transfer' && !transfer_to_account_id) return c.json({ error: 'Destination account required' }, 400);

    const id = uuidv4();
    const queries: any[] = [];

    // 1. Insert Transaction
    queries.push(
        db.insert(transactions).values({
            id,
            workspace_id: workspaceId,
            account_id,
            category_id: type === 'transfer' ? null : category_id,
            transfer_to_account_id: type === 'transfer' ? transfer_to_account_id : null,
            user_id: user.id,
            type,
            amount,
            description,
            date: date || new Date().toISOString().split('T')[0],
            source: 'web_manual',
        })
    );

    // 2. Update Balances
    if (type === 'expense') {
        queries.push(
            // Subtract from account
            db.update(accounts)
                .set({ balance: sql`${accounts.balance} - ${amount}` })
                .where(eq(accounts.id, account_id))
        );
    } else if (type === 'income') {
        queries.push(
            // Add to account
            db.update(accounts)
                .set({ balance: sql`${accounts.balance} + ${amount}` })
                .where(eq(accounts.id, account_id))
        );
    } else if (type === 'transfer') {
        queries.push(
            // Subtract from source
            db.update(accounts)
                .set({ balance: sql`${accounts.balance} - ${amount}` })
                .where(eq(accounts.id, account_id))
        );
        queries.push(
            // Add to dest
            db.update(accounts)
                .set({ balance: sql`${accounts.balance} + ${amount}` })
                .where(eq(accounts.id, transfer_to_account_id))
        );
    }

    try {
        await db.batch(queries as any); // Drizzle batch expects array of statements
        return c.json({ id, status: 'success' }, 201);
    } catch (err: any) {
        console.error('Transaction error:', err);
        return c.json({ error: err.message || 'Transaction failed' }, 500);
    }
});

app.delete('/:id', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const transactionId = c.req.param('id');
    const user = c.get('user');
    const db = createDb(c.env.DB);

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (!role) return c.json({ error: 'Forbidden' }, 403);

    // Get transaction first to revert balance
    const tx = await db.query.transactions.findFirst({
        where: and(eq(transactions.id, transactionId), eq(transactions.workspace_id, workspaceId)),
    });

    if (!tx) return c.json({ error: 'Not found' }, 404);

    // Check permission: Owner can delete any, Member can delete own?
    if (role !== 'owner' && tx.user_id !== user.id) {
        return c.json({ error: 'Forbidden: Cannot delete others transaction' }, 403);
    }

    const queries: any[] = [];

    // Revert balance
    // Expense: was -, so Add back
    // Income: was +, so Subtract
    // Transfer: was (-Src, +Dst), so (+Src, -Dst)

    if (tx.type === 'expense') {
        queries.push(
            db.update(accounts)
                .set({ balance: sql`${accounts.balance} + ${tx.amount}` })
                .where(eq(accounts.id, tx.account_id!))
        );
    } else if (tx.type === 'income') {
        queries.push(
            db.update(accounts)
                .set({ balance: sql`${accounts.balance} - ${tx.amount}` })
                .where(eq(accounts.id, tx.account_id!))
        );
    } else if (tx.type === 'transfer') {
        queries.push(
            db.update(accounts)
                .set({ balance: sql`${accounts.balance} + ${tx.amount}` })
                .where(eq(accounts.id, tx.account_id!))
        );
        if (tx.transfer_to_account_id) {
            queries.push(
                db.update(accounts)
                    .set({ balance: sql`${accounts.balance} - ${tx.amount}` })
                    .where(eq(accounts.id, tx.transfer_to_account_id))
            );
        }
    }

    // Delete transaction
    queries.push(
        db.delete(transactions).where(eq(transactions.id, transactionId))
    );

    try {
        await db.batch(queries as any);
        return c.json({ success: true });
    } catch (err: any) {
        return c.json({ error: 'Delete failed' }, 500);
    }
});

export default app;
