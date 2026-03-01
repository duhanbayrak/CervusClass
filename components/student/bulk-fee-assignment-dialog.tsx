'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getFinanceAccounts } from '@/lib/actions/finance-accounts';
import { getFinanceServices } from '@/lib/actions/finance-services';
import { FinanceAccount, FinanceService } from '@/types/accounting';
import { Plus, Trash2, ReceiptText, Calculator, Loader2, CheckCircle2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { assignBulkServicesToStudents } from '@/lib/actions/student-fees';

export const serviceItemSchema = z.object({
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
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Kasa/Hesap seçilmelidir", path: ["downPaymentAccountId"] });
    }
    if (data.downPayment > totalWithVat) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Peşinat KDV dahil net tutardan (₺${totalWithVat.toFixed(2)}) büyük olamaz`, path: ["downPayment"] });
    }
});

const bulkFinancialSchema = z.object({
    services: z.array(serviceItemSchema).min(1, "En az bir hizmet / ürün eklemelisiniz.")
});

type BulkFinancialFormData = z.infer<typeof bulkFinancialSchema>;

interface BulkFeeAssignmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedStudentIds: string[];
    onSuccess: () => void;
}

export function BulkFeeAssignmentDialog({ open, onOpenChange, selectedStudentIds, onSuccess }: Readonly<BulkFeeAssignmentDialogProps>) { // NOSONAR
    const { toast } = useToast();
    const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
    const [servicesData, setServicesData] = useState<FinanceService[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<BulkFinancialFormData>({
        resolver: zodResolver(bulkFinancialSchema as any),
        defaultValues: {
            services: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "services"
    });

    const watchServices = watch('services') || [];

    useEffect(() => {
        if (!open) return;

        async function fetchData() {
            setIsLoading(true);
            const [accs, srvs] = await Promise.all([
                getFinanceAccounts(),
                getFinanceServices({ type: 'income', is_active: true })
            ]);
            setAccounts(accs);
            setServicesData(srvs || []);

            // Eğer form boşsa ilk açılışta boş bir satır ekleyelim
            if (fields.length === 0) {
                setTimeout(() => handleAddService(), 100);
            }

            setIsLoading(false);
        }
        fetchData();
    }, [open]);

    // Dialog kapanınca formu sıfırla
    useEffect(() => {
        if (!open) {
            reset({ services: [] });
            setIsSubmitting(false);
        }
    }, [open, reset]);

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

    const calculateTotals = () => {
        let totalFinal = 0;
        let totalDownPayment = 0;

        watchServices.forEach(item => {
            const price = Number(item.unitPrice) || 0;
            const discount = Number(item.discountAmount) || 0;
            const isPercent = item.discountType === 'percentage';

            const netPrice = isPercent ? price - (price * (discount / 100)) : price - discount;
            const vat = netPrice * ((item.vatRate || 0) / 100);

            totalFinal += (netPrice + vat);
            totalDownPayment += Number(item.downPayment) || 0;
        });

        return { totalFinal, totalDownPayment };
    };

    const totals = calculateTotals();

    const onSubmit = async (data: BulkFinancialFormData) => {
        if (selectedStudentIds.length === 0) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Atama yapılacak öğrenci seçilmedi.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await assignBulkServicesToStudents(selectedStudentIds, data.services);

            if (!result.success) {
                throw new Error(result.error || 'İşlem sırasında bir hata oluştu');
            }

            toast({
                title: 'Başarılı',
                description: `${selectedStudentIds.length} öğrenciye başarıyla hizmet sepeti bağlandı.`,
                className: 'bg-green-500 text-white border-none'
            });

            onSuccess();
            onOpenChange(false);

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'İşlem Başarısız',
                description: error.message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-indigo-500" />
                        Toplu Hizmet / Paket Atama
                    </DialogTitle>
                    <DialogDescription>
                        Seçilen <strong className="text-foreground">{selectedStudentIds.length}</strong> öğrenciye aynı anda eklenecek paket ve ödeme planlarını oluşturun.
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto p-6 flex-1 space-y-6 bg-slate-50/30 dark:bg-slate-900/20">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p>Finansal veriler yükleniyor...</p>
                        </div>
                    ) : (
                        <form id="bulk-fee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                            {/* Hizmet Sepeti Özeti */}
                            {watchServices.length > 0 && (
                                <div className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm w-full gap-4">
                                    <div className="flex items-center">
                                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg mr-4">
                                            <Calculator className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wider font-semibold opacity-70">Sepet Toplamı (Kişi Başı)</p>
                                            <p className="text-2xl font-bold">₺{totals.totalFinal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm opacity-80 max-w-xs text-right">
                                        Bu sepet tutarı seçili tüm öğrencilere ayrı ayrı faturalandırılıp taksitlendirilecektir.
                                    </div>
                                </div>
                            )}

                            {/* Servis Blokları */}
                            <AnimatePresence>
                                {fields.map((field, index) => {
                                    const watchDownPayment = watch(`services.${index}.downPayment`);
                                    const watchVatRate = watch(`services.${index}.vatRate`);
                                    const watchUnitPrice = watch(`services.${index}.unitPrice`);
                                    const watchDiscountType = watch(`services.${index}.discountType`);
                                    const watchDiscountAmount = watch(`services.${index}.discountAmount`);

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
                                            <Card className="border-l-4 border-l-indigo-500 shadow-sm overflow-hidden">
                                                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-slate-50/50 dark:bg-slate-800/50">
                                                    <div>
                                                        <CardTitle className="text-base flex items-center font-medium">
                                                            <ReceiptText className="w-4 h-4 mr-2 text-indigo-500" />
                                                            Hizmet #{index + 1}
                                                        </CardTitle>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => remove(index)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 px-2"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" /> Kaldır
                                                    </Button>
                                                </CardHeader>
                                                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-5">
                                                    {/* Row 1 */}
                                                    <div className="md:col-span-5 space-y-2">
                                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hizmet / Ürün</Label>
                                                        <Select
                                                            value={watch(`services.${index}.serviceId`)}
                                                            onValueChange={(val) => handleServiceSelect(index, val)}
                                                        >
                                                            <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-indigo-500">
                                                                <SelectValue placeholder="Katalogdan Seçiniz" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {servicesData.map(s => (
                                                                    <SelectItem key={s.id} value={s.id}>
                                                                        {s.name} (₺{s.unit_price})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {errors.services?.[index]?.serviceId && <p className="text-xs text-red-500">{errors.services[index].serviceId?.message}</p>}
                                                    </div>

                                                    <div className="md:col-span-3 space-y-2">
                                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Liste Fiyatı</Label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₺</span>
                                                            <Input type="number" step="0.01" className="pl-7 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800" {...register(`services.${index}.unitPrice` as const)} readOnly />
                                                        </div>
                                                    </div>

                                                    <div className="md:col-span-2 space-y-2">
                                                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">KDV Oranı</Label>
                                                        <div className="relative">
                                                            <Input type="number" className="pr-7 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800" {...register(`services.${index}.vatRate` as const)} readOnly />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                                        </div>
                                                    </div>

                                                    <div className="md:col-span-2 space-y-2 flex flex-col justify-end pb-2">
                                                        <div className="text-right">
                                                            <p className="text-xs text-muted-foreground mb-1">KDV D. Tutar</p>
                                                            <p className="text-sm font-semibold">₺{finalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                        </div>
                                                    </div>

                                                    {/* Row 2: İndirim */}
                                                    <div className="md:col-span-12 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 grid grid-cols-1 md:grid-cols-12 gap-4">
                                                        <div className="md:col-span-3 space-y-2">
                                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">İndirim Türü</Label>
                                                            <Select
                                                                value={watch(`services.${index}.discountType`) || 'fixed'}
                                                                onValueChange={(val: any) => setValue(`services.${index}.discountType`, val)}
                                                            >
                                                                <SelectTrigger className="bg-white dark:bg-slate-900">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="fixed">Tutar (₺)</SelectItem>
                                                                    <SelectItem value="percentage">Yüzde (%)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="md:col-span-3 space-y-2">
                                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">İndirim Miktarı</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                className="bg-white dark:bg-slate-900"
                                                                {...register(`services.${index}.discountAmount` as const)}
                                                            />
                                                        </div>
                                                        <div className="md:col-span-6 space-y-2">
                                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">İndirim Sebebi / Notu</Label>
                                                            <Input
                                                                placeholder="Örn: Kardeş İndirimi"
                                                                className="bg-white dark:bg-slate-900"
                                                                {...register(`services.${index}.discountReason` as const)}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Row 3: Taksit ve Peşinat */}
                                                    <div className="md:col-span-12 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 grid grid-cols-1 md:grid-cols-12 gap-4">
                                                        <div className="md:col-span-3 space-y-2">
                                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Peşinat Tutarı</Label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₺</span>
                                                                <Input type="number" step="0.01" className="pl-7 bg-white dark:bg-slate-900 focus:ring-indigo-500" {...register(`services.${index}.downPayment` as const)} />
                                                            </div>
                                                            {errors.services?.[index]?.downPayment && <p className="text-xs text-red-500">{errors.services[index].downPayment?.message}</p>}
                                                        </div>

                                                        {watchDownPayment > 0 && (
                                                            <div className="md:col-span-4 space-y-2">
                                                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Peşinat Kasası</Label>
                                                                <Select
                                                                    value={watch(`services.${index}.downPaymentAccountId`) || ''}
                                                                    onValueChange={(val) => setValue(`services.${index}.downPaymentAccountId`, val, { shouldValidate: true })}
                                                                >
                                                                    <SelectTrigger className="bg-white dark:bg-slate-900 border-green-200 dark:border-green-900 focus:ring-green-500">
                                                                        <SelectValue placeholder="Tahsilat Hesabı" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {accounts.map(acc => (
                                                                            <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                {errors.services?.[index]?.downPaymentAccountId && <p className="text-xs text-red-500">{errors.services[index].downPaymentAccountId?.message}</p>}
                                                            </div>
                                                        )}

                                                        <div className="md:col-span-3 space-y-2">
                                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Taksit Sayısı</Label>
                                                            <Input type="number" min="1" className="bg-white dark:bg-slate-900" {...register(`services.${index}.installmentCount` as const)} />
                                                        </div>

                                                        <div className="md:col-span-2 space-y-2">
                                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vade Günü</Label>
                                                            <Input type="number" min="1" max="31" className="bg-white dark:bg-slate-900" {...register(`services.${index}.paymentDueDay` as const)} />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {errors.services?.root && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                                    {errors.services.root.message}
                                </div>
                            )}

                            <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddService}
                                    className="w-full border-dashed border-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 py-6"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Yeni Hizmet / Kalem Ekle
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                <DialogFooter className="p-4 border-t bg-white dark:bg-slate-950 shrink-0">
                    <div className="flex w-full justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            Bu işlem seçilen <strong className="text-foreground">{selectedStudentIds.length}</strong> öğrenciye atanacaktır.
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                                İptal
                            </Button>
                            <Button
                                type="submit"
                                form="bulk-fee-form"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
                                disabled={isSubmitting || isLoading || watchServices.length === 0}
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Kaydediliyor...</>
                                ) : (
                                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Toplu Ata</>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
