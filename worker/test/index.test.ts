import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('Health Check', () => {
    it('GET / should return 200 and status running', async () => {
        const res = await app.request('/', {}, env);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({
            name: 'DuweKu API',
            version: '1.0.0',
            status: 'running',
        });
    });
});
