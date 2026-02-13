import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const accountSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['cash', 'bank', 'ewallet', 'investment', 'other']),
    balance: z.number(), // initial balance
});

type AccountForm = z.infer<typeof accountSchema>;

interface AccountDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    workspaceId: string;
    initialData?: any; // If provided, we are in Edit mode
}

export default function AccountDialog({ isOpen, onClose, onSuccess, workspaceId, initialData }: AccountDialogProps) {
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<AccountForm>({
        resolver: zodResolver(accountSchema),
        values: initialData ? {
            name: initialData.name,
            type: initialData.type,
            balance: initialData.balance
        } : {
            type: 'cash',
            balance: 0
        } as any
    });

    const onSubmit = async (data: AccountForm) => {
        setLoading(true);
        try {
            const url = initialData
                ? `/workspaces/${workspaceId}/accounts/${initialData.id}`
                : `/workspaces/${workspaceId}/accounts`;

            await apiFetch(url, {
                method: initialData ? 'PUT' : 'POST',
                body: JSON.stringify(data)
            });
            reset();
            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan akun");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">{initialData ? 'Edit Akun' : 'Akun Baru'}</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Nama</label>
                        <Input {...register('name')} placeholder="Tunai / Bank BCA" />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium">Tipe</label>
                        <select {...register('type')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="cash">Tunai</option>
                            <option value="bank">Bank</option>
                            <option value="ewallet">E-Wallet</option>
                            <option value="investment">Investasi</option>
                            <option value="other">Lainnya</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Saldo Awal</label>
                        <Input
                            type="number"
                            {...register('balance', { valueAsNumber: true })}
                        />
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
