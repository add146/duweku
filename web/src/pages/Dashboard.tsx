import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Wallet, Plus, Send, RefreshCcw, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Link } from 'react-router-dom';

interface CategoryBreakdown {
    name: string | null;
    value: number;
    color: string | null;
}

interface DashboardStats {
    totalBalance: number;
    income: number;
    expense: number;
    cashFlow: number;
    period: { start: string, end: string };
    categoryBreakdown: CategoryBreakdown[];
}

interface Transaction {
    id: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    description: string | null;
    date: string;
    source: string | null;
    created_at: string;
}

const DEFAULT_COLORS = [
    '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

export default function Dashboard() {
    const { selectedWorkspace, loading: workspaceLoading } = useWorkspace();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentTx, setRecentTx] = useState<Transaction[]>([]);

    useEffect(() => {
        if (selectedWorkspace) {
            fetchStats(selectedWorkspace.id);
            fetchRecentTransactions(selectedWorkspace.id);
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

    const fetchRecentTransactions = async (workspaceId: string) => {
        try {
            const res = await apiFetch<{ data: Transaction[] }>(`/workspaces/${workspaceId}/transactions`);
            setRecentTx((res.data || []).slice(0, 5));
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



    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Hari ini';
        if (diffDays === 1) return 'Kemarin';
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const getSourceLabel = (source: string | null) => {
        switch (source) {
            case 'telegram_text': return '💬 Telegram';
            case 'telegram_image': return '📸 Telegram';
            case 'web_manual': return '🖥️ Manual';
            default: return '📝 Manual';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'income': return <ArrowDown className="w-4 h-4 text-emerald-600" />;
            case 'expense': return <ArrowUp className="w-4 h-4 text-rose-600" />;
            case 'transfer': return <RefreshCcw className="w-4 h-4 text-blue-600" />;
            default: return null;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'income': return 'bg-emerald-500/10';
            case 'expense': return 'bg-rose-500/10';
            case 'transfer': return 'bg-blue-500/10';
            default: return 'bg-gray-100';
        }
    };

    if (workspaceLoading) {
        return <div>Loading workspace...</div>;
    }

    if (!selectedWorkspace) {
        return <div>Please select a workspace.</div>;
    }

    // Build donut chart data
    const categoryData = stats?.categoryBreakdown?.filter(c => c.value > 0) || [];
    const totalExpense = categoryData.reduce((sum, c) => sum + c.value, 0);
    const topCategory = categoryData.length > 0 ? categoryData[0] : null;

    // Build conic-gradient for the donut
    let conicStops = '';
    let currentPercent = 0;
    categoryData.forEach((cat, i) => {
        const percent = totalExpense > 0 ? (cat.value / totalExpense) * 100 : 0;
        const color = cat.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
        conicStops += `${color} ${currentPercent}% ${currentPercent + percent}%, `;
        currentPercent += percent;
    });
    if (!conicStops) conicStops = 'var(--muted) 0% 100%, ';
    conicStops = conicStops.slice(0, -2); // Remove trailing ", "

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">DuweKu</h2>
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

                    {/* Stat Cards */}
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

                    {/* Bottom Section: Category + Transactions */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Category Breakdown Donut */}
                        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">Per Kategori</h3>
                                <Link to="/reports" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                                    Lihat Semua <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>

                            {categoryData.length > 0 ? (
                                <div className="flex flex-col sm:flex-row items-center gap-8">
                                    {/* Donut Chart */}
                                    <div className="relative flex-shrink-0">
                                        <div
                                            className="w-36 h-36 rounded-full"
                                            style={{
                                                background: `conic-gradient(${conicStops})`,
                                            }}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-20 h-20 rounded-full bg-card flex flex-col items-center justify-center">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Top</span>
                                                    <span className="text-sm font-bold truncate max-w-[70px]">{topCategory?.name || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="flex flex-col gap-3 min-w-0 flex-1">
                                        {categoryData.slice(0, 5).map((cat, i) => {
                                            const percent = totalExpense > 0 ? Math.round((cat.value / totalExpense) * 100) : 0;
                                            return (
                                                <div key={i} className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div
                                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                                            style={{ backgroundColor: cat.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
                                                        />
                                                        <span className="text-sm truncate">{cat.name || 'Tanpa Kategori'}</span>
                                                    </div>
                                                    <span className="text-sm font-medium text-muted-foreground flex-shrink-0">{percent}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-36 text-muted-foreground text-sm">
                                    Belum ada data pengeluaran bulan ini
                                </div>
                            )}
                        </div>

                        {/* Recent Transactions */}
                        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">Transaksi Terbaru</h3>
                                <Link to="/transactions" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                                    Lihat Semua <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>

                            {recentTx.length > 0 ? (
                                <div className="space-y-4">
                                    {recentTx.map((tx) => (
                                        <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 rounded-xl p-2 -mx-2 transition-colors">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(tx.type)}`}>
                                                    {getTypeIcon(tx.type)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{tx.description || 'Transaksi'}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(tx.date)} • {getSourceLabel(tx.source)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`text-sm font-semibold flex-shrink-0 sm:static pl-14 sm:pl-0 ${tx.type === 'income' ? 'text-emerald-600' :
                                                tx.type === 'expense' ? 'text-rose-600' :
                                                    'text-blue-600'
                                                }`}>
                                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-36 text-muted-foreground text-sm gap-2">
                                    <p>Belum ada transaksi</p>
                                    <p className="text-xs">Kirim pesan ke bot Telegram untuk memulai!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div>Loading stats...</div>
            )}
        </div>
    );
}
