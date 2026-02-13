import { env } from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../src/index';
// @ts-ignore
import { applyMigrations, createTestUser } from './test-utils';

describe('Workspace API', () => {
    beforeAll(async () => {
        await applyMigrations();
    });

    it('should create a new workspace', async () => {
        const { headers } = await createTestUser();
        const payload = {
            name: 'My New Workspace',
            type: 'personal',
            currency: 'USD'
        };

        const res = await app.request('/api/workspaces', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers
        }, env);

        expect(res.status).toBe(201);
        const body = await res.json() as any;
        expect(body).toHaveProperty('id');
        expect(body.name).toBe(payload.name);
        expect(body.role).toBe('owner');
    });

    it('should list user workspaces', async () => {
        const { headers } = await createTestUser();

        // Create one first
        await app.request('/api/workspaces', {
            method: 'POST',
            body: JSON.stringify({ name: 'Workspace 1', type: 'personal' }),
            headers
        }, env);

        const res = await app.request('/api/workspaces', {
            method: 'GET',
            headers
        }, env);

        expect(res.status).toBe(200);
        const body = await res.json() as any;
        expect(body.data).toBeInstanceOf(Array);
        expect(body.data.length).toBeGreaterThanOrEqual(1);
        expect(body.data[0]).toHaveProperty('role');
    });
});
