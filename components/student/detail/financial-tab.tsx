'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Wallet, FileText, CheckCircle, Clock, AlertCircle, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface FinancialTabProps {
    data: {
        fees: any[];
        installments: any[];
        payments: any[];
    };
}

export function StudentFinancialTab({ data }: Readonly<FinancialTabProps>) { // NOSONAR
    const { fees, installments, payments } = data;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return format(new Date(dateString), 'dd MMM yyyy', { locale: tr });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Ödendi</Badge>;
            case 'partial':
                return <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-600">Kısmi Ödeme</Badge>;
            case 'pending':
                return <Badge variant="outline" className="text-slate-500 border-slate-300">Bekliyor</Badge>;
            case 'overdue':
                return <Badge variant="destructive">Gecikmiş</Badge>;
            case 'completed':
                return <Badge variant="default" className="bg-indigo-500 hover:bg-indigo-600">Tamamlandı</Badge>;
            case 'active':
                return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Aktif</Badge>;
            case 'cancelled':
                return <Badge variant="destructive">İptal Edildi</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (!fees || fees.length === 0) {
        return (
            <Card className="border-slate-200 shadow-sm border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                    <Wallet className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-lg font-medium text-slate-900">Finansal Kayıt Bulunamadı</p>
                    <p className="text-sm">Bu öğrenciye ait tanımlanmış aktif bir ücret planı bulunmamaktadır.</p>
                </CardContent>
            </Card>
        );
    }

    // Toplam tutarları fees dökümünden toplayalım
    const totalNetAmount = fees.reduce((acc, f) => acc + (Number(f.net_amount) || 0), 0);
    const totalGrossAmount = fees.reduce((acc, f) => acc + (Number(f.total_amount) || 0), 0);
    const totalPaid = installments.reduce((acc, inst) => acc + (Number(inst.paid_amount) || 0), 0);
    const remainingAmount = totalNetAmount - totalPaid;

    // En az 1 tane aktif ücret varsa genel durumu Aktif göster
    const isAnyActive = fees.some(f => f.status === 'active');
    let displayStatus: 'completed' | 'active' | 'pending';
    if (remainingAmount <= 0) displayStatus = 'completed';
    else if (isAnyActive) displayStatus = 'active';
    else displayStatus = 'pending';

    return (
        <div className="space-y-6">
            {/* Özet Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Eğitim Ücreti (Net)</CardTitle>
                        <CreditCard className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalNetAmount)}</div>
                        <p className="text-xs text-slate-500 mt-1">Brüt: {formatCurrency(totalGrossAmount)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{fees.length} adet Hizmet/Ürün Sepeti</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Toplam Ödenen</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</div>
                        <p className="text-xs text-slate-500 mt-1">{payments.length} adet işlem</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Kalan Bakiye</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{formatCurrency(remainingAmount)}</div>
                        <p className="text-xs text-slate-500 mt-1">Genel Durum: {getStatusBadge(displayStatus)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Alınan Hizmetler (Sepetler) Tablosu */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ShoppingCart className="h-5 w-5 text-indigo-500" />
                        Alınan Hizmetler
                    </CardTitle>
                    <CardDescription>Öğrencinin yararlandığı ürün ve hizmet paketleri</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Hizmet/Ürün</TableHead>
                                    <TableHead>Akademik Dönem</TableHead>
                                    <TableHead className="text-right">İndirim</TableHead>
                                    <TableHead className="text-right">Net Tutar (KDV Dahil)</TableHead>
                                    <TableHead className="text-center">Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fees.map((fee) => (
                                    <TableRow key={fee.id}>
                                        <TableCell className="font-medium text-slate-900 border-r">{fee.service?.name || '-'}</TableCell>
                                        <TableCell>{fee.academic_period || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            {fee.discount_amount > 0 ? (
                                                <span className="text-red-500 text-xs px-2 py-0.5 bg-red-50 rounded-full">
                                                    -{formatCurrency(fee.discount_amount)}
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(fee.net_amount)}</TableCell>
                                        <TableCell className="text-center">
                                            {getStatusBadge(fee.status)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Taksit Planı */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-indigo-500" />
                            Taksit Planı
                        </CardTitle>
                        <CardDescription>Ödeme planı ve vadesi gelen taksitler</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="w-[80px]">Taksit</TableHead>
                                        <TableHead>Vade</TableHead>
                                        <TableHead className="text-right">Tutar</TableHead>
                                        <TableHead className="text-right">Ödenen</TableHead>
                                        <TableHead className="text-center">Durum</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {installments.map((inst) => {
                                        const isOverdue = inst.status === 'pending' && new Date(inst.due_date) < new Date();
                                        return (
                                            <TableRow key={inst.id}>
                                                <TableCell className="font-medium text-center">{inst.installment_number}</TableCell>
                                                <TableCell className={isOverdue ? "text-red-500 font-medium" : ""}>
                                                    {formatDate(inst.due_date)}
                                                    {isOverdue && <AlertCircle className="inline ml-1 h-3 w-3 text-red-500" />}
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(inst.amount)}</TableCell>
                                                <TableCell className="text-right text-emerald-600">{formatCurrency(inst.paid_amount || 0)}</TableCell>
                                                <TableCell className="text-center">
                                                    {getStatusBadge(isOverdue ? 'overdue' : inst.status)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {installments.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-slate-500 py-4">Taksit kaydı yok</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Ödeme Geçmişi */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Wallet className="h-5 w-5 text-emerald-500" />
                            Ödeme Geçmişi
                        </CardTitle>
                        <CardDescription>Yapılan ödemeler ve tahsilat işlemleri</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Tarih</TableHead>
                                        <TableHead>Kasa/Banka</TableHead>
                                        <TableHead>Yöntem</TableHead>
                                        <TableHead className="text-right">Tutar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{formatDate(payment.payment_date || payment.created_at)}</TableCell>
                                            <TableCell>{payment.account?.name || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs uppercase">
                                                    {payment.payment_method}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-emerald-600">
                                                +{formatCurrency(payment.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {payments.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-slate-500 py-4">Henüz ödeme kaydı bulunmuyor</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
