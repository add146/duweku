import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Ban, CheckCircle } from 'lucide-react';
// import { useDebounce } from '@/hooks/use-debounce';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'suspended';
    created_at: string;
    plan_id: string | null;
}

export default function UsersList() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [totalPages, setTotalPages] = useState(1);

    // Simple debounce
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        fetchUsers();
    }, [page, debouncedSearch]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await apiFetch<{ data: User[], pagination: any }>(`/admin/users?page=${page}&limit=10&q=${debouncedSearch}`);
            setUsers(res.data);
            setTotalPages(res.pagination.totalPages);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (user: User) => {
        if (!confirm(`Are you sure you want to ${user.status === 'active' ? 'suspend' : 'activate'} ${user.name}?`)) return;

        try {
            const newStatus = user.status === 'active' ? 'suspended' : 'active';
            await apiFetch(`/admin/users/${user.id}/suspend`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            // Optimistic update
            setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        } catch (e) {
            alert("Failed to update status");
            console.error(e);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No users found.</TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === 'active' ? 'outline' : 'destructive'}>
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleStatus(user)}
                                            disabled={user.role === 'super_admin'}
                                        >
                                            {user.status === 'active' ? <Ban className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
