'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';

interface ForcePasswordResetModalProps {
    open: boolean;
    onComplete: () => void;
}

export default function ForcePasswordResetModal({ open, onComplete }: ForcePasswordResetModalProps) { // NOSONAR
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 6) {
            setError("Şifreniz en az 6 karakter uzunluğunda olmalıdır.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Şifreler eşleşmiyor. Lütfen kontrol edin.");
            setLoading(false);
            return;
        }

        try {
            const supabase = createClient();

            // Update password and metadata
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
                data: {
                    is_first_login: false
                }
            });

            if (updateError) {
                throw updateError;
            }

            // Successfully updated
            onComplete();

        } catch (err: any) {
            setError(err.message || "Şifre güncellenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => {
            // Do nothing on open change to prevent closing by clicking outside or pressing ESC
        }}>
            <DialogContent
                className="sm:max-w-md"
                // Preventing interactions outside the modal, making it unclosable
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center">Şifre Belirleme Zounlu</DialogTitle>
                    <DialogDescription className="text-center">
                        Sisteme ilk defa giriş yaptığınız için hesabınızın güvenliği adına lütfen kendinize yeni bir şifre belirleyin.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* New Password Field */}
                    <div className="flex flex-col gap-2 group">
                        <Label className="text-[#0d121b] dark:text-slate-200 text-sm font-bold leading-normal ml-1">
                            Yeni Şifre
                        </Label>
                        <div className="relative">
                            <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#9aaac8] group-focus-within:text-[#135bec] transition-colors" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="En az 6 karakter"
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

                    {/* Confirm Password Field */}
                    <div className="flex flex-col gap-2 group mt-2">
                        <Label className="text-[#0d121b] dark:text-slate-200 text-sm font-bold leading-normal ml-1">
                            Yeni Şifre (Tekrar)
                        </Label>
                        <div className="relative">
                            <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#9aaac8] group-focus-within:text-[#135bec] transition-colors" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Şifrenizi doğrulayın"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="flex w-full rounded-xl border border-[#cfd7e7] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0d121b] dark:text-white h-12 pl-11 pr-12 placeholder:text-[#9aaac8] focus-visible:ring-2 focus-visible:ring-[#135bec]/20 focus-visible:border-[#135bec] transition-all text-base font-medium shadow-sm"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="mt-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-[#135bec] hover:bg-blue-700 text-[#f8f9fc] text-base font-bold leading-normal tracking-[0.015em] transition-all shadow-md shadow-blue-600/20 active:scale-[0.99]"
                    >
                        {loading ? 'Güncelleniyor...' : 'Şifreyi Kaydet ve Devam Et'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
