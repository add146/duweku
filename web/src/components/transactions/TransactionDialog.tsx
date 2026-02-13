import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Dialog components (simplified for MVP, ideally use Shadcn Dialog)
// Since I skipped installing all Shadcn components, I'll build a simple overlay modal.

const transactionSchema = z.object({
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z.number().min(1),
    description: z.string().optional(),
    category_id: z.string().optional(), // ID
    account_id: z.string(),
    date: z.string(), // YYYY-MM-DD
});

type TransactionForm = z.infer<typeof transactionSchema>;

interface TransactionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    workspaceId: string;
}

export default function TransactionDialog({ isOpen, onClose, onSuccess, workspaceId }: TransactionDialogProps) {
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<TransactionForm>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: 'expense',
            date: new Date().toISOString().split('T')[0]
        }
    });

    useEffect(() => {
        if (isOpen && workspaceId) {
            fetchData();
        }
    }, [isOpen, workspaceId]);

    const fetchData = async () => {
        try {
            const [accRes, catRes] = await Promise.all([
                apiFetch<{ data: any[] }>(`/workspaces/${workspaceId}/accounts`),
                apiFetch<{ data: any[] }>(`/workspaces/${workspaceId}/categories`)
            ]);
            setAccounts(accRes.data);
            setCategories(catRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    const onSubmit = async (data: TransactionForm) => {
        setLoading(true);
        try {
            await apiFetch(`/workspaces/${workspaceId}/transactions`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            reset();
            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan transaksi");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Transaksi Baru</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="flex gap-4">
                        <select {...register('type')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="expense">Pengeluaran</option>
                            <option value="income">Pemasukan</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Jumlah</label>
                        <Input
                            type="number"
                            {...register('amount', { valueAsNumber: true })}
                        />
                        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium">Deskripsi</label>
                        <Input {...register('description')} />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Akun</label>
                        <select {...register('account_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Pilih Akun</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        {errors.account_id && <p className="text-xs text-destructive">{errors.account_id.message}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium">Kategori</label>
                        <select {...register('category_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Pilih Kategori</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Tanggal</label>
                        <Input type="date" {...register('date')} />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
