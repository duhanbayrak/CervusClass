'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Users, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { StudentFee } from '@/types/accounting';
import { FeeAssignmentDialog } from './FeeAssignmentDialog';

interface StudentFeeListProps {
    fees: StudentFee[];
    currency: string;
}

/** Para formatı */
function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currency || 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/** Durum renk sınıfları */
function getStatusStyle(status: string) {
    switch (status) {
        case 'active':
            return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', label: 'Aktif', icon: Users };
        case 'completed':
            return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', label: 'Tamamlandı', icon: CheckCircle2 };
        case 'cancelled':
            return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', label: 'İptal', icon: XCircle };
        default:
            return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', label: status, icon: Users };
    }
}

export function StudentFeeList({ fees, currency }: Readonly<StudentFeeListProps>) { // NOSONAR
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showAssignDialog, setShowAssignDialog] = useState(false);

    // Filtrele
    const filteredFees = fees.filter(fee => {
        const matchesSearch = !searchTerm ||
            (fee as StudentFee & { student?: { full_name?: string } }).student?.full_name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || fee.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Özet istatistikler ve Gruplama Mantığı
    const activeFees = fees.filter(f => f.status === 'active').length;
    const totalNet = fees.reduce((sum, f) => sum + Number(f.net_amount), 0);
    const totalBrut = fees.reduce((sum, f) => sum + Number(f.total_amount), 0);
    const totalDiscountTL = totalBrut - totalNet;

    // Öğrenci bazlı gruplama
    const groupedStudents = filteredFees.reduce((acc, fee) => {
        const feeWithStudent = fee as StudentFee & {
            student?: { full_name?: string; email?: string };
            classes?: { name?: string };
        };
        const studentId = fee.student_id;

        if (!acc[studentId]) {
            acc[studentId] = {
                id: studentId,
                firstFeeId: fee.id, // Yönlendirme için referans
                student: feeWithStudent.student,
                classes: feeWithStudent.classes,
                academic_period: fee.academic_period,
                total_amount: 0,
                discount_amount: 0,
                net_amount: 0,
                vat_amount: 0,
                status: fee.status, // En az biri aktifse genel aktif diyeceğiz (altta)
                subFees: []
            };
        }

        acc[studentId].total_amount += Number(fee.total_amount);
        acc[studentId].discount_amount += Number(fee.discount_amount); // Sadece TL bazında indirim toplanır
        acc[studentId].net_amount += Number(fee.net_amount);
        acc[studentId].vat_amount += Number(fee.vat_amount || 0);
        acc[studentId].subFees.push(fee);

        if (fee.status === 'active') {
            acc[studentId].status = 'active'; // Bir tane aktif hizmet varsa tümünü kapsasın
        }

        return acc;
    }, {} as Record<string, any>);

    const studentRows = Object.values(groupedStudents);

    const cardClass = 'rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5';

    return (
        <div className="space-y-6">
            {/* Özet kartlar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`${cardClass} p-4`}>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Kayıt</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{fees.length}</p>
                </div>
                <div className={`${cardClass} p-4`}>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aktif Ücretler</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{activeFees}</p>
                </div>
                <div className={`${cardClass} p-4`}>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Net Tutar</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totalNet, currency)}</p>
                    {totalDiscountTL > 0 && (
                        <p className="text-xs text-orange-500 mt-0.5">
                            İndirim: {formatCurrency(totalDiscountTL, currency)}
                        </p>
                    )}
                </div>
            </div>

            {/* Araç çubuğu */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex gap-3 flex-1 w-full sm:w-auto">
                    {/* Arama */}
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Öğrenci ara..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        />
                    </div>

                    {/* Durum filtresi */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="all">Tümü</option>
                            <option value="active">Aktif</option>
                            <option value="completed">Tamamlandı</option>
                            <option value="cancelled">İptal</option>
                        </select>
                    </div>
                </div>

                {/* Yeni ücret atama butonu */}
                <button
                    onClick={() => setShowAssignDialog(true)}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                    <Plus className="w-4 h-4" />
                    Ücret Ata
                </button>
            </div>

            {/* Tablo */}
            <div className={`${cardClass} overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5">
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Öğrenci</th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dönem</th>
                                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brüt Tutar</th>
                                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">İndirim</th>
                                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">KDV Tutarı</th>
                                <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">KDV Dahil Net</th>
                                <th className="text-center px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Taksit</th>
                                <th className="text-center px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                                <th className="px-6 py-3.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {studentRows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
                                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                        {fees.length === 0
                                            ? 'Henüz ücret kaydı bulunmuyor. Yukarıdaki "Ücret Ata" butonuyla yeni kayıt oluşturun.'
                                            : 'Filtreye uygun kayıt bulunamadı.'}
                                    </td>
                                </tr>
                            ) : (
                                studentRows.map(row => {
                                    const statusStyle = getStatusStyle(row.status);
                                    const StatusIcon = statusStyle.icon;

                                    return (
                                        <tr
                                            key={row.id}
                                            onClick={() => router.push(`/admin/accounting/students/${row.id}`)}
                                            className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {row.student?.full_name || '—'}
                                                </p>
                                                {row.classes?.name && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {row.classes.name}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {row.academic_period}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 text-right">
                                                {formatCurrency(row.total_amount, currency)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                {row.discount_amount > 0 ? (
                                                    <span className="text-orange-600 dark:text-orange-400">
                                                        -{formatCurrency(row.discount_amount, currency)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">
                                                {formatCurrency(row.vat_amount, currency)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                                                {formatCurrency(row.net_amount, currency)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                                                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{row.subFees.length} Hizmet Sepeti</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {statusStyle.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Detaya Git →</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ücret atama dialog */}
            {showAssignDialog && (
                <FeeAssignmentDialog
                    onClose={() => setShowAssignDialog(false)}
                    currency={currency}
                />
            )}
        </div>
    );
}
