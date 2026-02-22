'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, Wallet, Building2, CreditCard } from 'lucide-react';
import type { FinanceAccount } from '@/types/accounting';
import { createFinanceAccount, deleteFinanceAccount } from '@/lib/actions/finance-accounts';

interface AccountsContentProps {
    accounts: FinanceAccount[];
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

/** Hesap tipi ikon ve renk */
function getAccountStyle(type: string) {
    switch (type) {
        case 'cash':
            return { icon: Wallet, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Nakit' };
        case 'bank':
            return { icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Banka' };
        case 'pos':
            return { icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'POS' };
        default:
            return { icon: Wallet, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800', label: type };
    }
}

export function AccountsContent({ accounts }: AccountsContentProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [accountType, setAccountType] = useState<'cash' | 'bank' | 'pos'>('cash');
    const [initialBalance, setInitialBalance] = useState('');
    const [currency, setCurrency] = useState('TRY');

    // Toplam bakiye
    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

    // Yeni hesap oluştur
    const handleCreate = () => {
        if (!name.trim()) {
            setMessage('Hata: Hesap adı zorunludur.');
            return;
        }

        startTransition(async () => {
            const result = await createFinanceAccount({
                name: name.trim(),
                account_type: accountType,
                balance: parseFloat(initialBalance) || 0,
                currency,
            });

            if (result.success) {
                setName('');
                setInitialBalance('');
                setShowForm(false);
                setMessage('Hesap oluşturuldu.');
                router.refresh();
            } else {
                setMessage(`Hata: ${result.error}`);
            }
            setTimeout(() => setMessage(''), 3000);
        });
    };

    // Hesap sil
    const handleDelete = (accountId: string) => {
        if (!confirm('Bu hesabı silmek istediğinize emin misiniz?')) return;

        startTransition(async () => {
            const result = await deleteFinanceAccount(accountId);
            if (result.success) {
                setMessage('Hesap silindi.');
                router.refresh();
            } else {
                setMessage(`Hata: ${result.error}`);
            }
            setTimeout(() => setMessage(''), 3000);
        });
    };

    const inputClass = 'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors';
    const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

    return (
        <div className="space-y-6">
            {/* Toplam bakiye */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Toplam Bakiye</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(totalBalance, 'TRY')}
                </p>
                <p className="text-xs text-gray-400 mt-1">{accounts.length} aktif hesap</p>
            </div>

            {/* Hesap kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map(account => {
                    const style = getAccountStyle(account.account_type);
                    const Icon = style.icon;

                    return (
                        <div
                            key={account.id}
                            className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 relative group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg ${style.bg}`}>
                                        <Icon className={`w-5 h-5 ${style.color}`} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{account.name}</h4>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{style.label}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDelete(account.id)}
                                    disabled={isPending}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all cursor-pointer disabled:opacity-50"
                                    title="Hesabı sil"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-4">
                                <p className={`text-2xl font-bold ${Number(account.balance) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {formatCurrency(Number(account.balance), account.currency)}
                                </p>
                            </div>

                            {!account.is_active && (
                                <span className="absolute top-3 right-3 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                                    Pasif
                                </span>
                            )}
                        </div>
                    );
                })}

                {/* Yeni hesap ekle butonu / form */}
                {!showForm ? (
                    <button
                        onClick={() => setShowForm(true)}
                        className="rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 p-5 flex flex-col items-center justify-center gap-2 min-h-[140px] hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/5 transition-all cursor-pointer"
                    >
                        <Plus className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Yeni Hesap Ekle</span>
                    </button>
                ) : (
                    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10 p-5 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Yeni Hesap</h4>
                        <div>
                            <label htmlFor="accountName" className={labelClass}>Hesap Adı *</label>
                            <input
                                id="accountName"
                                type="text"
                                placeholder="örn: Ana Kasa"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label htmlFor="accountTypeSelect" className={labelClass}>Hesap Tipi</label>
                            <select
                                id="accountTypeSelect"
                                value={accountType}
                                onChange={e => setAccountType(e.target.value as 'cash' | 'bank' | 'pos')}
                                className={inputClass}
                            >
                                <option value="cash">Nakit Kasa</option>
                                <option value="bank">Banka Hesabı</option>
                                <option value="pos">POS Cihazı</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="initialBalance" className={labelClass}>Açılış Bakiyesi</label>
                            <input
                                id="initialBalance"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={initialBalance}
                                onChange={e => setInitialBalance(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreate}
                                disabled={isPending}
                                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                Oluştur
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mesaj */}
            {message && (
                <p className={`text-sm ${message.startsWith('Hata') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
