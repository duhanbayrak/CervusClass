'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Image from "next/image";
import { Badge, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
    role: 'student' | 'teacher' | 'admin' | 'super_admin';
}

export default function AuthForm({ role }: AuthFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    // const supabase = createClientComponentClient(); -> REMOVED

    // Role-specific configuration
    const config = {
        student: {
            title: 'Öğrenci Portalı',
            subtitle: 'Derslerinize ve notlarınıza erişin.',
            switchText: 'Öğretmen misiniz?',
            switchLink: '/teacher/login',
            primaryColor: 'bg-blue-600 hover:bg-blue-700', // Example colors
        },
        teacher: {
            title: 'Öğretmen Portalı',
            subtitle: 'Sınıflarınızı ve öğrencilerinizi yönetin.',
            switchText: 'Öğrenci misiniz?',
            switchLink: '/student/login',
            primaryColor: 'bg-indigo-600 hover:bg-indigo-700',
        },
        admin: {
            title: 'Yönetici Paneli',
            subtitle: 'Kurum yönetim paneli.',
            switchText: 'Ana sayfaya dön',
            switchLink: '/',
            primaryColor: 'bg-slate-800 hover:bg-slate-900',
        },
        super_admin: {
            title: 'Süper Admin',
            subtitle: 'Platform yönetimi ve gözetimi.',
            switchText: 'Ana sayfaya dön',
            switchLink: '/',
            primaryColor: 'bg-red-600 hover:bg-red-700',
        },
    };

    const currentConfig = config[role];

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            router.refresh();
            // Redirect will be handled by middleware or useEffect based on session
            // For now, we manually route to the expected dashboard (middleware will secure it)
            router.push(`/${role}/dashboard`);

        } catch (err: any) {
            setError(err.message); // Hata mesajlarını da Türkçeleştirmek gerekebilir ama şimdilik Supabase'den geleni bırakalım veya genel hata verelim
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full font-sans text-slate-900 bg-[#f6f6f8] dark:bg-[#101622] dark:text-white overflow-x-hidden">
            {/* Left Side: Visual / Hero Section */}
            <div className="hidden lg:flex w-1/2 relative flex-col justify-between bg-cover bg-center overflow-hidden"
                style={{ backgroundImage: 'url("/login-bg.jpg")' }}>

                {/* Blue Tint Overlay */}
                <div className="absolute inset-0 bg-[#135bec]/90 mix-blend-multiply"></div>
                {/* Gradient Overlay for Depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70"></div>

                {/* Content overlay on image */}
                <div className="relative z-10 flex flex-col h-full justify-between p-16 text-white">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm p-1">
                            <Image src="/deer-logo.svg" alt="Cervus Class" width={32} height={32} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">CervusClass</span>
                    </div>

                    {/* Hero Text */}
                    <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-6 tracking-tight">
                            Eğitim Yönetiminde Mükemmellik.
                        </h2>
                        <p className="text-lg text-white/90 font-medium leading-relaxed max-w-md">
                            İdari görevlerinizi basitleştirin, müfredatı yönetin ve öğrenci performansını tek bir güvenli yerden takip edin.
                        </p>
                    </div>

                    {/* Left Footer */}
                    <div className="flex justify-between items-end text-sm text-white/70 font-medium">
                        <div>© 2024 Cervus Labs Inc.</div>
                        <div className="flex gap-4">
                            <span>v1.0.0</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12 lg:px-20 xl:px-32 relative">
                {/* Mobile Branding */}
                <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2 text-[#135bec]">
                    <Image src="/deer-logo.svg" alt="Cervus Class" width={32} height={32} className="w-8 h-8 object-contain" />
                    <span className="text-xl font-bold tracking-tight text-[#0d121b] dark:text-white">CervusClass</span>
                </div>

                <div className="w-full max-w-[440px] flex flex-col gap-8">
                    {/* Form Header */}
                    <div className="flex flex-col gap-2 mb-2">
                        <h1 className="text-3xl lg:text-4xl font-black text-[#0d121b] dark:text-white tracking-[-0.02em]">
                            {currentConfig.title}
                        </h1>
                        <h2 className="text-[#4c669a] dark:text-slate-400 text-base font-normal leading-relaxed">
                            {currentConfig.subtitle}
                        </h2>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Main Login Form */}
                    <form onSubmit={handleSignIn} className="flex flex-col gap-5">
                        {/* Email Field */}
                        <div className="flex flex-col gap-2 group">
                            <Label className="text-[#0d121b] dark:text-slate-200 text-sm font-bold leading-normal ml-1">
                                E-posta Adresi
                            </Label>
                            <div className="relative">
                                <Badge className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#9aaac8] group-focus-within:text-[#135bec] transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="isim@okul.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="flex w-full rounded-xl border border-[#cfd7e7] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121b] dark:text-white h-12 pl-11 pr-4 placeholder:text-[#9aaac8] focus-visible:ring-2 focus-visible:ring-[#135bec]/20 focus-visible:border-[#135bec] transition-all text-base font-medium shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col gap-2 group">
                            <div className="flex justify-between items-center ml-1">
                                <Label className="text-[#0d121b] dark:text-slate-200 text-sm font-bold leading-normal">
                                    Şifre
                                </Label>
                            </div>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#9aaac8] group-focus-within:text-[#135bec] transition-colors" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Şifrenizi girin"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="flex w-full rounded-xl border border-[#cfd7e7] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121b] dark:text-white h-12 pl-11 pr-12 placeholder:text-[#9aaac8] focus-visible:ring-2 focus-visible:ring-[#135bec]/20 focus-visible:border-[#135bec] transition-all text-base font-medium shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-0 h-full px-4 text-[#9aaac8] hover:text-[#4c669a] dark:hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer rounded-r-xl focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <a href="#" className="text-[#135bec] text-sm font-semibold hover:text-blue-700 hover:underline transition-colors">
                                Şifremi Unuttum?
                            </a>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-[#135bec] hover:bg-blue-700 text-[#f8f9fc] text-base font-bold leading-normal tracking-[0.015em] transition-all shadow-md shadow-blue-600/20 active:scale-[0.99]"
                        >
                            {loading ? 'Giriş yapılıyor...' : 'Güvenli Giriş Yap'}
                        </Button>
                    </form>

                    {/* Portal Switcher */}
                    <div className="flex flex-col gap-8 items-center mt-2">
                        <div className="p-4 bg-[#135bec]/5 rounded-lg border border-[#135bec]/10 w-full text-center">
                            <p className="text-sm text-[#4c669a] dark:text-slate-400">
                                {currentConfig.switchText}
                                <br className="sm:hidden" />
                                <a
                                    href={currentConfig.switchLink}
                                    className="text-[#135bec] font-bold hover:underline inline-flex items-center gap-1 mt-1 sm:mt-0 ml-1"
                                >
                                    {role === 'student' ? 'Öğretmen Portalı' : role === 'teacher' ? 'Öğrenci Portalı' : 'Ana Sayfa'}
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </p>
                        </div>

                        <div className="flex gap-6 text-xs text-[#9aaac8] font-medium">
                            <a href="#" className="hover:text-[#135bec] transition-colors">Gizlilik Politikası</a>
                            <span>•</span>
                            <a href="#" className="hover:text-[#135bec] transition-colors">Kullanım Şartları</a>
                            <span>•</span>
                            <a href="#" className="hover:text-[#135bec] transition-colors">Destek</a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
