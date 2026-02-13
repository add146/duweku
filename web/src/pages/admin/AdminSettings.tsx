import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Setting {
    key: string;
    value: string;
    description: string | null;
    updated_at: string;
}

export default function AdminSettings() {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    // Default settings to ensure they exist in UI even if not in DB yet
    const defaultSettings = [
        { key: 'gemini_api_key_pro', description: 'Global Gemini API Key for Pro Users', value: '' },
        { key: 'gemini_model_text', description: 'Gemini Model for Text Transactions', value: 'gemini-2.5-flash-lite' },
        { key: 'gemini_model_image', description: 'Gemini Model for Receipt Images', value: 'gemini-2.5-flash' },
        { key: 'payment_gateway_status', description: 'Payment Gateway Status (active/maintenance)', value: 'active' },
        { key: 'telegram_bot_token', description: 'Telegram Bot Token', value: '' },
        { key: 'telegram_bot_username', description: 'Telegram Bot Username (without @)', value: '' },
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await apiFetch<Setting[]>('/admin/settings');
            // Merge fetched settings with defaults
            const merged = defaultSettings.map(def => {
                const existing = res.find(s => s.key === def.key);
                return existing || { ...def, updated_at: new Date().toISOString() };
            });
            // Add any other settings from DB that are not in defaults
            res.forEach(s => {
                if (!defaultSettings.find(d => d.key === s.key)) {
                    merged.push(s);
                }
            });
            setSettings(merged);
        } catch (e) {
            console.error(e);
            toast.error("Failed to fetch settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key: string, value: string, description: string | null) => {
        setSaving(key);
        try {
            await apiFetch(`/admin/settings/${key}`, {
                method: 'PUT',
                body: JSON.stringify({ value, description })
            });

            setSettings(settings.map(s => s.key === key ? { ...s, value } : s));

            toast.success("Setting updated successfully");
        } catch (e) {
            console.error(e);
            toast.error("Failed to update setting");
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Global Configurations</CardTitle>
                    <CardDescription>
                        Manage system-wide settings and API keys. These affect all users on the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {settings.map((setting) => (
                        <div key={setting.key} className="grid w-full gap-2 p-4 border rounded-lg">
                            <Label htmlFor={setting.key} className="font-semibold">{setting.key}</Label>
                            <p className="text-sm text-muted-foreground mb-2">{setting.description}</p>
                            <div className="flex gap-2">
                                {(setting.key === 'gemini_model_text' || setting.key === 'gemini_model_image') ? (
                                    <select
                                        id={setting.key}
                                        value={setting.value}
                                        onChange={(e) => {
                                            const newVal = e.target.value;
                                            setSettings(prev => prev.map(s => s.key === setting.key ? { ...s, value: newVal } : s));
                                        }}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="" disabled>Select a model</option>
                                        <option value="gemini-3-pro-preview">gemini-3-pro-preview</option>
                                        <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
                                        <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                                        <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                                    </select>
                                ) : (
                                    <Input
                                        id={setting.key}
                                        defaultValue={setting.value}
                                        type={setting.key.includes('key') || setting.key.includes('token') ? 'password' : 'text'}
                                        onChange={(e) => {
                                            // Update local state without saving yet
                                            const newVal = e.target.value;
                                            setSettings(prev => prev.map(s => s.key === setting.key ? { ...s, value: newVal } : s));
                                        }}
                                    />
                                )}
                                <Button
                                    onClick={() => handleSave(setting.key, setting.value, setting.description)}
                                    disabled={saving === setting.key}
                                >
                                    {saving === setting.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Telegram Bot Setup</CardTitle>
                    <CardDescription>Actions to configure the Telegram Bot integration.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        onClick={async () => {
                            const toastId = toast.loading("Setting webhook...");
                            try {
                                const res = await apiFetch<any>('/admin/set-webhook', { method: 'POST' });
                                if (res.success) {
                                    toast.success("Webhook set successfully!", { id: toastId });
                                } else {
                                    toast.error(`Failed: ${res.error || 'Unknown error'}`, { id: toastId });
                                }
                            } catch (e) {
                                toast.error("Error setting webhook", { id: toastId });
                            }
                        }}
                    >
                        <Zap className="mr-2 h-4 w-4" />
                        Set Webhook URL
                    </Button>
                </CardContent>
            </Card>
        </div >
    );
}
