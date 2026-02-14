'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    color?: string;
}

const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
};

export function LoadingSpinner({ size = 'md', className, color }: LoadingSpinnerProps) {
    return (
        <div
            className={cn(
                'rounded-full border-surface-200 border-t-primary-600 animate-spin',
                sizeMap[size],
                color ? `border-t-current ${color}` : '', // Use text color utilities if color prop provided
                className,
            )}
        />
    );
}

export function PageLoader() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <p className="text-sm text-surface-500">Memuat data...</p>
            </div>
        </div>
    );
}
