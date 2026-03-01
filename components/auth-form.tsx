'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import Image from "next/image";
import { Lock, ArrowRight, Eye, EyeOff, Mail, KeyRound, AlertCircle } from 'lucide-react';
import ForcePasswordResetModal from './force-password-reset-modal';

interface AuthFormProps {
    role: 'student' | 'teacher' | 'admin' | 'super_admin';
}

export default function AuthForm({ role }: AuthFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [view, setView] = useState<'password' | 'otp_email' | 'otp_verify'>('password');
    const [otp, setOtp] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const router = useRouter();

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
            router.push(`/${role}/dashboard`);

        } catch (err: any) {
            setError(err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false,
                }
            });

            if (error) {
                throw error;
            }

            setView('otp_verify');
        } catch (err: any) {
            setError(err.message || 'Doğrulama kodu gönderilirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'email',
            });

            if (error) {
                throw error;
            }

            if (data.user) {
                // Şimdilik OTP ile gelen herkesin şifre yenilemesini isteyelim daha güvenli.
                setShowPasswordModal(true);
            } else {
                throw new Error("Kullanıcı bilgisi alınamadı.");
            }

        } catch (err: any) {
            setError(err.message || 'Kod doğrulanamadı. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordResetComplete = () => {
        setShowPasswordModal(false);
        router.refresh();
        router.push(`/${role}/dashboard`);
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
                            {view === 'password' && currentConfig.subtitle}
                            {view === 'otp_email' && 'Şifrenizi unuttuysanız e-posta adresinize kod gönderelim.'}
                            {view === 'otp_verify' && 'E-posta adresinize gönderilen 6 haneli doğrulama kodunu girin.'}
                        </h2>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {view === 'password' && (
                        <form onSubmit={handleSignIn} className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Email Field */}
                            <div className="flex flex-col gap-2 group">
                                <Label className="text-[#0d121b] dark:text-slate-200 text-sm font-bold leading-normal ml-1">
                                    E-posta Adresi
                                </Label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#9aaac8] group-focus-within:text-[#135bec] transition-colors" />
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

                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-[#135bec] hover:bg-blue-700 text-[#f8f9fc] text-base font-bold leading-normal tracking-[0.015em] transition-all shadow-md shadow-blue-600/20 active:scale-[0.99]"
                            >
                                {loading ? 'Giriş yapılıyor...' : 'Güvenli Giriş Yap'}
                            </Button>

                            <div className="flex flex-col items-center mt-2">
                                <div className="w-full h-px bg-[#cfd7e7] dark:bg-slate-700 mb-6 relative">
                                    <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-[#f6f6f8] dark:bg-[#101622] px-3 text-xs text-[#9aaac8] font-medium">veya</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setError(null);
                                        setView('otp_email');
                                    }}
                                    className="w-full bg-[#135bec]/10 hover:bg-[#135bec]/20 text-[#135bec] dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 font-bold py-3 rounded-xl transition-all border border-[#135bec]/20"
                                >
                                    Şifremi Unuttum (Kod ile Giriş)
                                </button>
                            </div>
                        </form>
                    )}

                    {view === 'otp_email' && (
                        <form onSubmit={handleSendOtp} className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex flex-col gap-2 group">
                                <Label className="text-[#0d121b] dark:text-slate-200 text-sm font-bold leading-normal ml-1">
                                    E-posta Adresi
                                </Label>
                                <div className="relative">
                                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#9aaac8] group-focus-within:text-[#135bec] transition-colors" />
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

                            <Button
                                type="submit"
                                disabled={loading || !email}
                                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-[#135bec] hover:bg-blue-700 text-[#f8f9fc] text-base font-bold leading-normal tracking-[0.015em] transition-all shadow-md shadow-blue-600/20 active:scale-[0.99]"
                            >
                                {loading ? 'Kod Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                            </Button>

                            <div className="flex justify-center mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError(null);
                                        setView('password');
                                    }}
                                    className="text-sm text-[#4c669a] hover:text-[#135bec] transition-colors font-medium flex items-center justify-center gap-1"
                                >
                                    Geri dön ve şifre ile giriş yap
                                </button>
                            </div>
                        </form>
                    )}

                    {view === 'otp_verify' && (
                        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex flex-col gap-2 group">
                                <Label className="text-[#0d121b] dark:text-slate-200 text-sm font-bold leading-normal ml-1">
                                    Doğrulama Kodu
                                </Label>
                                <div className="relative">
                                    <KeyRound className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#9aaac8] group-focus-within:text-[#135bec] transition-colors" />
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="00000000"
                                        maxLength={8}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replaceAll(/\D/g, ''))}
                                        required
                                        className="flex w-full rounded-xl border border-[#cfd7e7] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121b] dark:text-white h-12 pl-11 pr-4 placeholder:text-[#9aaac8] focus-visible:ring-2 focus-visible:ring-[#135bec]/20 focus-visible:border-[#135bec] transition-all text-base font-medium shadow-sm text-center tracking-[0.5em]"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || otp.length !== 8}
                                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-[#135bec] hover:bg-blue-700 text-[#f8f9fc] text-base font-bold leading-normal tracking-[0.015em] transition-all shadow-md shadow-blue-600/20 active:scale-[0.99]"
                            >
                                {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
                            </Button>

                            <div className="flex justify-center mt-2 flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={() => setView('otp_email')}
                                    className="text-sm text-[#4c669a] hover:text-[#135bec] transition-colors font-medium text-center"
                                >
                                    Farklı bir e-posta adresi kullan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setView('password')}
                                    className="text-sm text-[#4c669a] hover:text-[#135bec] transition-colors font-medium text-center"
                                >
                                    Şifre ile giriş yap
                                </button>
                            </div>
                        </form>
                    )}

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
                                    {(() => {
                                        if (role === 'student') return 'Öğretmen Portalı';
                                        if (role === 'teacher') return 'Öğrenci Portalı';
                                        return 'Ana Sayfa';
                                    })()}
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </p>
                        </div>

                        <div className="flex gap-6 text-xs text-[#9aaac8] font-medium">
                            <button type="button" className="hover:text-[#135bec] transition-colors">Gizlilik Politikası</button>
                            <span>•</span>
                            <button type="button" className="hover:text-[#135bec] transition-colors">Kullanım Şartları</button>
                            <span>•</span>
                            <button type="button" className="hover:text-[#135bec] transition-colors">Destek</button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Password Reset Modal */}
            <ForcePasswordResetModal
                open={showPasswordModal}
                onComplete={handlePasswordResetComplete}
            />
        </div>
    );
}
