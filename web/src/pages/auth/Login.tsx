import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '@/lib/api';

const loginSchema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        setError('');
        try {
            const res = await auth.login(data);
            localStorage.setItem('token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen flex flex-col md:flex-row overflow-hidden bg-background">
            {/* Left Side - Hero/Branding */}
            <div className="hidden md:flex flex-col justify-between w-full md:w-1/2 bg-primary p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full bg-white blur-3xl translate-x-1/2 translate-y-1/2"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-bold text-xl shadow-lg">
                            D
                        </div>
                        <span className="text-2xl font-bold tracking-tight">DuweKu</span>
                    </div>
                    <div className="max-w-md">
                        <h1 className="text-4xl font-bold leading-tight mb-6">Kelola Keuangan Anda dengan Lebih Bijak.</h1>
                        <p className="text-primary-foreground/90 text-lg">Pantau pengeluaran, atur anggaran, dan capai tujuan finansial Anda bersama ribuan pengguna lainnya.</p>
                    </div>
                </div>

                <div className="relative z-10 mt-auto">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-lg">
                        <div className="flex gap-1 text-secondary mb-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <span key={i} className="material-symbols-outlined text-lg fill-1">star</span>
                            ))}
                        </div>
                        <p className="text-lg italic font-medium mb-4">"Sejak menggunakan DuweKu, saya bisa menabung 30% lebih banyak dari gaji bulanan saya. Fitur analisisnya sangat membantu!"</p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-2 border-white/50 bg-gray-300 flex items-center justify-center text-gray-600 font-bold overflow-hidden">
                                <span className="material-symbols-outlined text-3xl">person</span>
                            </div>
                            <div>
                                <p className="font-bold">Sari Wulandari</p>
                                <p className="text-sm opacity-80">Freelance Designer</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 bg-background overflow-y-auto">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center md:text-left">
                        <div className="md:hidden flex justify-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                D
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-foreground">Selamat Datang Kembali</h2>
                        <p className="mt-2 text-muted-foreground">Silakan masukkan detail akun Anda untuk masuk.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                        {error && (
                            <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">error</span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="email">Email</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-muted-foreground">mail</span>
                                    </div>
                                    <input
                                        {...register('email')}
                                        id="email"
                                        type="email"
                                        className="block w-full pl-10 pr-3 py-3 border border-border rounded-xl leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                        placeholder="nama@email.com"
                                    />
                                </div>
                                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-foreground" htmlFor="password">Kata Sandi</label>
                                    <Link to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary-foreground transition-colors">Lupa Kata Sandi?</Link>
                                </div>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-muted-foreground">lock</span>
                                    </div>
                                    <input
                                        {...register('password')}
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        className="block w-full pl-10 pr-10 py-3 border border-border rounded-xl leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors"
                                        placeholder="••••••••"
                                    />
                                    <div
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-symbols-outlined text-xl">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </div>
                                </div>
                                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                        Memproses...
                                    </span>
                                ) : (
                                    'Masuk'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-background text-muted-foreground">Atau masuk dengan</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <button type="button" className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl shadow-sm bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                            </svg>
                            Masuk dengan Google
                        </button>
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-sm text-muted-foreground">
                            Belum punya akun?{' '}
                            <Link to="/register" className="font-semibold text-primary hover:text-primary/90 transition-colors">
                                Daftar Sekarang
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
