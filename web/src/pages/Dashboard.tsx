import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    useEffect(() => {
        if (selectedWorkspace) {
            fetchStats(selectedWorkspace);
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
            console.error("Failed to fetch workspaces", error);
        } finally {
            if (workspaces.length === 0) setLoading(false);
        }
    };

    const fetchStats = async (workspaceId: string) => {
        setLoading(true);
        try {
            const res = await apiFetch<any>(`/workspaces/${workspaceId}/stats`);
            setStats(res);
        } catch (error) {
            console.error("Failed to fetch stats", error);
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

    if (!selectedWorkspace && !loading && workspaces.length === 0) {
        return <div className="p-8">Please create a workspace first.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div>
                    {/* Workspace Switcher Placeholder */}
                    <span className="text-sm text-muted-foreground mr-2">Workspace:</span>
                    <select
                        className="border rounded p-1"
                        value={selectedWorkspace}
                        onChange={(e) => setSelectedWorkspace(e.target.value)}
                    >
                        {workspaces.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {stats ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Balance</h3>
                        <div className="text-2xl font-bold mt-2">{formatCurrency(stats.totalBalance)}</div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Income (This Month)</h3>
                        <div className="text-2xl font-bold mt-2 text-green-600">+{formatCurrency(stats.income)}</div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Expense (This Month)</h3>
                        <div className="text-2xl font-bold mt-2 text-red-600">-{formatCurrency(stats.expense)}</div>
                    </div>
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Cash Flow</h3>
                        <div className={`text-2xl font-bold mt-2 ${stats.cashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {stats.cashFlow >= 0 ? '+' : ''}{formatCurrency(stats.cashFlow)}
                        </div>
                    </div>
                </div>
            ) : (
                <div>Loading stats...</div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold mb-4">Overview</h3>
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                        Chart Placeholder
                    </div>
                </div>
                <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold mb-4">Recent Transactions</h3>
                    <div className="space-y-4">
                        {/* Fetch recent transactions later */}
                        <div className="text-sm text-muted-foreground">No recent transactions</div>
                    </div>
                </div>
            </div>

        </div>
    );
}
