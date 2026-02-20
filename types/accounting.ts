// =============================================
// Muhasebe Modülü Tip Tanımları
// =============================================

// --- Enum Benzeri Tip Sabitleri ---

/** Ödeme yöntemi seçenekleri */
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'other';

/** Hesap tipi seçenekleri */
export type AccountType = 'cash' | 'bank' | 'pos';

/** İşlem tipi seçenekleri */
export type TransactionType = 'income' | 'expense' | 'transfer';

/** Kategori tipi seçenekleri */
export type CategoryType = 'income' | 'expense';

/** Ücret durumu seçenekleri */
export type FeeStatus = 'active' | 'completed' | 'cancelled';

/** Taksit durumu seçenekleri */
export type InstallmentStatus = 'pending' | 'paid' | 'overdue' | 'partial';

/** İndirim tipi seçenekleri */
export type DiscountType = 'percentage' | 'fixed';

/** Tekrarlayan işlem periyodu */
export type RecurringPeriod = 'monthly' | 'quarterly' | 'yearly';

// --- Veritabanı İnterface'leri ---

/** Muhasebe ayarları */
export interface FinanceSettings {
    id: string;
    organization_id: string;
    currency: string;
    default_installments: number;
    payment_due_day: number;
    academic_periods: AcademicPeriod[];
    created_at: string;
    updated_at: string;
}

/** Akademik dönem yapısı (JSONB içinde saklanan) */
export interface AcademicPeriod {
    name: string; // örn: "2025-2026"
    start_date: string; // ISO date
    end_date: string; // ISO date
    is_active: boolean;
}

/** Kasa & Banka hesapları */
export interface FinanceAccount {
    id: string;
    organization_id: string;
    name: string;
    account_type: AccountType;
    balance: number;
    currency: string;
    is_active: boolean;
    created_at: string;
}

/** Gelir/Gider kategorileri */
export interface FinanceCategory {
    id: string;
    organization_id: string;
    name: string;
    type: CategoryType;
    parent_id: string | null;
    icon: string | null;
    sort_order: number;
    is_system: boolean;
    created_at: string;
}

/** Öğrenci ücret tanımı */
export interface StudentFee {
    id: string;
    organization_id: string;
    student_id: string;
    student?: {
        full_name: string | null;
        email?: string | null;
        classes?: { name: string } | null;
    } | null;
    class_id: string | null;
    classes?: { name: string } | null;
    total_amount: number;
    discount_amount: number;
    discount_type: DiscountType | null;
    discount_reason: string | null;
    net_amount: number;
    installment_count: number;
    academic_period: string;
    status: FeeStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

/** Taksit planı */
export interface FeeInstallment {
    id: string;
    fee_id: string;
    organization_id: string;
    installment_number: number;
    amount: number;
    due_date: string;
    status: InstallmentStatus;
    paid_amount: number;
    paid_at: string | null;
    created_at: string;
}

/** Ödeme kaydı */
export interface FeePayment {
    id: string;
    organization_id: string;
    student_id: string;
    student?: {
        full_name: string | null;
    } | null;
    installment_id: string | null;
    installment?: FeeInstallment | null;
    account_id: string;
    account?: {
        name: string;
    } | null;
    amount: number;
    payment_method: PaymentMethod;
    reference_no: string | null;
    notes: string | null;
    created_by: string;
    created_by_profile?: {
        full_name: string | null;
    } | null;
    payment_date: string;
    created_at: string;
}

/** Gelir/Gider işlemi */
export interface FinanceTransaction {
    id: string;
    organization_id: string;
    account_id: string;
    account?: {
        name: string;
    } | null;
    category_id: string;
    category?: {
        name: string;
        type: CategoryType;
        icon: string | null;
    } | null;
    type: TransactionType;
    amount: number;
    description: string;
    transaction_date: string;
    reference_no: string | null;
    related_payment_id: string | null;
    transfer_to_account_id: string | null;
    transfer_to_account?: {
        name: string;
    } | null;
    receipt_url: string | null;
    created_by: string;
    created_by_profile?: {
        full_name: string | null;
    } | null;
    is_recurring: boolean;
    recurring_period: RecurringPeriod | null;
    created_at: string;
    deleted_at: string | null;
}

// --- Dashboard & Rapor Tipleri ---

/** Finansal dashboard özet verileri */
export interface FinancialSummary {
    total_income: number;
    total_expense: number;
    net_profit: number;
    collected_amount: number;
    pending_amount: number;
    overdue_amount: number;
    collection_rate: number; // yüzde olarak 0-100
}

/** Aylık gelir-gider trend verisi */
export interface MonthlyTrend {
    month: string; // "2026-01" gibi
    income: number;
    expense: number;
}

/** Kategori bazlı dağılım */
export interface CategoryDistribution {
    category_name: string;
    category_icon: string | null;
    amount: number;
    percentage: number;
}

/** Vadesi geçmiş taksit (uyarı için) */
export interface OverdueInstallment {
    installment_id: string;
    student_name: string;
    student_id: string;
    amount: number;
    due_date: string;
    days_overdue: number;
}

// --- Ödeme yöntemi etiketleri (UI için) ---

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    cash: 'Nakit',
    bank_transfer: 'Havale/EFT',
    credit_card: 'Kredi Kartı',
    other: 'Diğer',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    cash: 'Nakit Kasa',
    bank: 'Banka Hesabı',
    pos: 'POS Cihazı',
};

export const FEE_STATUS_LABELS: Record<FeeStatus, string> = {
    active: 'Aktif',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi',
};

export const INSTALLMENT_STATUS_LABELS: Record<InstallmentStatus, string> = {
    pending: 'Bekliyor',
    paid: 'Ödendi',
    overdue: 'Vadesi Geçmiş',
    partial: 'Kısmi Ödeme',
};
