'use client';

import { formatDate } from '@/lib/utils';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
    const today = new Date().toISOString();

    return (
        <header className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">{title}</h1>
                    {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
                </div>
                <p className="text-xs text-surface-400">{formatDate(today, 'EEEE, dd MMMM yyyy')}</p>
            </div>
        </header>
    );
}
