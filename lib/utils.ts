import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

/**
 * Merge class names, filtering out falsy values.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}

/**
 * Format a number as Indonesian Rupiah.
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format a number as compact Indonesian Rupiah (e.g., 1JT, 1M).
 */
export function formatCompactCurrency(amount: number): string {
    const absAmount = Math.abs(amount);

    const format = (num: number, suffix: string) => {
        const formatted = (num).toFixed(2).replace(/\.?0+$/, '');
        return `Rp ${formatted}${suffix}`;
    };

    if (absAmount >= 1_000_000_000_000) {
        return format(amount / 1_000_000_000_000, 'T');
    }
    if (absAmount >= 1_000_000_000) {
        return format(amount / 1_000_000_000, 'M');
    }
    if (absAmount >= 1_000_000) {
        return format(amount / 1_000_000, 'JT');
    }
    if (absAmount >= 1_000) {
        return format(amount / 1_000, 'RB');
    }

    return formatCurrency(amount);
}

/**
 * Format an ISO date string for display.
 */
export function formatDate(dateStr: string, fmt: string = 'dd MMM yyyy'): string {
    try {
        return format(parseISO(dateStr), fmt, { locale: localeId });
    } catch {
        return dateStr;
    }
}

/**
 * Format date-time for display.
 */
export function formatDateTime(dateStr: string): string {
    return formatDate(dateStr, 'dd MMM yyyy, HH:mm');
}

/**
 * Generate a random 10-digit account number.
 */
export function generateAccountNumber(): string {
    const prefix = '10';
    const random = Math.floor(Math.random() * 100_000_000)
        .toString()
        .padStart(8, '0');
    return prefix + random;
}

/**
 * Truncate a string for table display.
 */
export function truncate(str: string, maxLen: number = 40): string {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen) + '…';
}

/**
 * Get initials from a full name.
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Transaction type display labels.
 */
export const transactionTypeLabels: Record<string, string> = {
    deposit: 'Setoran',
    withdrawal: 'Penarikan',
    transfer_in: 'Transfer Masuk',
    transfer_out: 'Transfer Keluar',
};

/**
 * Role display labels.
 */
export const roleLabels: Record<string, string> = {
    admin: 'Admin',
    petugas: 'Petugas',
    nasabah: 'Nasabah',
};
