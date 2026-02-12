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
}

export default function AccountDialog({ isOpen, onClose, onSuccess, workspaceId }: AccountDialogProps) {
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<AccountForm>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            type: 'cash',
            balance: 0
        }
    });

    const onSubmit = async (data: AccountForm) => {
        setLoading(true);
        try {
            await apiFetch(`/workspaces/${workspaceId}/accounts`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            reset();
            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Failed to save account");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-background rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">New Account</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input {...register('name')} placeholder="Cash / Bank BCA" />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium">Type</label>
                        <select {...register('type')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="cash">Cash</option>
                            <option value="bank">Bank</option>
                            <option value="ewallet">E-Wallet</option>
                            <option value="investment">Investment</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Initial Balance</label>
                        <Input
                            type="number"
                            {...register('balance', { valueAsNumber: true })}
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
