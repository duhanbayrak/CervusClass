'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getFinanceAccounts } from '@/lib/actions/finance-accounts';
import { getFinanceServices } from '@/lib/actions/finance-services';
import { FinanceAccount, FinanceService } from '@/types/accounting';
import { ArrowLeft, ArrowRight, Plus, Trash2, ReceiptText, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const serviceItemSchema = z.object({
    serviceId: z.string().min(1, 'Hizmet seçilmelidir'),
    serviceName: z.string().optional(),
    unitPrice: z.coerce.number().min(0),
    vatRate: z.coerce.number().min(0).default(0),
    discountAmount: z.coerce.number().min(0).default(0),
    discountType: z.enum(['percentage', 'fixed']).optional().default('fixed'),
    discountReason: z.string().optional(),
    downPayment: z.coerce.number().min(0).default(0),
    downPaymentAccountId: z.string().optional(),
    installmentCount: z.coerce.number().min(1, 'Taksit sayısı en az 1 olmalıdır').default(1),
    startMonth: z.string().optional(),
    paymentDueDay: z.coerce.number().min(1).max(31).default(5),
}).superRefine((data, ctx) => {
    const netAmount = data.discountType === 'percentage'
        ? data.unitPrice - (data.unitPrice * (data.discountAmount / 100))
        : data.unitPrice - data.discountAmount;

    const vatAmount = netAmount * (data.vatRate / 100);
    const totalWithVat = netAmount + vatAmount;

    if (data.downPayment > 0 && !data.downPaymentAccountId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hesap seçilmelidir", path: ["downPaymentAccountId"] });
    }
    if (data.downPayment > totalWithVat) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Peşinat KDV dahil net tutardan (₺" + totalWithVat.toFixed(2) + ") büyük olamaz", path: ["downPayment"] });
    }
});

const financialSchema = z.object({
    academicPeriod: z.string().default("2024-2025"),
    services: z.array(serviceItemSchema).min(1, "En az bir hizmet / ürün eklemelisiniz.")
});

type FinancialFormData = z.infer<typeof financialSchema>;

