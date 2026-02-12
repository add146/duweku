import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Wallet,
    Receipt,
    Settings,
    LogOut,
    Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppLayout() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

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
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { label: 'Transactions', icon: Receipt, href: '/transactions' },
        { label: 'Accounts', icon: Wallet, href: '/accounts' },
        { label: 'Settings', icon: Settings, href: '/settings' },
    ];

    return (
        <div className="flex min-h-screen bg-muted/40">
            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-10 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-full flex flex-col">
                    <div className="h-14 flex items-center px-6 border-b">
                        <span className="text-xl font-bold text-primary">DuweKu</span>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="p-4 border-t">
                        <div className="flex items-center gap-3 px-3 py-2 mb-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {user.name.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-14 flex items-center px-4 border-b bg-background sticky top-0 z-10">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <h1 className="ml-4 text-lg font-semibold md:hidden">DuweKu</h1>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>

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
