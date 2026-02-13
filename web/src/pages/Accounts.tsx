import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AccountDialog from '@/components/accounts/AccountDialog';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Pencil, Archive } from 'lucide-react';

export default function Accounts() {
    const { selectedWorkspace } = useWorkspace();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);

    useEffect(() => {
        if (selectedWorkspace) {
            fetchAccounts(selectedWorkspace.id);
        }
    }, [selectedWorkspace]);

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

    const handleArchive = async (accountId: string) => {
        if (!confirm("Arsip akun ini? Sejarah transaksi akan tetap ada tapi akun ini tidak bisa digunakan lagi.")) return;
        try {
            await apiFetch(`/workspaces/${selectedWorkspace!.id}/accounts/${accountId}`, { method: 'DELETE' });
            fetchAccounts(selectedWorkspace!.id);
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (acc: any) => {
        setEditingAccount(acc);
        setIsDialogOpen(true);
    };

    if (!selectedWorkspace) return <div>Harap pilih workspace.</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Akun</h2>
                <div className="flex gap-2">
                    <Button onClick={() => { setEditingAccount(null); setIsDialogOpen(true); }}>Akun Baru</Button>
                </div>
            </div>

            <AccountDialog
                isOpen={isDialogOpen}
                onClose={() => { setIsDialogOpen(false); setEditingAccount(null); }}
                onSuccess={() => fetchAccounts(selectedWorkspace.id)}
                workspaceId={selectedWorkspace.id}
                initialData={editingAccount}
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div>Memuat...</div>
                ) : data.length === 0 ? (
                    <div>Akun tidak ditemukan. Buat baru untuk memulai.</div>
                ) : (
                    data.map((acc) => (
                        <div key={acc.id} className={`rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between h-[150px] relative ${!acc.is_active ? 'opacity-50 grayscale' : ''}`}>
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={() => handleEdit(acc)}
                                    className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                                    title="Edit Nama/Saldo"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                {acc.is_active && (
                                    <button
                                        onClick={() => handleArchive(acc.id)}
                                        className="p-1 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                                        title="Arsipkan"
                                    >
                                        <Archive className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div>
                                <div className="flex justify-between items-start mr-12">
                                    <h3 className="font-semibold text-lg">{acc.name}</h3>
                                    <span className="text-xs bg-muted px-2 py-1 rounded capitalize">{acc.type}</span>
                                </div>
                                {!acc.is_active && <span className="text-[10px] text-destructive font-bold uppercase">Terarsipkan</span>}
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
