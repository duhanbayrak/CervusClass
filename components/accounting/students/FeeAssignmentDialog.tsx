'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Users, User, Plus, Trash2, Calculator, ReceiptText } from 'lucide-react';
import { assignMultipleServicesToStudent, bulkAssignFees } from '@/lib/actions/student-fees';
import { getFinanceSettings } from '@/lib/actions/finance-settings';
import { getFinanceServices } from '@/lib/actions/finance-services';
import { getFinanceAccounts } from '@/lib/actions/finance-accounts';
import type { FinanceService, FinanceAccount } from '@/types/accounting';
import { Button } from '@/components/ui/button';

interface FeeAssignmentDialogProps {
    onClose: () => void;
    currency: string;
}

interface StudentOption {
    id: string;
    full_name: string | null;
    class_id?: string | null;
    class_name?: string | null;
}

interface ClassOption {
    id: string;
    name: string;
}

// Zod Schema
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
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Peşinat KDV dahil net tutardan (" + totalWithVat.toFixed(2) + "₺) büyük olamaz", path: ["downPayment"] });
    }
});

const formSchema = z.object({
    studentId: z.string().optional(),
    classId: z.string().optional(),
    academicPeriod: z.string().min(1, 'Dönem gereklidir'),
    services: z.array(serviceItemSchema).min(1, "En az bir hizmet / ürün eklemelisiniz.")
}).superRefine((data, ctx) => {
    // Single modunda student, bulk modunda class id check yapılır.
    // Bunu component içinde handle edeceğiz, o yüzden basic doğrulama bırakıldı
});

type FormData = z.infer<typeof formSchema>;

