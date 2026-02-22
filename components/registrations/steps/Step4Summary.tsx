'use client';

import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { registerStudent, RegistrationFormData, getNextStudentNumber } from '@/lib/actions/student-registration';
import { getClassById } from '@/lib/actions/class';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, ArrowLeft, CheckCircle, ReceiptText } from 'lucide-react';
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

    // --- Sepet / Hizmet Hesaplamaları ---
    let finalGrossTotal = 0; // İndirimsiz + KDV'siz (Birim Fiyatların Toplamı)
    let finalDiscountTotal = 0; // Toplam İndirim (TL)
    let finalNetTotal = 0; // İndirimli + KDV'siz 
    let finalVatTotal = 0; // Toplam KDV
    let finalGrandTotal = 0; // KDV Dahil Genel Toplam
    let finalDownPayment = 0; // Toplam Peşinat

    const services = formData.services || [];

    services.forEach(item => {
        const p = Number(item.unitPrice) || 0;
        const d = Number(item.discountAmount) || 0;
        const isPercent = item.discountType === 'percentage';

        const net = isPercent ? p - (p * (d / 100)) : p - d;
        const discountVal = p - net;
        const vat = net * ((Number(item.vatRate) || 0) / 100);

        finalGrossTotal += p;
        finalDiscountTotal += discountVal;
        finalNetTotal += net;
        finalVatTotal += vat;
        finalGrandTotal += (net + vat);
        finalDownPayment += Number(item.downPayment) || 0;
    });

    const finalRemaining = finalGrandTotal - finalDownPayment;

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Özet ve Onay</h2>
                <p className="text-muted-foreground">Lütfen kayıt bilgilerini ve sepet özetini kontrol edip işlemi onaylayın.</p>
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
                            <div className="h-px bg-border my-2" />
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Veli Ad Soyad:</span>
                                <span>{formData.parentFirstName || '-'} {formData.parentLastName || '-'}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Veli TC / Tel:</span>
                                <span>{formData.parentTcNo || '-'} / {formData.parentPhone || '-'}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Veli E-posta:</span>
                                <span className="truncate">{formData.parentEmail || '-'}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Yakınlık Türü:</span>
                                <span>{formData.parentRelationship || '-'}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Adres:</span>
                                <span className="truncate" title={formData.parentAddress}>{formData.parentAddress || '-'}</span>
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

                    {/* Finansal Genel Özet */}
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg text-primary">Sepet Toplamı</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="grid grid-cols-2">
                                <span className="font-medium text-muted-foreground">Hizmet Toplamı (Brüt):</span>
                                <span>{finalGrossTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                            {finalDiscountTotal > 0 && (
                                <div className="grid grid-cols-2">
                                    <span className="font-medium text-muted-foreground">Toplam İndirim:</span>
                                    <span className="text-red-500">-{finalDiscountTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </div>
                            )}
                            <div className="grid grid-cols-2 text-muted-foreground">
                                <span>Net Tutar (KDV Hariç):</span>
                                <span>{finalNetTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                            <div className="grid grid-cols-2 text-muted-foreground">
                                <span>Toplam KDV:</span>
                                <span>{finalVatTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                            <div className="h-px bg-primary/20 my-2" />
                            <div className="grid grid-cols-2 text-base font-bold text-primary">
                                <span>Genel Toplam:</span>
                                <span>{finalGrandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                            {finalDownPayment > 0 && (
                                <div className="grid grid-cols-2">
                                    <span className="font-medium text-green-600">Alınan Peşinatlar:</span>
                                    <span className="text-green-600">-{finalDownPayment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                                </div>
                            )}
                            <div className="grid grid-cols-2 font-bold mt-2">
                                <span>Kalan (Taksitlendirilecek):</span>
                                <span>{finalRemaining.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Hizmet Kalemleri Detayı */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                            <ReceiptText className="w-5 h-5 mr-2" />
                            Seçilen Hizmet ve Ödeme Planları
                        </CardTitle>
                        <CardDescription>
                            Her bir hizmet/ürün kalemi için hesaplanan taksitler aşağıdadır.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {services.length === 0 ? (
                                <p className="text-sm text-red-500 italic">Sepete hizmet eklenmemiş.</p>
                            ) : (
                                services.map((svc, i) => {
                                    const p = Number(svc.unitPrice) || 0;
                                    const d = Number(svc.discountAmount) || 0;
                                    const isPercent = svc.discountType === 'percentage';
                                    const net = isPercent ? p - (p * (d / 100)) : p - d;
                                    const vat = net * ((Number(svc.vatRate) || 0) / 100);
                                    const totalWithVat = net + vat;
                                    const rem = totalWithVat - (Number(svc.downPayment) || 0);
                                    const inst = Number(svc.installmentCount) || 1;
                                    const perInst = rem > 0 ? rem / inst : 0;

                                    return (
                                        <div key={i} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                            <div className="flex-1 space-y-1">
                                                <h4 className="font-semibold text-primary">{svc.serviceName || 'İsimsiz Hizmet'}</h4>
                                                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                                                    <span>Birim Fiyat: ₺{p.toFixed(2)}</span>
                                                    <span>KDV: %{svc.vatRate || 0}</span>
                                                    {(d > 0) && (
                                                        <span className="text-red-500">
                                                            İndirim: {isPercent ? `%${d}` : `₺${d}`}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium mt-1">KDV Dahil Net Tutar: ₺{totalWithVat.toFixed(2)}</p>
                                            </div>
                                            <div className="md:w-px md:bg-border my-2 md:my-0"></div>
                                            <div className="flex-1 space-y-1 text-sm">
                                                <p><span className="text-muted-foreground">Peşinat:</span> <span className="font-semibold text-green-600">₺{(Number(svc.downPayment) || 0).toFixed(2)}</span></p>
                                                <p><span className="text-muted-foreground">Kalan:</span> ₺{rem.toFixed(2)}</p>
                                                {rem > 0 && (
                                                    <p className="text-xs mt-1 bg-muted p-2 rounded">
                                                        <strong>{inst} Taksit</strong> x ₺{perInst.toFixed(2)} / ay <br />
                                                        <span className="text-[10px] text-muted-foreground">Başlangıç: {svc.startMonth || 'Hemen'} (Her ayın {svc.paymentDueDay}. günü)</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-between pt-6 border-t pb-12">
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
                            disabled={isSubmitting || services.length === 0}
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[200px]"
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
