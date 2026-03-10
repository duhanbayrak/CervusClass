import { z } from 'zod';

/**
 * Tek bir hizmet kalemi için Zod şeması.
 * Step3Financial ve BulkFeeAssignmentDialog paylaşır.
 */
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
        ctx.addIssue({ code: 'custom', message: 'Kasa/Hesap seçilmelidir', path: ['downPaymentAccountId'] });
    }
    if (data.downPayment > totalWithVat) {
        ctx.addIssue({
            code: 'custom',
            message: `Peşinat KDV dahil net tutardan (₺${totalWithVat.toFixed(2)}) büyük olamaz`,
            path: ['downPayment'],
        });
    }
});

export type ServiceItemValues = z.infer<typeof serviceItemSchema>;

/** useFieldArray.append için boş servis kalemi varsayılanı */
export const emptyServiceItem: ServiceItemValues = {
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
    paymentDueDay: 5,
};

interface ServicePriceInputs {
    unitPrice: unknown;
    discountAmount: unknown;
    discountType: unknown;
    vatRate: unknown;
}

/** Servis kaleminin anlık fiyat hesaplamalarını döner */
export function computeServiceItemPrices(item: ServicePriceInputs) {
    const p = Number(item.unitPrice) || 0;
    const d = Number(item.discountAmount) || 0;
    const net = item.discountType === 'percentage' ? p - (p * (d / 100)) : p - d;
    const vat = net * ((Number(item.vatRate) || 0) / 100);
    const finalPrice = net + vat;
    return { p, d, net, vat, finalPrice };
}
