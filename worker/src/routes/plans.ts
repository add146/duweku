import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { createDb } from '../db';
import { plans, orders, users } from '../db/schema';
import { authMiddleware } from '../middleware/auth';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: any }>();

// Public: List Plans
app.get('/', async (c) => {
    const db = createDb(c.env.DB);
    // Sort by price (sort_order)
    const allPlans = await db.query.plans.findMany({
        where: eq(plans.is_active, true),
        orderBy: (p, { asc }) => [asc(p.sort_order)],
    });
    return c.json({ data: allPlans });
});

app.use('/checkout/*', authMiddleware);

// Create checkout session (Midtrans SNAP)
app.post('/checkout', async (c) => {
    const user = c.get('user');
    const { planId, paymentType } = await c.req.json(); // paymentType? maybe not needed for SNAP, user selects there.

    const db = createDb(c.env.DB);

    // 1. Get Plan
    const plan = await db.query.plans.findFirst({
        where: eq(plans.id, planId),
    });

    if (!plan || !plan.is_active) {
        return c.json({ error: 'Invalid plan' }, 400);
    }

    // 2. Create Order
    const orderId = uuidv4();
    // Midtrans requires unique order_id. We use UUID.
    // Price: if plan.price_type == 'recurring', it's a subscription? 
    // Midtrans SNAP is usually one-time. For recurring, need Core API or subscription.
    // For MVP, user pays monthly manually or uses "subscription" feature of Midtrans if enabled.
    // Let's assume manual monthly payment for Pro, or One-time for BYOK.

    const amount = plan.price_monthly; // Assumption: price_monthly is the amount to pay now.

    if (amount <= 0) {
        // Free plan? Just upgrade immediately.
        // But we assumed Basic BYOK is 200k one-time?
        // Wait, schema has `price_monthly`. 
        // `plans` table: `price_monthly`, `price_type` (recurring/one_time).
        // Ideally `price` column, not `price_monthly` if one-time.
        // But let's use `price_monthly` as the "amount".
        return c.json({ error: 'Free plans do not require checkout' }, 400);
    }

    await db.insert(orders).values({
        id: orderId,
        user_id: user.id,
        plan_id: plan.id,
        amount,
        status: 'pending',
        midtrans_order_id: orderId, // Use same ID or append timestamp? UUID is unique enough.
    });

    // 3. Call Midtrans SNAP API
    const serverKey = c.env.MIDTRANS_SERVER_KEY;
    const isProduction = c.env.MIDTRANS_IS_PRODUCTION === 'true';
    const midtransUrl = isProduction
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const authString = btoa(`${serverKey}:`);

    const payload = {
        transaction_details: {
            order_id: orderId,
            gross_amount: amount,
        },
        customer_details: {
            first_name: user.name,
            email: user.email,
        },
        item_details: [{
            id: plan.id,
            price: amount,
            quantity: 1,
            name: plan.name,
        }],
        callbacks: {
            finish: "https://duweku.com/dashboard?payment=success" // Frontend URL
        }
    };

    try {
        const response = await fetch(midtransUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authString}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data: any = await response.json();

        if (response.status !== 201 && response.status !== 200) {
            console.error("Midtrans Error:", data);
            throw new Error(data.error_messages ? data.error_messages[0] : "Midtrans failed");
        }

        // Update order with snap_token
        await db.update(orders)
            .set({ snap_token: data.token })
            .where(eq(orders.id, orderId));

        return c.json({
            token: data.token,
            redirect_url: data.redirect_url,
            orderId
        });

    } catch (error: any) {
        console.error("Checkout Error:", error);
        return c.json({ error: error.message || 'Payment initiation failed' }, 500);
    }
});

export default app;
