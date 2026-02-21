import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subMonths,
    startOfYear,
    endOfYear,
    format,
    formatISO,
} from 'date-fns';

export function getDateRange(period: string) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
        case 'daily':
            startDate = startOfDay(now);
            endDate = endOfDay(now);
            break;
        case 'weekly':
            startDate = startOfWeek(now, { weekStartsOn: 1 });
            endDate = endOfWeek(now, { weekStartsOn: 1 });
            break;
        case 'monthly':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
        case 'last_month':
            const lastMonth = subMonths(now, 1);
            startDate = startOfMonth(lastMonth);
            endDate = endOfMonth(lastMonth);
            break;
        case 'yearly':
        default:
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
    }

    return {
        startDate: formatISO(startDate),
        endDate: formatISO(endDate),
    };
}
