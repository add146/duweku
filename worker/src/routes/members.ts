import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { createDb } from '../db';
import { users, workspaces, workspaceMembers } from '../db/schema';
import { getWorkspaceRole } from '../middleware/auth';
import { Env } from '../index';

const app = new Hono<{ Bindings: Env; Variables: any }>();

// List members in a workspace
app.get('/:workspaceId', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    const user = c.get('user');
    const db = createDb(c.env.DB);

    // Check if current user is a member
    const role = await getWorkspaceRole(db, user.id, workspaceId);
    if (!role) return c.json({ error: 'Forbidden' }, 403);

    const members = await db.select({
        id: workspaceMembers.id,
        user_id: workspaceMembers.user_id,
        role: workspaceMembers.role,
        joined_at: workspaceMembers.joined_at,
        name: users.name,
        email: users.email,
        workspace_name: workspaces.name
    })
        .from(workspaceMembers)
        .innerJoin(users, eq(workspaceMembers.user_id, users.id))
        .innerJoin(workspaces, eq(workspaceMembers.workspace_id, workspaces.id))
        .where(eq(workspaceMembers.workspace_id, workspaceId))
        .all();

    return c.json({ data: members });
});

// Add member by email (Invite/Direct Add)
app.post('/:workspaceId/invite', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    const user = c.get('user');
    const { email, role } = await c.req.json(); // role defaults to 'member'
    const db = createDb(c.env.DB);

    // Only Owner can invite
    const currentRole = await getWorkspaceRole(db, user.id, workspaceId);
    if (currentRole !== 'owner') return c.json({ error: 'Forbidden: Only owner can invite' }, 403);

    if (!email) return c.json({ error: 'Email required' }, 400);

    // Find user by email
    const targetUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (!targetUser) return c.json({ error: 'User not found' }, 404);

    // Check if already member
    const existingMember = await db.select()
        .from(workspaceMembers)
        .where(
            and(
                eq(workspaceMembers.workspace_id, workspaceId),
                eq(workspaceMembers.user_id, targetUser.id)
            )
        ).get();

    if (existingMember) return c.json({ error: 'User is already a member' }, 409);

    // Add member
    const newMemberId = uuidv4();
    await db.insert(workspaceMembers).values({
        id: newMemberId,
        workspace_id: workspaceId,
        user_id: targetUser.id,
        role: role || 'member',
    });

    return c.json({ message: 'Member added successfully', id: newMemberId }, 201);
});

// Remove member (Kick or Leave)
app.delete('/:workspaceId/members/:memberId', async (c) => {
    const workspaceId = c.req.param('workspaceId');
    const memberId = c.req.param('memberId'); // This is the ID of the workspace_members record, OR user_id? Better use record ID or user_id. Let's assume user_id for API clarity or record ID.
    // Ideally use workspace_members.id or user_id. Let's support user_id for easier frontend.
    // Wait, the route says :memberId, usually implies the ID of the member resource.

    // Let's assume :memberId is the user_id to be removed to keep it consistent with "remove user X".
    const targetUserId = memberId;

    const user = c.get('user'); // Requesting user
    const db = createDb(c.env.DB);

    const currentRole = await getWorkspaceRole(db, user.id, workspaceId);
    if (!currentRole) return c.json({ error: 'Forbidden' }, 403);

    // Logic:
    // 1. Owner can remove anyone (except themselves via this route? usually delete workspace for that).
    // 2. Member can remove THEMSELVES (Leave).

    if (targetUserId !== user.id && currentRole !== 'owner') {
        return c.json({ error: 'Forbidden: Cannot remove other members' }, 403);
    }

    // Prevent owner from leaving if they are the only owner? 
    // For now simple delete.

    const result = await db.delete(workspaceMembers)
        .where(
            and(
                eq(workspaceMembers.workspace_id, workspaceId),
                eq(workspaceMembers.user_id, targetUserId)
            )
        )
        .returning();

    if (result.length === 0) return c.json({ error: 'Member not found' }, 404);

    return c.json({ message: 'Member removed' });
});

export default app;