export function Step3Financial() {
    const { formData, updateFormData, setStep } = useRegistration();
    const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
    const [servicesData, setServicesData] = useState<FinanceService[]>([]);
    const [loading, setLoading] = useState(true);

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FinancialFormData>({
        resolver: zodResolver(financialSchema as any),
        defaultValues: {
            academicPeriod: formData.academicPeriod || '2024-2025',
            services: formData.services && formData.services.length > 0 ? formData.services : []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "services"
    });

    const watchServices = watch('services');

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const [accs, srvs] = await Promise.all([
                getFinanceAccounts(),
                getFinanceServices({ type: 'income', is_active: true })
            ]);
            setAccounts(accs);
            setServicesData(srvs || []);
            setLoading(false);
        }
        fetchData();
    }, []);

    // Yeni servis eklendiğinde boş defaultlar atılır
    const handleAddService = () => {
        append({
            serviceId: '',
            serviceName: '',
            unitPrice: 0,
            vatRate: 0,
            discountAmount: 0,
            discountType: 'fixed',
            discountReason: '',
            downPayment: 0,
            downPaymentAccountId: '',
            installmentCount: 1,
            startMonth: '',
            paymentDueDay: 5
        });
    };

    const handleServiceSelect = (index: number, serviceId: string) => {
        const selected = servicesData.find(s => s.id === serviceId);
        if (selected) {
            setValue(`services.${index}.serviceId`, selected.id, { shouldValidate: true });
            setValue(`services.${index}.serviceName`, selected.name);
            setValue(`services.${index}.unitPrice`, selected.unit_price);
            setValue(`services.${index}.vatRate`, selected.vat_rate);
        }
    };

    const onSubmit = (data: FinancialFormData) => {
        updateFormData(data);
        setStep(4);
    };

    // Fiyat Hesaplama Özeti (Toplam Sepet)
    const calculateTotals = () => {
        let totalVal = 0;
        let totalNet = 0;
        let totalVat = 0;
        let totalFinal = 0;
        let totalDownPayment = 0;

        watchServices.forEach(item => {
            const price = Number(item.unitPrice) || 0;
            const discount = Number(item.discountAmount) || 0;
            const isPercent = item.discountType === 'percentage';

            const netPrice = isPercent ? price - (price * (discount / 100)) : price - discount;
            const vat = netPrice * ((item.vatRate || 0) / 100);

            totalVal += price;
            totalNet += netPrice;
            totalVat += vat;
            totalFinal += (netPrice + vat);
            totalDownPayment += Number(item.downPayment) || 0;
        });

        return { totalVal, totalNet, totalVat, totalFinal, totalDownPayment, remaining: totalFinal - totalDownPayment };
    };

    const totals = calculateTotals();

    return (
        <div className="space-y-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Finansal Bilgiler</h2>
                    <p className="text-muted-foreground">Öğrenciye eklenecek eğitim, yemek, kırtasiye vb. hizmetleri seçin ve sepetinizi oluşturun.</p>
                </div>
                {watchServices.length > 0 && (
                    <div className="bg-primary/5 text-primary p-4 rounded-xl border border-primary/10 flex items-center shadow-sm w-full md:w-auto">
                        <Calculator className="w-8 h-8 mr-4 opacity-70" />
                        <div>
                            <p className="text-xs uppercase tracking-wider font-semibold opacity-70">Sepet Toplamı (KDV Dahil)</p>
                            <p className="text-2xl font-bold">₺{totals.totalFinal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                <AnimatePresence>
                    {fields.map((field, index) => {
                        const watchDownPayment = watch(`services.${index}.downPayment`);
                        const watchVatRate = watch(`services.${index}.vatRate`);
                        const watchUnitPrice = watch(`services.${index}.unitPrice`);
                        const watchDiscountType = watch(`services.${index}.discountType`);
                        const watchDiscountAmount = watch(`services.${index}.discountAmount`);

                        // Formülü Canlı Hesapla (Bireysel Kalem)
                        const p = Number(watchUnitPrice) || 0;
                        const d = Number(watchDiscountAmount) || 0;
                        const net = watchDiscountType === 'percentage' ? p - (p * (d / 100)) : p - d;
                        const vat = net * ((Number(watchVatRate) || 0) / 100);
                        const finalPrice = net + vat;

                        return (
                            <motion.div
                                key={field.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="border-l-4 border-l-primary/60 shadow-md">
                                    <CardHeader className="pb-3 flex flex-row items-center justify-between border-b bg-muted/20">
                                        <div>
                                            <CardTitle className="text-base flex items-center">
                                                <ReceiptText className="w-4 h-4 mr-2 text-primary" />
                                                Hizmet / Ürün Kalemi #{index + 1}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                Ara Toplam: ₺{finalPrice.toFixed(2)} (KDV Dahil)
                                            </CardDescription>
                                        </div>
                                        <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)} className="h-8 shadow-sm">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-6">

                                        {/* Row 1: Hizmet Seçimi ve Fiyat */}
                                        <div className="md:col-span-4 space-y-2">
                                            <Label>Hizmet Seçiniz <span className="text-red-500">*</span></Label>
                                            <Select
                                                disabled={loading}
                                                value={watch(`services.${index}.serviceId`)}
                                                onValueChange={(val) => handleServiceSelect(index, val)}
                                            >
                                                <SelectTrigger className={errors?.services?.[index]?.serviceId ? "border-red-500" : ""}>
                                                    <SelectValue placeholder={loading ? "Yükleniyor..." : "Hizmet/Ürün Seçin"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {servicesData.map(srv => (
                                                        <SelectItem key={srv.id} value={srv.id}>
                                                            {srv.name} (₺{srv.unit_price} + %{srv.vat_rate} KDV)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors?.services?.[index]?.serviceId && <p className="text-xs text-red-500">{errors.services[index]?.serviceId?.message}</p>}
                                        </div>

                                        <div className="md:col-span-3 space-y-2">
                                            <Label>KDV Hariç Fiyat (TL)</Label>
                                            <Input type="number" step="0.01" {...register(`services.${index}.unitPrice`)} />
                                            {errors?.services?.[index]?.unitPrice && <p className="text-xs text-red-500">{errors.services[index]?.unitPrice?.message}</p>}
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <Label>KDV Oranı (%)</Label>
                                            <Input type="number" step="0.1" {...register(`services.${index}.vatRate`)} />
                                        </div>

                                        {/* Boşluk */}
                                        <div className="md:col-span-3 hidden md:block"></div>

                                        {/* Row 2: İndirim */}
                                        <div className="md:col-span-3 space-y-2">
                                            <Label>İndirim Tipi</Label>
                                            <Select value={watch(`services.${index}.discountType`)} onValueChange={(val: any) => setValue(`services.${index}.discountType`, val)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="fixed">Sabit Tutar (TL)</SelectItem>
                                                    <SelectItem value="percentage">Yüzde (%)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="md:col-span-3 space-y-2">
                                            <Label>İndirim Miktarı</Label>
                                            <Input type="number" step="0.01" {...register(`services.${index}.discountAmount`)} />
                                        </div>
                                        <div className="md:col-span-6 space-y-2">
                                            <Label>İndirim Açıklaması (Opsiyonel)</Label>
                                            <Input {...register(`services.${index}.discountReason`)} placeholder="Kardeş İndirimi vb." />
                                        </div>

                                        <div className="md:col-span-12 border-t pt-4 mt-2">
                                            <h4 className="text-sm font-semibold mb-3">Taksitlendirme ve Peşinat Modeli</h4>
                                        </div>

                                        {/* Row 3: Peşinat ve Taksit */}
                                        <div className="md:col-span-4 space-y-2">
                                            <Label>Alınan Peşinat Tutarı (TL)</Label>
                                            <Input type="number" step="0.01" {...register(`services.${index}.downPayment`)} placeholder="Yoksa 0 bırakın" />
                                            {errors?.services?.[index]?.downPayment && <p className="text-xs text-red-500">{errors.services[index]?.downPayment?.message}</p>}
                                        </div>

                                        {watchDownPayment > 0 ? (
                                            <div className="md:col-span-4 space-y-2">
                                                <Label>Peşinatın Gireceği Kasa/Banka <span className="text-red-500">*</span></Label>
                                                <Select
                                                    disabled={loading}
                                                    value={watch(`services.${index}.downPaymentAccountId`)}
                                                    onValueChange={(val) => setValue(`services.${index}.downPaymentAccountId`, val, { shouldValidate: true })}
                                                >
                                                    <SelectTrigger className={errors?.services?.[index]?.downPaymentAccountId ? "border-red-500" : ""}>
                                                        <SelectValue placeholder="Seçiniz..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {accounts.map(acc => (
                                                            <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.balance.toLocaleString('tr-TR')} {acc.currency})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors?.services?.[index]?.downPaymentAccountId && <p className="text-xs text-red-500">{errors.services[index]?.downPaymentAccountId?.message}</p>}
                                            </div>
                                        ) : (
                                            <div className="md:col-span-4"></div>
                                        )}

                                        <div className="md:col-span-4 space-y-2">
                                            <Label>Kalan Tutarı Kaç Taksite Bölelim?</Label>
                                            <Input type="number" min={1} {...register(`services.${index}.installmentCount`)} />
                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                Kalan: ₺{(finalPrice - (Number(watchDownPayment) || 0)).toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="md:col-span-4 space-y-2">
                                            <Label>Taksitler Hangi Ay Başlasın?</Label>
                                            <Input type="month" {...register(`services.${index}.startMonth`)} />
                                            <p className="text-[11px] text-muted-foreground mt-1">Örn: Ekim 2026 (Boşsa hemen başlar)</p>
                                        </div>

                                        <div className="md:col-span-4 space-y-2">
                                            <Label>Taksit Son Ödeme Günü (1-31)</Label>
                                            <Input type="number" min={1} max={31} {...register(`services.${index}.paymentDueDay`)} />
                                            <p className="text-[11px] text-muted-foreground mt-1">Her ayın kaçıncı günü?</p>
                                        </div>

                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {errors.services?.root && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                        {errors.services.root.message}
                    </div>
                )}

                <div className="flex justify-center border-t border-dashed py-8">
                    <Button type="button" variant="outline" onClick={handleAddService} className="rounded-full shadow-sm hover:border-primary/50 hover:bg-primary/5 px-6">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Hizmet / Ürün Ekle
                    </Button>
                </div>

                <div className="flex justify-between pt-4 pb-12">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                        <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Geri Dön
                        </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                        <Button type="submit" size="lg" className="px-8 shadow-md">
                            İleri: Onay ve Özet
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                </div>
            </form>
        </div>
    );
}
