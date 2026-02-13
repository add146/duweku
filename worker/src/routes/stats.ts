import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { createDb } from '../db';
import { transactions, accounts, categories } from '../db/schema';
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
    const categoryBreakdown = await db
        .select({
            name: categories.name,
            value: sql<number>`sum(${transactions.amount})`,
            color: categories.color
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.category_id, categories.id))
        .where(and(
            eq(transactions.workspace_id, workspaceId),
            eq(transactions.type, 'expense'),
            sql`${transactions.date} >= ${start}`,
            sql`${transactions.date} <= ${end}`
        ))
        .groupBy(categories.id, categories.name)
        .orderBy(sql`sum(${transactions.amount}) desc`);

    // 4. Daily Trend
    const dailyTrend = await db
        .select({
            date: transactions.date,
            income: sql<number>`sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end)`,
            expense: sql<number>`sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end)`
        })
        .from(transactions)
        .where(and(
            eq(transactions.workspace_id, workspaceId),
            sql`${transactions.date} >= ${start}`,
            sql`${transactions.date} <= ${end}`
        ))
        .groupBy(transactions.date)
        .orderBy(transactions.date);

    return c.json({
        totalBalance,
        period: { start, end },
        income: income[0]?.total || 0,
        expense: expense[0]?.total || 0,
        cashFlow: (income[0]?.total || 0) - (expense[0]?.total || 0),
        categoryBreakdown,
        dailyTrend
    });
});

export default app;
