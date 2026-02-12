import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { createDb } from '../db';
import { transactions, accounts } from '../db/schema';
import { getWorkspaceRole } from '../middleware/auth';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: any }>();

app.get('/', async (c) => {
    const workspaceId = c.req.param('workspaceId'); // inherited? No, if using route param bubbling.
    // Standard Hono: param bubbling needs `app.route('/:workspaceId/stats', stats)`
    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const user = c.get('user');
    const db = createDb(c.env.DB);
    const { startDate, endDate } = c.req.query();

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (!role) return c.json({ error: 'Forbidden' }, 403);

    // 1. Total Balance (across all accounts)
    // We can sum accounts balance from DB or calculate from transactions. 
    // Accounts balance is faster.
    const allAccounts = await db.query.accounts.findMany({
        where: eq(accounts.workspace_id, workspaceId),
    });
    const totalBalance = allAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    // 2. Income vs Expense (Period)
    // Default to current month if no dates
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    const income = await db
        .select({ total: sql<number>`sum(${transactions.amount})` })
        .from(transactions)
        .where(and(
            eq(transactions.workspace_id, workspaceId),
            eq(transactions.type, 'income'),
            sql`${transactions.date} >= ${start}`,
            sql`${transactions.date} <= ${end}`
        ));

    const expense = await db
        .select({ total: sql<number>`sum(${transactions.amount})` })
        .from(transactions)
        .where(and(
            eq(transactions.workspace_id, workspaceId),
            eq(transactions.type, 'expense'),
            sql`${transactions.date} >= ${start}`,
            sql`${transactions.date} <= ${end}`
        ));

    // 3. Category Breakdown (Expense)
    // Requires joining categories?
    // Or just group by category_id and fetch category names later or join now.
    // Drizzle join:
    // const breakdown = await db.select({ 
    //   category: categories.name, 
    //   total: sql`sum(transactions.amount)` 
    // }).from(transactions).leftJoin(categories, ...).groupBy(...)

    // Implementation omitted for brevity in this step, but good to have.

    return c.json({
        totalBalance,
        period: { start, end },
        income: income[0]?.total || 0,
        expense: expense[0]?.total || 0,
        cashFlow: (income[0]?.total || 0) - (expense[0]?.total || 0),
    });
});

export default app;
