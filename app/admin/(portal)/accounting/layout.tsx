import AccountingSubNav from '@/components/accounting/AccountingSubNav';

export default function AccountingLayout({ // NOSONAR
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-col h-full">
            {/* Muhasebe alt navigasyon — tüm muhasebe sayfalarında görünür */}
            <AccountingSubNav />

            {/* Sayfa içeriği */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {children}
            </div>
        </div>
    );
}
