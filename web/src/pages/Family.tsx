import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function Family() {
    const { selectedWorkspace } = useWorkspace();
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const { register, handleSubmit, reset } = useForm();
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        if (selectedWorkspace) {
            fetchMembers(selectedWorkspace.id);
        }
    }, [selectedWorkspace]);

    const fetchMembers = async (workspaceId: string) => {
        setLoading(true);
        try {
            const res = await apiFetch<{ data: any[] }>(`/members/${workspaceId}`);
            setMembers(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onInvite = async (data: any) => {
        if (!selectedWorkspace) return;
        setInviting(true);
        try {
            await apiFetch(`/members/${selectedWorkspace.id}/invite`, {
                method: 'POST',
                body: JSON.stringify({ email: data.email, role: 'member' })
            });
            alert("Member added successfully!");
            reset();
            setIsInviteOpen(false);
            fetchMembers(selectedWorkspace.id);
        } catch (e: any) {
            alert(e.message || "Failed to add member. Ensure user is registered.");
        } finally {
            setInviting(false);
        }
    };

    const removeMember = async (memberId: string) => {
        if (!selectedWorkspace || !confirm("Are you sure you want to remove this member?")) return;
        try {
            // BE expects user_id for now based on my implementation
            // But wait, my BE implementation: app.delete('/:workspaceId/members/:memberId' ... const targetUserId = memberId)
            // So we pass user_id.
            await apiFetch(`/members/${selectedWorkspace.id}/members/${memberId}`, { method: 'DELETE' });
            fetchMembers(selectedWorkspace.id);
        } catch (e) {
            alert("Failed to remove member");
        }
    };

    if (!selectedWorkspace) return <div>Please select a workspace.</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Family & Members</h2>
                    <p className="text-muted-foreground">Manage access to your workspace.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsInviteOpen(true)}>Invite Member</Button>
                </div>
            </div>

            {isInviteOpen && (
                <div className="bg-card p-4 rounded-lg border shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-semibold mb-2">Invite New Member</h3>
                    <form onSubmit={handleSubmit(onInvite)} className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input {...register('email', { required: true })} placeholder="user@example.com" />
                            <p className="text-xs text-muted-foreground">User must already be registered in DuweKu.</p>
                        </div>
                        <Button type="submit" disabled={inviting}>
                            {inviting ? 'Adding...' : 'Add Member'}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                    </form>
                </div>
            )}

            <div className="rounded-md border bg-card">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Name</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Email</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Role</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Joined</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                        ) : members.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center">No members found</td></tr>
                        ) : (
                            members.map((m) => (
                                <tr key={m.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">{m.name}</td>
                                    <td className="p-4 align-middle">{m.email}</td>
                                    <td className="p-4 align-middle">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold boader ${m.role === 'owner' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'
                                            }`}>
                                            {m.role}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle">{m.joined_at ? format(new Date(m.joined_at), 'dd MMM yyyy') : '-'}</td>
                                    <td className="p-4 align-middle text-right">
                                        {m.role !== 'owner' && (
                                            <Button variant="destructive" size="sm" onClick={() => removeMember(m.user_id)}>Remove</Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
