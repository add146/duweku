import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Settings() {
    const [user, setUser] = useState<any>(null);
    const [telegramLink, setTelegramLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const { register, handleSubmit, setValue } = useForm();

    useEffect(() => {
        fetchProfile();
        fetchTelegramLink();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await apiFetch<{ user: any }>('/auth/me');
            setUser(res.user);
            setValue('name', res.user.name);
            setValue('ai_mode', res.user.ai_mode);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTelegramLink = async () => {
        try {
            const res = await apiFetch<{ url: string }>('/auth/telegram-link');
            setTelegramLink(res.url);
        } catch (e) {
            console.error(e);
        }
    };

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            await apiFetch('/settings', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            alert("Settings saved!");
            fetchProfile();
        } catch (e) {
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="max-w-2xl space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your account and preferences.</p>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm space-y-6">
                <h3 className="text-xl font-semibold">Profile</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input {...register('name')} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input value={user.email} disabled className="bg-muted" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">AI Mode</label>
                        <select {...register('ai_mode')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="global">Global (Shared Limit)</option>
                            <option value="byok">Bring Your Own Key (Private)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Gemini API Key</label>
                        <Input
                            {...register('gemini_api_key')}
                            type="password"
                            placeholder={user.ai_mode === 'byok' ? "Enter new key to update" : "Optional"}
                        />
                        <p className="text-xs text-muted-foreground">
                            Required if you select BYOK mode. Stored securely.
                        </p>
                    </div>

                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </form>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm space-y-6">
                <h3 className="text-xl font-semibold">Telegram Integration</h3>
                <p className="text-sm text-muted-foreground">
                    Link your account to DuweKu Bot to manage finances via chat.
                </p>

                <div className="flex items-center gap-4">
                    {telegramLink ? (
                        <a
                            href={telegramLink}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#229ED9] text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            Open Telegram Bot
                        </a>
                    ) : (
                        <Button disabled>Loading Link...</Button>
                    )}
                </div>
            </div>
        </div>
    );
}
