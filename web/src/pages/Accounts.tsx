import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AccountDialog from '@/components/accounts/AccountDialog';

export default function Accounts() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            fetchAccounts(selectedWorkspace);
        }
    }, [selectedWorkspace]);

    const fetchWorkspaces = async () => {
        try {
            const res = await apiFetch<{ data: any[] }>('/workspaces');
            setWorkspaces(res.data);
            if (res.data.length > 0) {
                setSelectedWorkspace(res.data[0].id);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAccounts = async (workspaceId: string) => {
        setLoading(true);
        try {
            const res = await apiFetch<{ data: any[] }>(`/workspaces/${workspaceId}/accounts`);
            setData(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
                <div className="flex gap-2">
                    <select
                        className="border rounded p-1"
                        value={selectedWorkspace}
                        onChange={(e) => setSelectedWorkspace(e.target.value)}
                    >
                        {workspaces.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                    <Button onClick={() => setIsDialogOpen(true)}>New Account</Button>
                </div>
            </div>

            <AccountDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => fetchAccounts(selectedWorkspace)}
                workspaceId={selectedWorkspace}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div>Loading...</div>
                ) : data.length === 0 ? (
                    <div>No accounts found. Create one to get started.</div>
                ) : (
                    data.map((acc) => (
                        <div key={acc.id} className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between h-[150px]">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-lg">{acc.name}</h3>
                                    <span className="text-xs bg-muted px-2 py-1 rounded capitalize">{acc.type}</span>
                                </div>
                                <p className="text-muted-foreground text-sm mt-1">{/* Icon placeholder */}</p>
                            </div>
                            <div className="text-2xl font-bold">
                                {formatCurrency(acc.balance)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
