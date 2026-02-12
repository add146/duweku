import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Check, Zap, Crown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    description: string;
    features: string[];
    is_active: boolean;
    slug: string;
}

export default function Plans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    // Fallback data if API returns empty (since we might not have seeded DB)
    const defaultPlans: Plan[] = [
        {
            id: 'basic',
            name: 'Basic (BYOK)',
            slug: 'basic-byok',
            price_monthly: 0,
            description: 'Perfect for getting started with your own API key.',
            features: [
                'Unlimited Manual Transactions',
                'Bring Your Own Key (Gemini)',
                'Basic Reports',
                '1 Workspace',
                'Community Support'
            ],
            is_active: true
        },
        {
            id: 'pro',
            name: 'Pro (AI Included)',
            slug: 'pro-ai',
            price_monthly: 35000,
            description: 'All-in-one solution with managed AI access.',
            features: [
                'Everything in Basic',
                'Managed AI (No Key Required)',
                'Priority Support',
                'Unlimited Workspaces',
                'Advanced Analytics',
                'Export to CSV/PDF'
            ],
            is_active: true
        }
    ];

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await apiFetch<{ data: Plan[] }>('/plans');
            if (res.data && res.data.length > 0) {
                setPlans(res.data);
            } else {
                setPlans(defaultPlans);
            }
        } catch (e) {
            console.error("Failed to fetch plans, using default", e);
            setPlans(defaultPlans);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (plan: Plan) => {
        if (plan.price_monthly === 0) {
            alert("You are already on the free plan!");
            return;
        }

        try {
            // Initiate Midtrans (Mock for now if backend fails)
            const res = await apiFetch<{ token: string; redirect_url: string }>('/plans/checkout', {
                method: 'POST',
                body: JSON.stringify({ planId: plan.id })
            });

            if (res.redirect_url) {
                window.location.href = res.redirect_url;
            } else {
                alert("Payment initiation failed");
            }
        } catch (e) {
            alert("Checkout is currently disabled or failed. Coming soon!");
            console.error(e);
        }
    };

    if (loading) return <div className="p-8">Loading plans...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Simple, Transparent Pricing</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Choose the plan that fits your financial journey. No hidden fees.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start pt-8">
                {plans.map((plan) => {
                    const isPro = plan.price_monthly > 0;
                    return (
                        <div
                            key={plan.id}
                            className={cn(
                                "flex flex-col p-6 rounded-3xl border shadow-sm transition-all duration-300",
                                isPro
                                    ? "bg-card border-primary/50 shadow-xl shadow-primary/10 scale-105 relative"
                                    : "bg-card/50 border-border hover:border-primary/30"
                            )}
                        >
                            {isPro && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                    <Crown className="w-3 h-3" />
                                    MOST POPULAR
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                                    {isPro ? <Zap className="w-5 h-5 text-primary" /> : <Shield className="w-5 h-5 text-muted-foreground" />}
                                    {plan.name}
                                </h3>
                                <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-foreground">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(plan.price_monthly)}
                                    </span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {(plan.features || defaultPlans.find(p => p.id === (isPro ? 'pro' : 'basic'))?.features || []).map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={cn("mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0", isPro ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm text-foreground">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                size="lg"
                                variant={isPro ? 'default' : 'outline'}
                                className={cn("w-full rounded-xl font-semibold h-12", isPro && "shadow-lg shadow-primary/25")}
                                onClick={() => handleSubscribe(plan)}
                            >
                                {isPro ? 'Upgrade to Pro' : 'Current Plan'}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
