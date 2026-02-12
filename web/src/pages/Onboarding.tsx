import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Onboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [user, setUser] = useState<any>(null);
    const [telegramLink, setTelegramLink] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit } = useForm();

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(u);
        // Fetch telegram link if at relevant step? Or prefetch.
        if (step === 2) fetchTelegramLink();
    }, [step]);

    const fetchTelegramLink = async () => {
        try {
            const res = await apiFetch<{ url: string }>('/auth/telegram-link');
            setTelegramLink(res.url);
        } catch (e) {
            console.error(e);
        }
    };

    const onSubmitApiKey = async (data: any) => {
        setLoading(true);
        try {
            await apiFetch('/settings', {
                method: 'PUT',
                body: JSON.stringify({
                    gemini_api_key: data.apiKey,
                    ai_mode: 'byok'
                })
            });
            // Update local user
            const u = { ...user, ai_mode: 'byok' };
            localStorage.setItem('user', JSON.stringify(u));
            setUser(u);
            setStep(2);
        } catch (e) {
            alert("Failed to save API Key");
        } finally {
            setLoading(false);
        }
    };

    const finishOnboarding = () => {
        navigate('/dashboard');
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-card p-8 rounded-xl shadow border">

                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Setup AI (BYOK)</h2>
                        <p className="text-muted-foreground">
                            DuweKu uses generic AI by default. For privacy and higher limits, bring your own Google Gemini API Key.
                        </p>

                        <form onSubmit={handleSubmit(onSubmitApiKey)} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Gemini API Key</label>
                                <Input
                                    {...register('apiKey')}
                                    placeholder="AIzaSy..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Get it from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline">Google AI Studio</a>
                                </p>
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Saving...' : 'Save & Continue'}
                            </Button>
                            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(2)}>
                                Skip (Use Global AI)
                            </Button>
                        </form>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Connect Telegram</h2>
                        <p className="text-muted-foreground">
                            Link your Telegram account to chat with DuweKu Bot. Send receipts or text to record transactions instantly.
                        </p>

                        <div className="flex flex-col items-center gap-4 py-4">
                            {telegramLink ? (
                                <a
                                    href={telegramLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-[#229ED9] text-white px-6 py-3 rounded-full font-bold hover:opacity-90 transition-opacity"
                                >
                                    Start Telegram Bot
                                </a>
                            ) : (
                                <Button disabled>Loading Link...</Button>
                            )}
                            <p className="text-xs text-muted-foreground text-center">
                                Clicking this will open Telegram and start the bot with your secure token.
                            </p>
                        </div>

                        <Button onClick={finishOnboarding} className="w-full">
                            Go to Dashboard
                        </Button>
                    </div>
                )}

            </div>
        </div>
    );
}
