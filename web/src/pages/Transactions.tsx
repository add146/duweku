import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import TransactionDialog from '@/components/transactions/TransactionDialog';

export default function Transactions() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            fetchTransactions(selectedWorkspace);
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

    const fetchTransactions = async (workspaceId: string) => {
        setLoading(true);
        try {
            const res = await apiFetch<{ data: any[] }>(`/workspaces/${workspaceId}/transactions`);
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

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await apiFetch(`/workspaces/${selectedWorkspace}/transactions/${id}`, { method: 'DELETE' });
            fetchTransactions(selectedWorkspace);
        } catch (e) {
            alert("Failed to delete");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
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
                    <Button onClick={() => setIsDialogOpen(true)}>Add Transaction</Button>
                </div>
            </div>

            <TransactionDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => fetchTransactions(selectedWorkspace)}
                workspaceId={selectedWorkspace}
            />

            <div className="flex gap-4">
                <Input placeholder="Search description..." className="max-w-sm" />
            </div>

            <div className="rounded-md border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Description</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Category</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Account</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Amount</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center">Loading...</td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center">No transactions found</td>
                                </tr>
                            ) : (
                                data.map((tx) => (
                                    <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle">{format(new Date(tx.date), 'dd MMM yyyy')}</td>
                                        <td className="p-4 align-middle">{tx.description}</td>
                                        <td className="p-4 align-middle">{tx.category?.name || '-'}</td>
                                        <td className="p-4 align-middle">{tx.account?.name || '-'}</td>
                                        <td className={cn(
                                            "p-4 align-middle text-right font-medium",
                                            tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                                        )}>
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(tx.id)}>Del</Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
