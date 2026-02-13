import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div className="bg-background text-foreground antialiased selection:bg-primary selection:text-white font-display">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
                                D
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-foreground">DuweKu</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-muted-foreground hover:text-primary font-medium transition-colors">Fitur</a>
                            <a href="#" className="text-muted-foreground hover:text-primary font-medium transition-colors">Harga</a>
                            <a href="#" className="text-muted-foreground hover:text-primary font-medium transition-colors">Testimoni</a>
                            <a href="#" className="text-muted-foreground hover:text-primary font-medium transition-colors">Bantuan</a>
                        </div>
                        <div className="hidden md:flex items-center space-x-4">
                            <Link to="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">Masuk</Link>
                            <Link to="/register" className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40">Daftar</Link>
                        </div>
                        <div className="md:hidden flex items-center">
                            <button className="text-gray-500 hover:text-primary">
                                <span className="material-symbols-outlined text-3xl">menu</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden blob-bg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                Aplikasi Manajemen Keuangan #1
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6 text-foreground">
                                Kelola Keuangan Jadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Lebih Mudah</span>
                            </h1>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
                                Pantau pemasukan, atur pengeluaran, dan capai tujuan finansial Anda dengan dashboard intuitif yang dirancang untuk produktivitas.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/register" className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-glow hover:-translate-y-1 text-center">
                                    Mulai Gratis
                                </Link>
                                <button className="px-8 py-4 bg-white text-primary border-2 border-primary/20 rounded-2xl font-bold text-lg hover:bg-primary/5 hover:border-primary transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">play_circle</span>
                                    Lihat Demo
                                </button>
                            </div>
                            <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex -space-x-2">
                                    <img alt="User" className="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBL10aOvP4BnszlggLXSPzyVqNTfMLXEj4XsuZlnDMKk1YfWvnkzykwxyp7IPGuLDz3VYNDb9U4U549tnoSMr-xuFJpLeaDOeNKgBsedszv6lsMkwVeqPE2s0lTNW_aJ2wfmfptB8e2QuW3zilveNIVoMmMDh4ED1xWGVGi0MMFBdhEJRlgnjGo5k1FsXOU4kzWQPd-7JBoQKk4OnlrzwCnoUs8nj6lCMvXjSjOxb8fSWezPSL8IDZ_W9FxcwuU7Nw1H9gSROZ7HW4n" />
                                    <img alt="User" className="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoCgWT7hMTKRzpQRclChIaIR4MVzbVZaJfg9o01mX6zqt__7gH1XtOyIKJpHojyL8J1NK_VfL0ctVd3z1pS67Xh7TqIwwEXASlrIIYGRJ4j-UwTH3_FI3T7gXNfu6iwygrWM5ev76MjPP1NBLIxFFcuBngdW8d04-D98MJsflysyuMeGM1IgYHTAaT6eo_JMS8t7JwUO_MWswKPU-4WLIYOuf8aNijjR2asKRKZNEECIbstKpAYcpJ5piUQCupbbd1UHEY1cWIGcIx" />
                                    <img alt="User" className="w-8 h-8 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlMGZxfI4VPBLTstuqS_-0g5qdpUrA18yWkJnwAFdm42gnehzOJv2CH9YHKnESSK2l3QHfW8CzkYlPQZL6crF_sXFb0UlzqtP0Y7PAZ2lTIf74NYnFr1TEpVn-JO-mVDro6InPeSoHw-CxHLQ-1gIAeSS41dYKsdHYnEs2PrA62Fm0lyhiQTFF1kxoG7ubgKygzMW9B-8guoHin7MJaW30bHwrmRnh23iLpKHQmtfjSiXaoHPsUxm2SWgN3rMMu-aK-9d-1qWbSbf-" />
                                </div>
                                <p>Dipercaya oleh <span className="font-bold text-foreground">10,000+</span> pengguna aktif</p>
                            </div>
                        </div>

                        {/* 3D Card Visual */}
                        <div className="relative lg:h-[600px] flex items-center justify-center perspective-1000 hidden md:flex">
                            <div className="absolute top-10 right-10 w-72 h-72 bg-secondary/20 rounded-full blur-3xl -z-10"></div>
                            <div className="absolute bottom-10 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl -z-10"></div>
                            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 transform rotate-y-12 rotate-x-6 hover:rotate-0 transition-transform duration-700 ease-out">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Saldo</p>
                                        <h3 className="text-3xl font-bold text-gray-800">Rp 15.240.000</h3>
                                    </div>
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">wallet</span>
                                    </div>
                                </div>
                                <div className="h-32 bg-gray-50 rounded-xl mb-6 relative overflow-hidden flex items-end justify-between px-4 pb-2">
                                    <div className="w-8 bg-primary/20 h-[40%] rounded-t-sm"></div>
                                    <div className="w-8 bg-primary/40 h-[60%] rounded-t-sm"></div>
                                    <div className="w-8 bg-primary/60 h-[30%] rounded-t-sm"></div>
                                    <div className="w-8 bg-primary h-[80%] rounded-t-sm relative group">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            +25% Growth
                                        </div>
                                    </div>
                                    <div className="w-8 bg-primary/50 h-[50%] rounded-t-sm"></div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                                            <span className="material-symbols-outlined text-lg">restaurant</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-gray-800">Makan Siang</h4>
                                            <p className="text-xs text-gray-500">Food & Beverage</p>
                                        </div>
                                        <span className="text-sm font-bold text-red-500">-Rp 45.000</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-lg">work</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-gray-800">Gaji Bulanan</h4>
                                            <p className="text-xs text-gray-500">Income</p>
                                        </div>
                                        <span className="text-sm font-bold text-green-500">+Rp 8.500.000</span>
                                    </div>
                                </div>
                                <div className="absolute -right-6 top-1/2 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce">
                                    <div className="bg-green-100 p-2 rounded-full text-green-600">
                                        <span className="material-symbols-outlined">trending_up</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Hemat</p>
                                        <p className="font-bold text-gray-800">20% Bulan ini</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted By */}
            <section className="py-10 border-y border-border bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-8">Dipercaya oleh perusahaan inovatif</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 font-bold text-xl text-muted-foreground">
                            <span className="material-symbols-outlined text-3xl">token</span> TECHCO
                        </div>
                        <div className="flex items-center gap-2 font-bold text-xl text-muted-foreground">
                            <span className="material-symbols-outlined text-3xl">diamond</span> FinanceFlow
                        </div>
                        <div className="flex items-center gap-2 font-bold text-xl text-muted-foreground">
                            <span className="material-symbols-outlined text-3xl">rocket_launch</span> RocketBiz
                        </div>
                        <div className="flex items-center gap-2 font-bold text-xl text-muted-foreground">
                            <span className="material-symbols-outlined text-3xl">hub</span> ConnectSys
                        </div>
                        <div className="flex items-center gap-2 font-bold text-xl text-muted-foreground">
                            <span className="material-symbols-outlined text-3xl">bolt</span> PowerBill
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 lg:py-28 bg-white" id="features">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-primary font-semibold text-sm tracking-widest uppercase mb-3">Kenapa DuweKu?</h2>
                        <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Solusi Lengkap untuk Keuangan Anda</h3>
                        <p className="text-lg text-muted-foreground">Kami menyediakan alat terbaik untuk membantu Anda mengelola, memantau, dan mengembangkan aset keuangan Anda dengan mudah.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                <span className="material-symbols-outlined text-3xl">pie_chart</span>
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-4">Laporan Otomatis</h4>
                            <p className="text-muted-foreground mb-6">
                                Dapatkan wawasan mendalam tentang pengeluaran Anda dengan grafik visual yang dibuat secara otomatis setiap hari.
                            </p>
                            <a href="#" className="inline-flex items-center text-primary font-semibold hover:gap-2 transition-all">
                                Pelajari selengkapnya <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                            </a>
                        </div>
                        {/* Feature 2 */}
                        <div className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-6 group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
                                <span className="material-symbols-outlined text-3xl">groups</span>
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-4">Kelola Tim & Proyek</h4>
                            <p className="text-muted-foreground mb-6">
                                Kolaborasi dengan anggota keluarga atau tim bisnis dalam satu workspace yang terintegrasi dan transparan.
                            </p>
                            <a href="#" className="inline-flex items-center text-secondary font-semibold hover:gap-2 transition-all">
                                Pelajari selengkapnya <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                            </a>
                        </div>
                        {/* Feature 3 */}
                        <div className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                                <span className="material-symbols-outlined text-3xl">lock_person</span>
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-4">Keamanan Terjamin</h4>
                            <p className="text-muted-foreground mb-6">
                                Data keuangan Anda dienkripsi dengan standar keamanan tingkat bank. Privasi Anda adalah prioritas utama kami.
                            </p>
                            <a href="#" className="inline-flex items-center text-accent font-semibold hover:gap-2 transition-all">
                                Pelajari selengkapnya <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gray-900 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">Siap Mengatur Keuangan Anda?</h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">Bergabunglah dengan ribuan pengguna cerdas lainnya yang telah beralih ke DuweKu untuk masa depan finansial yang lebih baik.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/register" className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-glow">
                            Daftar Sekarang Gratis
                        </Link>
                        <button className="px-8 py-4 bg-transparent border border-gray-600 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all">
                            Hubungi Sales
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white pt-16 pb-8 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                                    D
                                </div>
                                <span className="text-xl font-bold tracking-tight text-gray-900">DuweKu</span>
                            </div>
                            <p className="text-muted-foreground mb-6 max-w-xs">
                                Platform manajemen keuangan terpercaya untuk individu dan bisnis kecil yang ingin tumbuh lebih cepat.
                            </p>
                            <div className="flex space-x-4">
                                <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">thumb_up</span></a>
                                <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">photo_camera</span></a>
                                <a href="#" className="text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">flutter_dash</span></a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Produk</h4>
                            <ul className="space-y-4 text-muted-foreground">
                                <li><a href="#" className="hover:text-primary transition-colors">Fitur</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Harga</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Integrasi</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Update</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Perusahaan</h4>
                            <ul className="space-y-4 text-muted-foreground">
                                <li><a href="#" className="hover:text-primary transition-colors">Tentang Kami</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Karir</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Kontak</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
                            <ul className="space-y-4 text-muted-foreground">
                                <li><a href="#" className="hover:text-primary transition-colors">Privasi</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Keamanan</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-400">© 2023 DuweKu Inc. All rights reserved.</p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Dibuat dengan</span>
                            <span className="material-symbols-outlined text-red-400 text-sm">favorite</span>
                            <span>di Jakarta</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
