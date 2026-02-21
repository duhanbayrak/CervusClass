'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Users, User } from 'lucide-react';
import { createStudentFee, bulkAssignFees } from '@/lib/actions/student-fees';
import { getFinanceSettings } from '@/lib/actions/finance-settings';

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

export function FeeAssignmentDialog({ onClose, currency }: FeeAssignmentDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [mode, setMode] = useState<'single' | 'bulk'>('single');
    const [message, setMessage] = useState('');

    // Form state
    const [studentId, setStudentId] = useState('');
    const [classId, setClassId] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [discountReason, setDiscountReason] = useState('');
    const [installmentCount, setInstallmentCount] = useState(1);
    const [academicPeriod, setAcademicPeriod] = useState('');
    const [notes, setNotes] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    // Öğrenci ve sınıf listeleri (ayarlardan çek)
    const [students, setStudents] = useState<StudentOption[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [paymentDueDay, setPaymentDueDay] = useState(1);

    // Verileri yükle
    useEffect(() => {
        async function loadData() {
            // Ayarları çek
            const settings = await getFinanceSettings();
            if (settings) {
                setInstallmentCount(settings.default_installments || 1);
                setPaymentDueDay(settings.payment_due_day || 1);
                // Aktif akademik dönemi bul
                const activePeriod = settings.academic_periods?.find(
                    (p: { is_active: boolean; name: string }) => p.is_active
                );
                if (activePeriod) setAcademicPeriod(activePeriod.name);
            }

            // Öğrenci ve sınıfları çekmek için fetch kullan
            try {
                const res = await fetch('/api/admin/accounting/lookup');
                if (res.ok) {
                    const data = await res.json();
                    setStudents(data.students || []);
                    setClasses(data.classes || []);
                }
            } catch {
                // Lookup henüz yoksa boş bırak
            }
        }
        loadData();
    }, []);

    // Net tutar hesapla
    const calculateNet = () => {
        const total = parseFloat(totalAmount) || 0;
        const discount = parseFloat(discountAmount) || 0;
        if (discountType === 'percentage') {
            return total * (1 - discount / 100);
        }
        return total - discount;
    };

    // Öğrencileri sınıf ve arama kriterine göre filtrele
    const filteredStudents = students.filter(s => {
        // Sınıf filtresi
        if (classId && s.class_id !== classId) return false;
        // Ad araması
        if (studentSearch) {
            return s.full_name?.toLowerCase().includes(studentSearch.toLowerCase());
        }
        return true;
    });

    // Formu gönder
    const handleSubmit = () => {
        startTransition(async () => {
            if (mode === 'single') {
                if (!studentId || !totalAmount) {
                    setMessage('Hata: Öğrenci ve tutar zorunludur.');
                    return;
                }

                const result = await createStudentFee({
                    student_id: studentId,
                    class_id: classId || undefined,
                    total_amount: parseFloat(totalAmount),
                    discount_amount: parseFloat(discountAmount) || 0,
                    discount_type: parseFloat(discountAmount) > 0 ? discountType : undefined,
                    discount_reason: discountReason || undefined,
                    installment_count: installmentCount,
                    academic_period: academicPeriod || new Date().getFullYear().toString(),
                    notes: notes || undefined,
                    payment_due_day: paymentDueDay,
                });

                if (result.success) {
                    router.refresh();
                    onClose();
                } else {
                    setMessage(`Hata: ${result.error}`);
                }
            } else {
                // Toplu atama
                if (!classId || !totalAmount) {
                    setMessage('Hata: Sınıf ve tutar zorunludur.');
                    return;
                }

                const result = await bulkAssignFees({
                    class_id: classId,
                    total_amount: parseFloat(totalAmount),
                    installment_count: installmentCount,
                    academic_period: academicPeriod || new Date().getFullYear().toString(),
                    payment_due_day: paymentDueDay,
                });

                if (result.success) {
                    setMessage(`${result.assigned_count} öğrenciye ücret atandı.`);
                    setTimeout(() => {
                        router.refresh();
                        onClose();
                    }, 1500);
                } else {
                    setMessage(`Hata: ${result.error}`);
                }
            }
        });
    };

    const inputClass = 'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors';
    const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
                {/* Başlık */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ücret Ata</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Mod seçimi */}
                    <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-white/5 p-1">
                        <button
                            onClick={() => setMode('single')}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${mode === 'single'
                                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            <User className="w-4 h-4" />
                            Tekli Atama
                        </button>
                        <button
                            onClick={() => setMode('bulk')}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${mode === 'bulk'
                                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Toplu Atama
                        </button>
                    </div>

                    {/* Öğrenci seçimi (tekli mod) — sınıf filtresi + arama */}
                    {mode === 'single' && (
                        <div className="space-y-3">
                            {/* Sınıf filtresi */}
                            <div>
                                <label htmlFor="classFilter" className={labelClass}>Sınıfa Göre Filtrele</label>
                                <select
                                    id="classFilter"
                                    value={classId}
                                    onChange={e => {
                                        setClassId(e.target.value);
                                        setStudentId(''); // Sınıf değişince öğrenci seçimini sıfırla
                                    }}
                                    className={inputClass}
                                >
                                    <option value="">Tüm Sınıflar</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Öğrenci arama + seçim */}
                            <div>
                                <label htmlFor="studentSearch" className={labelClass}>Öğrenci *</label>
                                <input
                                    id="studentSearch"
                                    type="text"
                                    placeholder="Öğrenci adı ara..."
                                    value={studentSearch}
                                    onChange={e => setStudentSearch(e.target.value)}
                                    className={`${inputClass} mb-2`}
                                />
                                <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setStudentId(s.id)}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${studentId === s.id
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                <span>{s.full_name}</span>
                                                {s.class_name && (
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">{s.class_name}</span>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-center text-sm text-gray-400 py-4">
                                            Öğrenci bulunamadı
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sınıf seçimi (toplu mod) */}
                    {mode === 'bulk' && (
                        <div>
                            <label htmlFor="classSelect" className={labelClass}>Sınıf *</label>
                            <select
                                id="classSelect"
                                value={classId}
                                onChange={e => setClassId(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Sınıf seçin...</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Tutar */}
                    <div>
                        <label htmlFor="totalAmount" className={labelClass}>Toplam Tutar *</label>
                        <div className="relative">
                            <input
                                id="totalAmount"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={totalAmount}
                                onChange={e => setTotalAmount(e.target.value)}
                                className={`${inputClass} pr-12`}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                                {currency}
                            </span>
                        </div>
                    </div>

                    {/* İndirim (tekli mod) */}
                    {mode === 'single' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="discountAmount" className={labelClass}>İndirim</label>
                                    <input
                                        id="discountAmount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={discountAmount}
                                        onChange={e => setDiscountAmount(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="discountType" className={labelClass}>İndirim Tipi</label>
                                    <select
                                        id="discountType"
                                        value={discountType}
                                        onChange={e => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                                        className={inputClass}
                                    >
                                        <option value="fixed">Sabit ({currency})</option>
                                        <option value="percentage">Yüzde (%)</option>
                                    </select>
                                </div>
                            </div>
                            {parseFloat(discountAmount) > 0 && (
                                <input
                                    type="text"
                                    placeholder="İndirim sebebi (opsiyonel)"
                                    value={discountReason}
                                    onChange={e => setDiscountReason(e.target.value)}
                                    className={inputClass}
                                />
                            )}
                        </div>
                    )}

                    {/* Taksit & Dönem */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="installmentCount" className={labelClass}>Taksit Sayısı</label>
                            <select
                                id="installmentCount"
                                value={installmentCount}
                                onChange={e => setInstallmentCount(Number(e.target.value))}
                                className={inputClass}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                    <option key={n} value={n}>
                                        {n === 1 ? 'Peşin' : `${n} Taksit`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="academicPeriod" className={labelClass}>Akademik Dönem</label>
                            <input
                                id="academicPeriod"
                                type="text"
                                placeholder="örn: 2025-2026"
                                value={academicPeriod}
                                onChange={e => setAcademicPeriod(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Notlar */}
                    {mode === 'single' && (
                        <div>
                            <label htmlFor="notes" className={labelClass}>Not (opsiyonel)</label>
                            <textarea
                                id="notes"
                                placeholder="Ücretle ilgili ekstra bilgiler..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                className={inputClass}
                            />
                        </div>
                    )}

                    {/* Hesaplama özeti (tekli mod) */}
                    {mode === 'single' && parseFloat(totalAmount) > 0 && (
                        <div className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-4 space-y-1">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                <span>Brüt Tutar</span>
                                <span>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(parseFloat(totalAmount))}</span>
                            </div>
                            {parseFloat(discountAmount) > 0 && (
                                <div className="flex justify-between text-sm text-orange-600 dark:text-orange-400">
                                    <span>İndirim</span>
                                    <span>
                                        -{discountType === 'percentage'
                                            ? `%${discountAmount}`
                                            : new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(parseFloat(discountAmount))
                                        }
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-white/10 pt-1">
                                <span>Net Tutar</span>
                                <span>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(calculateNet())}</span>
                            </div>
                            {installmentCount > 1 && (
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>{installmentCount} taksit</span>
                                    <span>
                                        Taksit başı ~{new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(calculateNet() / installmentCount)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mesaj */}
                    {message && (
                        <p className={`text-sm ${message.startsWith('Hata') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                            {message}
                        </p>
                    )}
                </div>

                {/* Eylem butonları */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        {isPending ? 'Kaydediliyor...' : mode === 'single' ? 'Ücret Ata' : 'Toplu Ata'}
                    </button>
                </div>
            </div>
        </div>
    );
}