export function FeeAssignmentDialog({ onClose, currency }: FeeAssignmentDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [mode, setMode] = useState<'single' | 'bulk'>('single');
    const [message, setMessage] = useState('');

    const [studentSearch, setStudentSearch] = useState('');
    const [students, setStudents] = useState<StudentOption[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);

    // Yardımcı Veriler
    const [servicesData, setServicesData] = useState<FinanceService[]>([]);
    const [accountsData, setAccountsData] = useState<FinanceAccount[]>([]);
    const [defaultDueDay, setDefaultDueDay] = useState(5);

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema as any),
        defaultValues: {
            studentId: '',
            classId: '',
            academicPeriod: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString(),
            services: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "services"
    });

    const watchServices = watch('services') || [];
    const watchClassId = watch('classId');
    const watchStudentId = watch('studentId');

    // Verileri Yükle
    useEffect(() => {
        async function loadData() {
            try {
                const settings = await getFinanceSettings();
                if (settings) {
                    setDefaultDueDay(settings.payment_due_day || 5);
                    const activePeriod = settings.academic_periods?.find(
                        (p: { is_active: boolean; name: string }) => p.is_active
                    );
                    if (activePeriod) setValue('academicPeriod', activePeriod.name);
                }

                const srvs = await getFinanceServices({ type: 'income', is_active: true });
                setServicesData(srvs || []);

                const accs = await getFinanceAccounts();
                setAccountsData(accs || []);

                const res = await fetch('/api/admin/accounting/lookup');
                if (res.ok) {
                    const data = await res.json();
                    setStudents(data.students || []);
                    setClasses(data.classes || []);
                }
            } catch (err) {
                console.error("Data load error:", err);
            }
        }
        loadData();
    }, [setValue]);

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
            paymentDueDay: defaultDueDay
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

    const filteredStudents = students.filter(s => {
        if (watchClassId && s.class_id !== watchClassId) return false;
        if (studentSearch) {
            return s.full_name?.toLowerCase().includes(studentSearch.toLowerCase());
        }
        return true;
    });

    // Ana Gönderim (Submit)
    const onSubmit = (data: FormData) => {
        startTransition(async () => {
            setMessage('');

            if (mode === 'single') {
                if (!data.studentId) return setMessage("Hata: Öğrenci seçimi zorunludur.");

                const res = await assignMultipleServicesToStudent({
                    studentId: data.studentId,
                    classId: data.classId || undefined,
                    academicPeriod: data.academicPeriod,
                    services: data.services
                });

                if (res.success) {
                    router.refresh();
                    onClose();
                } else {
                    setMessage(`Hata: ${res.error}`);
                }
            } else {
                if (!data.classId) return setMessage("Hata: Sınıf seçimi zorunludur.");
                // Bulk mod geçici adaptasyon: her öğrenciye loop atılacak
                // Performanslı olması için bulkAssignFees benzeri bir yapıya ihtiyaç var ama 
                // mevcut fonksiyonda loop yapılabilir

                const classStudents = students.filter(s => s.class_id === data.classId);
                if (classStudents.length === 0) return setMessage("Hata: Sınıfta kayıtlı öğrenci yok.");

                let count = 0;
                for (const s of classStudents) {
                    await assignMultipleServicesToStudent({
                        studentId: s.id,
                        classId: data.classId,
                        academicPeriod: data.academicPeriod,
                        services: data.services
                    });
                    count++;
                }

                setMessage(`${count} öğrenciye ücret atandı.`);
                setTimeout(() => {
                    router.refresh();
                    onClose();
                }, 1500);
            }
        });
    };

    // Fiyat Özeti
    const calculateTotals = () => {
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

            totalNet += netPrice;
            totalVat += vat;
            totalFinal += (netPrice + vat);
            totalDownPayment += Number(item.downPayment) || 0;
        });

        return { totalNet, totalVat, totalFinal, totalDownPayment, remaining: totalFinal - totalDownPayment };
    };

    const totals = calculateTotals();

    // Classes
    const inputClass = 'w-full rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors';
    const labelClass = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Çoklu Hizmet Ata</h3>
                        <p className="text-sm text-gray-500 mt-1">Öğrenciye (veya sınıfa) ait taksitli hizmet paketlerini konfigüre edin.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Mod Seçimi */}
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-lg w-fit">
                        <button
                            onClick={() => { setMode('single'); setValue('classId', ''); setValue('studentId', ''); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'single' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500'}`}
                        >
                            <User className="w-4 h-4" /> Tekli Atama
                        </button>
                        <button
                            onClick={() => { setMode('bulk'); setValue('studentId', ''); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'bulk' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-500'}`}
                        >
                            <Users className="w-4 h-4" /> Toplu (Sınıf) Atama
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Öğrenci/Sınıf Seçim */}
                        <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5 space-y-4">
                            <div>
                                <label className={labelClass}>Akademik Dönem</label>
                                <input type="text" {...register('academicPeriod')} className={inputClass} />
                            </div>

                            {mode === 'single' ? (
                                <>
                                    <div>
                                        <label className={labelClass}>Sınıfa Göre Filtrele (Opsiyonel)</label>
                                        <select {...register('classId')} className={inputClass} onChange={(e) => setValue('classId', e.target.value)}>
                                            <option value="">Tüm Sınıflar</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Öğrenci Ara / Seç *</label>
                                        <input
                                            type="text"
                                            placeholder="İsim ara..."
                                            value={studentSearch}
                                            onChange={e => setStudentSearch(e.target.value)}
                                            className={`${inputClass} mb-2`}
                                        />
                                        <div className="max-h-36 overflow-y-auto rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-transparent">
                                            {filteredStudents.map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => setValue('studentId', s.id, { shouldValidate: true })}
                                                    className={`w-full flex justify-between px-3 py-2 text-sm text-left transition-colors ${watchStudentId === s.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                                >
                                                    <span>{s.full_name}</span>
                                                    <span className="text-xs text-muted-foreground">{s.class_name}</span>
                                                </button>
                                            ))}
                                            {filteredStudents.length === 0 && <p className="text-xs text-center py-3 text-muted-foreground">Kayıtlı öğrenci yok</p>}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className={labelClass}>Sınıf Seç *</label>
                                    <select {...register('classId')} className={inputClass}>
                                        <option value="">Sınıf seçin...</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <p className="text-xs text-orange-500 mt-2">Bu sınıftaki tüm öğrencilere aşağıdaki sepet aynen kopyalanacaktır.</p>
                                </div>
                            )}
                        </div>

                        {/* Canlı Özet */}
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex flex-col justify-center">
                            <h4 className="font-semibold text-primary mb-3 flex items-center"><Calculator className="w-5 h-5 mr-2" /> Sepet Özeti</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Net (KDV Hariç):</span>
                                    <span>{totals.totalNet.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>KDV Toplam:</span>
                                    <span>{totals.totalVat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}</span>
                                </div>
                                <div className="h-px bg-primary/20 my-1" />
                                <div className="flex justify-between font-bold text-primary text-base">
                                    <span>Genel Toplam:</span>
                                    <span>{totals.totalFinal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}</span>
                                </div>
                                {totals.totalDownPayment > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Peşinat (Alındı):</span>
                                        <span>-{totals.totalDownPayment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold mt-2">
                                    <span>Taksitlendirilecek:</span>
                                    <span>{totals.remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hizmetler Sepeti */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold flex items-center"><ReceiptText className="w-5 h-5 mr-2" /> Eklenecek Hizmet Kalemleri</h4>
                            <Button type="button" onClick={handleAddService} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Plus className="w-4 h-4 mr-1" /> Hizmet Ekle
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => {
                                const svcErrors = errors.services?.[index] as any;
                                return (
                                    <div key={field.id} className="p-4 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] shadow-sm relative">
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="absolute -top-3 -right-3 bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full transition-colors drop-shadow-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {/* Hizmet & Fiyat */}
                                            <div className="col-span-1 md:col-span-2 space-y-3">
                                                <div>
                                                    <label className={labelClass}>Hizmet/Ürün *</label>
                                                    <select
                                                        className={inputClass}
                                                        value={watchServices[index]?.serviceId || ''}
                                                        onChange={e => handleServiceSelect(index, e.target.value)}
                                                    >
                                                        <option value="">Seçiniz...</option>
                                                        {servicesData.map(s => <option key={s.id} value={s.id}>{s.name} (₺{s.unit_price})</option>)}
                                                    </select>
                                                    {svcErrors?.serviceId && <p className="text-red-500 text-xs mt-1">{svcErrors.serviceId.message}</p>}
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className={labelClass}>Birim Fiyat</label>
                                                        <div className="relative">
                                                            <input type="number" step="0.01" {...register(`services.${index}.unitPrice`)} className={`${inputClass} pr-8`} />
                                                            <span className="absolute right-3 top-2 text-xs text-muted-foreground">{currency}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>KDV Oranı (%)</label>
                                                        <input type="number" step="1" {...register(`services.${index}.vatRate`)} className={inputClass} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* İndirim */}
                                            <div className="col-span-1 border-l border-gray-200 dark:border-white/10 pl-4 space-y-3">
                                                <div>
                                                    <label className={labelClass}>İndirim Tipi</label>
                                                    <select {...register(`services.${index}.discountType`)} className={inputClass}>
                                                        <option value="fixed">Tutar ({currency})</option>
                                                        <option value="percentage">Yüzde (%)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>İndirim Miktarı</label>
                                                    <input type="number" step="0.01" {...register(`services.${index}.discountAmount`)} className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>İnd. Sebebi</label>
                                                    <input type="text" placeholder="opsiyonel" {...register(`services.${index}.discountReason`)} className={inputClass} />
                                                </div>
                                            </div>

                                            {/* Ödeme Planı (Peşinat/Taksit) */}
                                            <div className="col-span-1 border-l border-gray-200 dark:border-white/10 pl-4 space-y-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="col-span-2">
                                                        <label className={labelClass}>Alınan Peşinat ({currency})</label>
                                                        <input type="number" step="0.01" {...register(`services.${index}.downPayment`)} className={inputClass} />
                                                        {svcErrors?.downPayment && <p className="text-red-500 text-[10px] mt-1 break-words">{svcErrors.downPayment.message}</p>}
                                                    </div>

                                                    {Number(watchServices[index]?.downPayment) > 0 && (
                                                        <div className="col-span-2">
                                                            <label className={labelClass}>Peşinat Kasası *</label>
                                                            <select {...register(`services.${index}.downPaymentAccountId`)} className={inputClass}>
                                                                <option value="">Seçiniz...</option>
                                                                {accountsData.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                            </select>
                                                            {svcErrors?.downPaymentAccountId && <p className="text-red-500 text-xs mt-1">{svcErrors.downPaymentAccountId.message}</p>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className={labelClass}>Taksit Sy.</label>
                                                        <input type="number" min="1" {...register(`services.${index}.installmentCount`)} className={inputClass} />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Vade Günü</label>
                                                        <input type="number" min="1" max="31" {...register(`services.${index}.paymentDueDay`)} className={inputClass} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Taksit Baş. Ayı (Opsiyonel)</label>
                                                    <input type="month" {...register(`services.${index}.startMonth`)} className={inputClass} />
                                                    <span className="text-[10px] text-muted-foreground leading-tight">Girilmezse form tarihi (bu ay) baz alınır.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {fields.length === 0 && (
                                <div className="text-center py-8 rounded-xl border border-dashed border-gray-300 dark:border-white/20">
                                    <p className="text-sm text-gray-500">Henüz hizmet eklenmedi.</p>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddService} className="mt-3">Şimdi Ekle</Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm font-medium border ${message.startsWith('Hata') ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
                            {message}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] flex-shrink-0">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>İptal</Button>
                    <Button
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        disabled={isPending || fields.length === 0}
                        className="bg-primary hover:bg-primary/90 min-w-[150px]"
                    >
                        {isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Kaydediliyor...</>
                        ) : 'Sepeti Onayla / Ata'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
