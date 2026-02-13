import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Wallet,
    Receipt,
    Settings,
    LogOut,
    Menu,
    Users,
    BarChart3,
    CreditCard,
    Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher';
import TransactionDialog from '@/components/transactions/TransactionDialog';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function AppLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isTxOpen, setIsTxOpen] = useState(false);
    const { selectedWorkspace } = useWorkspace();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    const navItems = [
        { label: 'Beranda', icon: LayoutDashboard, href: '/dashboard' },
        { label: 'Akun', icon: Wallet, href: '/accounts' },
        { label: 'Transaksi', icon: Receipt, href: '/transactions' },
        { label: 'Laporan', icon: BarChart3, href: '/reports' },
        { label: 'Anggota', icon: Users, href: '/members' },
        { label: 'Paket', icon: CreditCard, href: '/plans' },
        { label: 'Pengaturan', icon: Settings, href: '/settings' },
    ];

    return (
        <div className="flex min-h-screen bg-muted/40">
            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-20 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static flex flex-col",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-20 flex items-center px-8 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/30">
                            D
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-foreground">DuweKu</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Menu Utama</p>
                    {navItems.slice(0, 4).map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors hover:bg-muted text-muted-foreground hover:text-primary",
                                location.pathname === item.href && "bg-primary/10 text-primary"
                            )}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}

                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-8 mb-2">Workspace</p>
                    <div className="px-4 mb-4">
                        <WorkspaceSwitcher />
                    </div>

                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">Sistem</p>
                    {navItems.slice(4).map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors hover:bg-muted text-muted-foreground hover:text-primary",
                                location.pathname === item.href && "bg-primary/10 text-primary"
                            )}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}

                    {/* Admin Link - Only for super_admin */}
                    {user?.role === 'super_admin' && (
                        <Link
                            to="/admin"
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors hover:bg-muted text-muted-foreground hover:text-primary",
                                location.pathname === "/admin" && "bg-primary/10 text-primary"
                            )}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <Users className="h-5 w-5" />
                            Admin
                        </Link>
                    )}
                </div>

                <div className="p-4 border-t border-border/50">
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted cursor-pointer transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border-2 border-background shadow-sm">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">Free Plan</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-14 hidden md:flex items-center px-4 border-b bg-background sticky top-0 z-10">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <h1 className="ml-4 text-lg font-semibold md:hidden">DuweKu</h1>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-lg border-t border-border px-4 py-3 pb-3 flex justify-between items-center shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                {navItems.slice(0, 2).map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-all duration-200 flex-1",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6", isActive && "fill-primary/20")} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                        </Link>
                    )
                })}

                <div className="relative -top-6 flex-1 flex justify-center">
                    <button
                        onClick={() => setIsTxOpen(true)}
                        className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/40 hover:opacity-90 active:scale-95 transition-all"
                    >
                        <Plus className="h-8 w-8 stroke-[3px]" />
                    </button>
                </div>

                {navItems.slice(2, 3).map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-all duration-200 flex-1",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6", isActive && "fill-primary/20")} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                        </Link>
                    )
                })}
                <Link
                    to="/settings"
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all duration-200 flex-1",
                        location.pathname === '/settings' ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <Settings className={cn("h-6 w-6", location.pathname === '/settings' && "fill-primary/20")} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Pengaturan</span>
                </Link>
            </div>

            {selectedWorkspace && (
                <TransactionDialog
                    isOpen={isTxOpen}
                    onClose={() => setIsTxOpen(false)}
                    onSuccess={() => { }}
                    workspaceId={selectedWorkspace.id}
                />
            )}

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-0 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
