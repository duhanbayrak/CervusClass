'use client';

import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { registerStudent, RegistrationFormData, getNextStudentNumber } from '@/lib/actions/student-registration';
import { getClassById } from '@/lib/actions/class';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function Step4Summary() {
    const { formData, setStep, isSubmitting, setIsSubmitting } = useRegistration();
    const { toast } = useToast();
    const router = useRouter();
    const [nextStudentNumber, setNextStudentNumber] = useState<string | null>(null);
    const [fetchedClassName, setFetchedClassName] = useState<string | null>(null);

    useEffect(() => {
        async function fetchNextNumber() {
            const num = await getNextStudentNumber();
            if (num) {
                setNextStudentNumber(num);
            }
        }
        async function fetchClassInfo() {
            if (!formData.className && formData.classId) {
                const res = await getClassById(formData.classId);
                if (res.success && res.data) {
                    setFetchedClassName(res.data.name);
                }
            }
        }
        fetchNextNumber();
        fetchClassInfo();
    }, [formData.classId, formData.className]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const result = await registerStudent(formData as RegistrationFormData);

            if (result.success) {
                toast({
                    title: "Başarılı",
                    description: "Öğrenci kaydı başarıyla oluşturuldu.",
                });
                router.push('/admin/students');
            } else {
                toast({
                    variant: "destructive",
                    title: "Hata",
                    description: result.error || "Kayıt işlemi başarısız oldu.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Beklenmeyen Hata",
                description: "Bir hata oluştu, lütfen tekrar deneyin.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Finansal Hesaplamalar (Özet Gösterimi İçin Gerekli)
    const totalAmount = formData.totalAmount || 0;
    const discountAmountStr = formData.discountAmount || 0;
    const discountAmount = Number(discountAmountStr);
    const downPayment = formData.downPayment || 0;

    let netAmount = totalAmount;
    let discountStr = "Yok";

    if (discountAmount > 0) {
        if (formData.discountType === 'percentage') {
            netAmount = totalAmount - (totalAmount * (discountAmount / 100));
            discountStr = `%${discountAmount} (-${(totalAmount * (discountAmount / 100)).toLocaleString('tr-TR')} TL)`;
        } else {
            netAmount = totalAmount - discountAmount;
            discountStr = `${discountAmount.toLocaleString('tr-TR')} TL`;
        }
    }

    const remainingAmount = netAmount - downPayment;
    const installmentCount = formData.installmentCount || 1;
    const amountPerInstallment = remainingAmount > 0 ? (remainingAmount / installmentCount) : 0;

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Özet ve Onay</h2>
                <p className="text-muted-foreground">Lütfen kayıt bilgilerini kontrol edip işlemi onaylayın.</p>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Kişisel Bilgiler Özeti */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Kişisel & Akademik</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Ad Soyad:</span>
                                <span>{formData.firstName} {formData.lastName}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">TC Kimlik No:</span>
                                <span>{formData.tcNo || '-'}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Öğrenci No (Tahmini):</span>
                                <span className="text-xs mt-0.5 text-blue-600 bg-blue-50/50 px-1 py-0.5 rounded border border-blue-100 dark:border-blue-900 flex items-center w-fit">
                                    {nextStudentNumber ? nextStudentNumber : 'Hesaplanıyor...'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">E-posta:</span>
                                <span>{formData.email}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Telefon:</span>
                                <span>{formData.phone || '-'}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Veli Adı / Tel:</span>
                                <span>{formData.parentName || '-'} / {formData.parentPhone || '-'}</span>
                            </div>
                            <div className="h-px bg-border my-2" />
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Akademik Dönem:</span>
                                <span>{formData.academicPeriod}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Sınıf Seçimi:</span>
                                <span className="truncate" title={formData.classId}>
                                    {formData.className || fetchedClassName || formData.classId}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Finansal Özet */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Finansal Planlama</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Brüt Eğitim Ücreti:</span>
                                <span>{totalAmount.toLocaleString('tr-TR')} TL</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">İndirim ({formData.discountReason || '-'}):</span>
                                <span className="text-red-500">{discountStr}</span>
                            </div>
                            <div className="grid grid-cols-2 font-medium">
                                <span>Net Eğitim Ücreti:</span>
                                <span>{netAmount.toLocaleString('tr-TR')} TL</span>
                            </div>
                            <div className="h-px bg-border my-2" />
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Peşinat Alındı Mı?:</span>
                                <span>{downPayment > 0 ? `${downPayment.toLocaleString('tr-TR')} TL` : 'Hayır (0 TL)'}</span>
                            </div>
                            <div className="grid grid-cols-2 font-medium text-primary">
                                <span>Kalan (Taksitlendirilecek):</span>
                                <span>{remainingAmount.toLocaleString('tr-TR')} TL</span>
                            </div>
                            {remainingAmount > 0 && (
                                <div className="mt-3 p-3 bg-muted rounded-md border text-xs">
                                    <p>
                                        Geri kalan <strong>{remainingAmount.toLocaleString('tr-TR')} TL</strong> tutar,{' '}
                                        <strong>{installmentCount}</strong> eşit taksite bölünecektir. Her ayın <strong>{formData.paymentDueDay}.</strong> günü vade tarihi olarak ayarlanmıştır.
                                    </p>
                                    <p className="mt-1">
                                        {"=>"} Taksit Başına Düşen: <strong>{amountPerInstallment.toLocaleString('tr-TR')} TL</strong>
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-between pt-6 border-t">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep(3)}
                            disabled={isSubmitting}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Geri: Finansal Bilgiler
                        </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Kayıt Ediliyor...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Kaydı Tamamla
                                </>
                            )}
                        </Button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
