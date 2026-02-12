import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a05195', '#d45087', '#f95d6a', '#ff7c43'];

export default function Reports() {
    const { selectedWorkspace } = useWorkspace();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [period, setPeriod] = useState('this_month'); // this_month, last_30_days

    useEffect(() => {
        if (selectedWorkspace) {
            fetchStats(selectedWorkspace.id);
        }
    }, [selectedWorkspace, period]);

    const fetchStats = async (workspaceId: string) => {
        setLoading(true);
        try {
            let query = '';
            if (period === 'this_month') {
                const start = startOfMonth(new Date()).toISOString().split('T')[0];
                const end = endOfMonth(new Date()).toISOString().split('T')[0];
                query = `?startDate=${start}&endDate=${end}`;
            } else if (period === 'last_30_days') {
                const end = new Date().toISOString().split('T')[0];
                const start = subDays(new Date(), 30).toISOString().split('T')[0];
                query = `?startDate=${start}&endDate=${end}`;
            }

            const res = await apiFetch<any>(`/workspaces/${workspaceId}/stats${query}`);
            setStats(res);
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

    if (!selectedWorkspace) return <div>Please select a workspace.</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
                    <p className="text-muted-foreground">Visualize your financial data.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={period === 'this_month' ? 'default' : 'outline'}
                        onClick={() => setPeriod('this_month')}
                    >
                        This Month
                    </Button>
                    <Button
                        variant={period === 'last_30_days' ? 'default' : 'outline'}
                        onClick={() => setPeriod('last_30_days')}
                    >
                        Last 30 Days
                    </Button>
                </div>
            </div>

            {loading ? (
                <div>Loading stats...</div>
            ) : stats ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Income vs Expense Bar Chart */}
                    <div className="col-span-2 rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="font-semibold mb-6">Daily Income vs Expense</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.dailyTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `${val / 1000}k`}
                                    />
                                    <Tooltip
                                        formatter={(value: number | undefined) => [formatCurrency(value || 0), '']}
                                        labelFormatter={(label) => format(new Date(label), 'dd MMM yyyy')}
                                    />
                                    <Legend />
                                    <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="Income" />
                                    <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expense" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Pie Chart */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="font-semibold mb-6">Expense by Category</h3>
                        <div className="h-[300px] w-full">
                            {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.categoryBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                                return (percent || 0) > 0.05 ? (
                                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                                        {`${((percent || 0) * 100).toFixed(0)}%`}
                                                    </text>
                                                ) : null;
                                            }}
                                        >
                                            {stats.categoryBreakdown.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number | undefined) => [formatCurrency(value || 0), 'Amount']} />
                                        <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    No expense data for this period
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <h3 className="font-semibold mb-4">Summary</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-muted-foreground">Total Income</span>
                                <span className="font-bold text-green-600">{formatCurrency(stats.income)}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-muted-foreground">Total Expense</span>
                                <span className="font-bold text-red-600">{formatCurrency(stats.expense)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-muted-foreground">Net Cash Flow</span>
                                <span className={`font-bold ${stats.cashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                    {formatCurrency(stats.cashFlow)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
