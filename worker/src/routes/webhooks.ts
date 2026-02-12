import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createDb } from '../db';
import { orders, users, plans } from '../db/schema';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: any }>();

app.post('/midtrans', async (c) => {
    const body = await c.req.json();
    // signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
    // Validation recommended but skipping for MVP to trust basic flow or implementing manual hash check if SubtleCrypto supports SHA512 easily.
    // SubtleCrypto supports SHA-512.

    const { order_id, transaction_status, gross_amount, signature_key, fraud_status } = body;

    // Verify signature
    const serverKey = c.env.MIDTRANS_SERVER_KEY;
    const rawString = `${order_id}${body.status_code}${gross_amount}${serverKey}`;

    const encoder = new TextEncoder();
    const data = encoder.encode(rawString);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex !== signature_key) {
        return c.json({ error: 'Invalid signature' }, 403);
    }

    const db = createDb(c.env.DB);

    // Map status
    let newStatus = 'pending';
    if (transaction_status == 'capture') {
        if (fraud_status == 'challenge') {
            newStatus = 'pending'; // challenge
        } else if (fraud_status == 'accept') {
            newStatus = 'paid';
        }
    } else if (transaction_status == 'settlement') {
        newStatus = 'paid';
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
        newStatus = 'failed';
    } else if (transaction_status == 'pending') {
        newStatus = 'pending';
    }

    // Update Order
    await db.update(orders)
        .set({
            status: newStatus as any,
            payment_type: body.payment_type,
            paid_at: newStatus === 'paid' ? new Date().toISOString() : null
        })
        .where(eq(orders.id, order_id));

    // If paid, upgrade user
    if (newStatus === 'paid') {
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, order_id),
        });

        if (order) {
            await db.update(users)
                .set({
                    plan_id: order.plan_id,
                    // If plan is 'pro-ai', users usually stay 'active'
                    // If status was suspended, maybe reactivate?
                    status: 'active'
                })
                .where(eq(users.id, order.user_id));

            // TODO: Maybe send notification (Telegram/Email)
        }
    }

    return c.json({ status: 'ok' });
});

export default app;
