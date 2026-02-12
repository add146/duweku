import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Wallet, Plus, Send, RefreshCcw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';

interface DashboardStats {
    totalBalance: number;
    income: number;
    expense: number;
    cashFlow: number;
    period: { start: string, end: string };
}

export default function Dashboard() {
    const { selectedWorkspace, loading: workspaceLoading } = useWorkspace();
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        if (selectedWorkspace) {
            fetchStats(selectedWorkspace.id);
        }
    }, [selectedWorkspace]);

    const fetchStats = async (workspaceId: string) => {
        try {
            const res = await apiFetch<DashboardStats>(`/workspaces/${workspaceId}/stats`);
            setStats(res);
        } catch (e) {
            console.error(e);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (workspaceLoading) {
        return <div>Loading workspace...</div>;
    }

    if (!selectedWorkspace) {
        return <div>Please select a workspace.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
            </div>

            {stats ? (
                <>
                    {/* Hero Card - Total Saldo */}
                    <div className="relative w-full rounded-3xl bg-primary overflow-hidden shadow-xl shadow-primary/20 mb-8">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Wallet className="w-48 h-48 text-primary-foreground" />
                        </div>
                        <div className="relative z-10 p-6 md:p-10 text-primary-foreground flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <p className="text-primary-foreground/80 text-sm font-medium tracking-wider mb-2 uppercase">Total Saldo Aktif</p>
                                <h2 className="text-4xl md:text-5xl font-mono font-medium tracking-tighter mb-4">{formatCurrency(stats.totalBalance)}</h2>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm font-medium">
                                    <span className={`flex items-center ${stats.cashFlow >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                        {stats.cashFlow >= 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                                        {formatCurrency(stats.cashFlow)}
                                    </span>
                                    <span className="opacity-80">bulan ini</span>
                                </div>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <Button className="flex-1 md:flex-none bg-white text-primary hover:bg-white/90 font-semibold h-12 px-6 rounded-xl shadow-lg">
                                    <Plus className="mr-2 h-5 w-5" />
                                    Top Up
                                </Button>
                                <Button className="flex-1 md:flex-none bg-primary-foreground/20 text-white hover:bg-primary-foreground/30 font-semibold h-12 px-6 rounded-xl border border-white/10 backdrop-blur-md">
                                    <Send className="mr-2 h-5 w-5" />
                                    Kirim
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4 hover:translate-y-[-2px] transition-transform duration-300">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <ArrowDown className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Pemasukan</p>
                                <div className="text-2xl font-bold mt-1">{formatCurrency(stats.income)}</div>
                            </div>
                        </div>
                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4 hover:translate-y-[-2px] transition-transform duration-300">
                            <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
                                <ArrowUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Pengeluaran</p>
                                <div className="text-2xl font-bold mt-1">{formatCurrency(stats.expense)}</div>
                            </div>
                        </div>
                        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4 hover:translate-y-[-2px] transition-transform duration-300">
                            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-accent">
                                <RefreshCcw className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Cash Flow</p>
                                <div className="text-2xl font-bold mt-1">{formatCurrency(stats.cashFlow)}</div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div>Loading stats...</div>
            )}
        </div>
    );
}
