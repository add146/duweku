import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Type bindings for Cloudflare Worker
export type Env = {
    DB: D1Database;
    R2: R2Bucket;
    JWT_SECRET: string;
    ENCRYPTION_SECRET: string;
    GEMINI_API_KEY: string;
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_BOT_USERNAME: string;
    MIDTRANS_SERVER_KEY: string;
    MIDTRANS_CLIENT_KEY: string;
    MIDTRANS_IS_PRODUCTION: string;
};

type Variables = {
    user: {
        id: string;
        email: string;
        role: string;
        ai_mode: string;
        plan_id: string;
    } | null;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware
app.use('*', logger());
app.use('/api/*', cors({
    origin: (origin) => {
        if (!origin) return 'https://duweku.com';
        // Allow localhost
        if (origin.includes('localhost')) return origin;
        // Allow production domain
        if (origin === 'https://duweku.com' || origin === 'https://www.duweku.com' || origin === 'https://duweku.pages.dev') return origin;
        // Allow Cloudflare Pages preview URLs
        if (origin.endsWith('.duweku.pages.dev')) return origin;
        return 'https://duweku.com';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Health check
app.get('/', (c) => c.json({
    name: 'DuweKu API',
    version: '1.0.0',
    status: 'running',
}));

// TODO: Mount routes
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import aiRoutes from './routes/ai';
import botRoutes from './routes/bot';
import planRoutes from './routes/plans';
import webhookRoutes from './routes/webhooks';
import settingsRoutes from './routes/settings';

app.route('/api/auth', authRoutes);
app.route('/api/workspaces', workspaceRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api/bot', botRoutes);
app.route('/api/plans', planRoutes);
app.route('/api/webhooks', webhookRoutes);
app.route('/api/settings', settingsRoutes);
import membersRoutes from './routes/members';
app.route('/api/members', membersRoutes);
import adminRoutes from './routes/admin';
app.route('/api/admin', adminRoutes);
// app.route('/api/settings', settingsRoutes);
// app.route('/api/telegram', telegramRoutes);

// 404 fallback
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// Error handler
app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
