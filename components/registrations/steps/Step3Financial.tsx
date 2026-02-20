'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getFinanceAccounts } from '@/lib/actions/finance-accounts';
import { FinanceAccount } from '@/types/accounting';

const financialSchema = z.object({
    totalAmount: z.coerce.number().min(1, 'Toplam tutar 0 dan büyük olmalıdır'),
    discountAmount: z.coerce.number().min(0).default(0),
    discountType: z.enum(['percentage', 'fixed']).optional().default('fixed'),
    discountReason: z.string().optional(),
    downPayment: z.coerce.number().min(0).default(0),
    downPaymentAccountId: z.string().optional(),
    installmentCount: z.coerce.number().min(1, 'Kalan tutar için taksit sayısı en az 1 olmalıdır').default(1),
    startMonth: z.string().optional(),
    paymentDueDay: z.coerce.number().min(1).max(31).default(5),
}).refine(data => {
    if (data.downPayment > 0 && !data.downPaymentAccountId) {
        return false;
    }
    return true;
}, {
    message: "Peşinat alındıysa aktarılacak Kasa/Banka hesabı seçilmelidir",
    path: ["downPaymentAccountId"]
}).refine(data => {
    const netAmount = data.discountType === 'percentage'
        ? data.totalAmount - (data.totalAmount * (data.discountAmount / 100))
        : data.totalAmount - data.discountAmount;
    return netAmount >= data.downPayment;
}, {
    message: "Peşinat tutarı net eğitim ücretinden büyük olamaz",
    path: ["downPayment"]
});

type FinancialFormData = z.infer<typeof financialSchema>;

export function Step3Financial() {
    const { formData, updateFormData, setStep } = useRegistration();
    const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FinancialFormData>({
        resolver: zodResolver(financialSchema as any),
        defaultValues: {
            totalAmount: formData.totalAmount || 0,
            discountAmount: formData.discountAmount || 0,
            discountType: formData.discountType || 'fixed',
            discountReason: formData.discountReason || '',
            downPayment: formData.downPayment || 0,
            downPaymentAccountId: formData.downPaymentAccountId || '',
            installmentCount: formData.installmentCount || 1,
            startMonth: formData.startMonth || '',
            paymentDueDay: formData.paymentDueDay || 5,
        }
    });

    const watchDownPayment = watch('downPayment');
    const watchDiscountType = watch('discountType');
    const watchCurrentAccountId = watch('downPaymentAccountId');

    useEffect(() => {
        async function fetchAccounts() {
            setLoadingAccounts(true);
            const accs = await getFinanceAccounts();
            setAccounts(accs);
            setLoadingAccounts(false);
        }
        fetchAccounts();
    }, []);

    const onSubmit = (data: FinancialFormData) => {
        updateFormData(data);
        setStep(4); // Özet ve Onay Adımına Geç
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Finansal Bilgiler</h2>
                <p className="text-muted-foreground">Eğitim ücretini, indirimleri, peşinatı ve taksit planını ayarlayın.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Genel Ücret ve İndirimler */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Genel Ücretlendirme</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="totalAmount">Brüt Eğitim Ücreti (TL) <span className="text-red-500">*</span></Label>
                            <Input id="totalAmount" type="number" {...register('totalAmount')} placeholder="Örn: 50000" />
                            {errors.totalAmount && <p className="text-sm text-red-500">{errors.totalAmount.message}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-2">
                            <div>
                                <Label>İndirim Tipi</Label>
                                <Select value={watchDiscountType} onValueChange={(val: any) => setValue('discountType', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">Sabit Tutar (TL)</SelectItem>
                                        <SelectItem value="percentage">Yüzde (%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="discountAmount">İndirim Miktarı</Label>
                                <Input id="discountAmount" type="number" {...register('discountAmount')} placeholder="Örn: 5000 VEYA 10" />
                                {errors.discountAmount && <p className="text-sm text-red-500">{errors.discountAmount.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="discountReason">İndirim Nedeni</Label>
                                <Input id="discountReason" {...register('discountReason')} placeholder="Kardeş, Erken Kayıt vb." />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Peşinat ve Taksitlendirme */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Ödeme Planı</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div className="space-y-2">
                            <Label htmlFor="downPayment">Alınan Peşinat (TL)</Label>
                            <Input id="downPayment" type="number" {...register('downPayment')} placeholder="Alınmadıysa 0 bırakın" />
                            {errors.downPayment && <p className="text-sm text-red-500">{errors.downPayment.message}</p>}
                        </div>

                        {watchDownPayment > 0 && (
                            <div className="space-y-2">
                                <Label>Kasa / Banka Hesabı (Peşinat İçin) <span className="text-red-500">*</span></Label>
                                <Select
                                    disabled={loadingAccounts}
                                    value={watchCurrentAccountId}
                                    onValueChange={(val) => setValue('downPaymentAccountId', val, { shouldValidate: true })}
                                >
                                    <SelectTrigger className={errors.downPaymentAccountId ? "border-red-500" : ""}>
                                        <SelectValue placeholder={loadingAccounts ? "Yükleniyor..." : "Hesap Seçin"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.balance} {acc.currency})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.downPaymentAccountId && <p className="text-sm text-red-500">{errors.downPaymentAccountId.message}</p>}
                            </div>
                        )}

                        <div className="space-y-2 md:col-span-2 border-t pt-4 mt-2">
                            <p className="text-sm font-medium text-muted-foreground mb-4">Geri Kalan Tutar Taksitlendirmesi</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="installmentCount">Taksit Sayısı</Label>
                                    <Input id="installmentCount" type="number" {...register('installmentCount')} min={1} placeholder="Örn: 9" />
                                    {errors.installmentCount && <p className="text-sm text-red-500">{errors.installmentCount.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="startMonth">Başlangıç Ayı</Label>
                                    <Input id="startMonth" type="month" {...register('startMonth')} />
                                    <p className="text-xs text-muted-foreground mt-1">Örn: Eylül (Boş bırakılırsa hemen başlar)</p>
                                </div>
                                <div>
                                    <Label htmlFor="paymentDueDay">Vade Günü (Her ayın)</Label>
                                    <Input id="paymentDueDay" type="number" min={1} max={31} {...register('paymentDueDay')} />
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                        Geri: Akademik Bilgiler
                    </Button>
                    <Button type="submit">İleri: Onay ve Özet</Button>
                </div>
            </form>
        </div>
    );
}
