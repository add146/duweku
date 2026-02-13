import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Check,
    ChevronRight,
    Brain,
    Info,
    Key,
    Eye,
    EyeOff,
    Zap,
    Save,
    Bell,
    Shield,
    Banknote,
    MessageCircle,
    Loader2,
    Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Settings() {
    const [user, setUser] = useState<any>(null);
    const [telegramLink, setTelegramLink] = useState('');
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    const { register, handleSubmit, setValue, watch } = useForm();
    const aiMode = watch('ai_mode');

    useEffect(() => {
        fetchProfile();
        fetchTelegramLink();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await apiFetch<{ user: any }>('/auth/me');
            setUser(res.user);
            setValue('name', res.user.name);
            setValue('ai_mode', res.user.ai_mode || 'global');
            // We don't fetch the actual API key for security, usually
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

    const handleTestConnection = async () => {
        setTesting(true);
        try {
            const res = await apiFetch<{ success: boolean; message?: string; error?: string; steps?: string[] }>('/ai/test', {
                method: 'POST',
            });
            if (res.success) {
                toast.success(res.message || "Koneksi berhasil! AI siap digunakan.");
            } else {
                toast.error(res.error || "Koneksi gagal.");
                console.error("Test steps:", res.steps);
            }
        } catch (e: any) {
            const errorMsg = e?.message || "Koneksi gagal. Periksa konfigurasi API Anda.";
            toast.error(errorMsg);
            console.error("Test error:", e);
        } finally {
            setTesting(false);
        }
    };

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            await apiFetch('/settings', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            toast.success("Pengaturan berhasil disimpan!");
            fetchProfile();
        } catch (e) {
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return <div className="p-8">Memuat...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-24">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Pengaturan</h1>
            </header>

            {/* Profile Card */}
            <section className="bg-card rounded-xl p-5 flex items-center gap-4 shadow-sm border border-border">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-2 border-background shadow-sm">
                        {user.name.charAt(0)}
                    </div>
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                        <Check className="text-primary-foreground h-3 w-3" />
                    </div>
                </div>
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        Paket Gratis
                    </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </section>

            {/* API Config Card */}
            <section className="bg-card rounded-xl p-6 shadow-sm border border-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Brain className="text-primary h-6 w-6" />
                            <h3 className="text-lg font-bold text-foreground">Konfigurasi API Gemini</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Gunakan kunci API Anda sendiri (BYOK) untuk batas kuota yang lebih tinggi dan akses model kustom.
                        </p>
                    </div>
                    <button className="text-primary hover:text-primary/80">
                        <Info className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mode AI</label>
                        <select
                            {...register('ai_mode')}
                            className={cn(
                                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            )}
                        >
                            <option value="global">Global (Kuota Bersama)</option>
                            <option value="byok">Gunakan Kunci Sendiri (Private)</option>
                        </select>
                    </div>

                    <div className="relative group">
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 ml-1">Google AI Studio Key</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="text-muted-foreground h-5 w-5" />
                            </span>
                            <Input
                                {...register('gemini_api_key')}
                                className="pl-10 pr-12 py-6 font-mono"
                                type={showApiKey ? "text" : "password"}
                                placeholder={
                                    user.has_api_key
                                        ? "**************** (Terkonfigurasi)"
                                        : (aiMode === 'byok' ? "Masukkan kunci baru untuk memperbarui" : "Opsional (Mode Global Aktif)")
                                }
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-primary transition-colors"
                            >
                                {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-1">
                        <div className={cn(
                            "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]",
                            user.has_api_key ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-gray-300"
                        )}></div>
                        <span className={cn(
                            "text-xs font-medium",
                            user.has_api_key ? "text-emerald-600" : "text-muted-foreground"
                        )}>
                            {user.has_api_key ? "Koneksi Terkonfigurasi" : "Kunci Belum Dikonfigurasi"}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2 rounded-full h-11"
                            onClick={handleTestConnection}
                            disabled={testing || saving}
                        >
                            {testing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                            {testing ? 'Menguji...' : 'Uji'}
                        </Button>
                        <Button type="submit" disabled={saving || testing} className="gap-2 rounded-full h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
                            <Save className="h-5 w-5" />
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </section>

            {/* Preferences */}
            <section className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-4">Preferensi</h4>
                <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm">
                    <div className="flex items-center justify-between p-4 border-b border-border/50 active:bg-muted transition-colors cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                <Bell className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Notifikasi</span>
                        </div>
                        <ChevronRight className="text-muted-foreground h-5 w-5" />
                    </div>
                    <div className="flex items-center justify-between p-4 border-b border-border/50 active:bg-muted transition-colors cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                                <Shield className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Keamanan & Privasi</span>
                        </div>
                        <ChevronRight className="text-muted-foreground h-5 w-5" />
                    </div>
                    <div className="flex items-center justify-between p-4 active:bg-muted transition-colors cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                                <Banknote className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Mata Uang</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">IDR (Rp)</span>
                            <ChevronRight className="text-muted-foreground h-5 w-5" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Telegram Integration */}
            <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="text-[#229ED9] h-6 w-6" />
                        <h3 className="text-lg font-bold text-foreground">Integrasi Telegram</h3>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    Hubungkan akun Anda ke DuweKu Bot untuk mengelola keuangan melalui chat.
                </p>
                {telegramLink ? (
                    <a
                        href={telegramLink}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#229ED9] text-white px-4 py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 w-full"
                    >
                        Buka Bot Telegram
                    </a>
                ) : (
                    <Button disabled className="w-full">Memuat Link...</Button>
                )}

                {telegramLink && (
                    <div className="mt-4 p-3 bg-muted rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground mb-2">
                            Jika tombol di atas tidak berfungsi, salin perintah ini dan kirim ke bot:
                        </p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-background p-2 rounded text-xs font-mono break-all select-all">
                                /start {telegramLink.split('=')[1]}
                            </code>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const token = telegramLink.split('=')[1];
                                    navigator.clipboard.writeText(`/start ${token}`);
                                    toast.success("Perintah disalin!");
                                }}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
