import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { createDb } from '../db';
import { transactions, accounts, categories } from '../db/schema';
import { getWorkspaceRole } from '../middleware/auth';
import { Env } from '../index';
import * as XLSX from 'xlsx';

const app = new Hono<{ Bindings: Env; Variables: any }>();

app.get('/', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    if (!workspaceId) return c.json({ error: 'Workspace ID required' }, 400);

    const user = c.get('user');
    const db = createDb(c.env.DB);
    const { startDate, endDate } = c.req.query();

    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (!role) return c.json({ error: 'Forbidden' }, 403);

    // Fetch data
    const conditions = [eq(transactions.workspace_id, workspaceId)];
    if (startDate) conditions.push(sql`${transactions.date} >= ${startDate}`);
    if (endDate) conditions.push(sql`${transactions.date} <= ${endDate}`);

    const txs = await db.query.transactions.findMany({
        where: and(...conditions),
        orderBy: (t, { desc }) => [desc(t.date)],
        with: {
            // Need joins to get names? Or just IDs.
            // Drizzle query API `with` usually works if relations defined.
            // Relations not defined in schema.ts (I used references but not `relations` helper).
            // So manual join or just raw IDs.
            // For export, names are better.
            // I can join manually or fetch maps.
            // Manual join via `db.select().from().innerJoin()` is better for flat export.
        }
    });

    // Manual fetch for names if query builder relations missing
    // Or just use IDs for MVP + Map if needed.
    // Let's do a join query for better export interactively.

    const data = await db.select({
        date: transactions.date,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        account: accounts.name,
        category: categories.name,
        source: transactions.source
    })
        .from(transactions)
        .leftJoin(accounts, eq(transactions.account_id, accounts.id))
        .leftJoin(categories, eq(transactions.category_id, categories.id))
        .where(and(...conditions))
        .orderBy(sql`${transactions.date} DESC`);

    // Convert to sheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    // Generate buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Return file
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="duweku_export_${startDate || 'all'}_${endDate || 'all'}.xlsx"`);

    return c.body(buf);
});

export default app;
