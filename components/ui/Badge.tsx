'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent';

const variantStyles: Record<Variant, string> = {
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    neutral: 'bg-surface-100 text-surface-700',
    accent: 'bg-teal-100 text-teal-800',
};

interface BadgeProps {
    children: ReactNode;
    variant?: Variant;
    className?: string;
    dot?: boolean;
}

export function Badge({ children, variant = 'neutral', className, dot }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                variantStyles[variant],
                className,
            )}
        >
            {dot && (
                <span
                    className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        variant === 'success' && 'bg-green-500',
                        variant === 'danger' && 'bg-red-500',
                        variant === 'warning' && 'bg-amber-500',
                        variant === 'primary' && 'bg-primary-500',
                        variant === 'neutral' && 'bg-surface-400',
                        variant === 'accent' && 'bg-teal-500',
                    )}
                />
            )}
            {children}
        </span>
    );
}
