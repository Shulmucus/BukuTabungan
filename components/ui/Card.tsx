'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    hover?: boolean;
}

export function Card({ children, className, onClick, hover }: CardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'glass-card p-6 transition-all duration-300',
                hover && 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5',
                className,
            )}
        >
            {children}
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: { value: number; label: string };
    color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
    className?: string;
}

const colorMap = {
    primary: 'from-primary-500 to-primary-700',
    accent: 'from-accent-500 to-accent-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    danger: 'from-danger-500 to-danger-600',
};

export function StatCard({ title, value, icon, trend, color = 'primary', className }: StatCardProps) {
    return (
        <Card className={cn('relative overflow-hidden', className)}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-surface-500 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-surface-900">{value}</p>
                    {trend && (
                        <p
                            className={cn(
                                'text-xs font-medium mt-2',
                                trend.value >= 0 ? 'text-success-600' : 'text-danger-600',
                            )}
                        >
                            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
                        </p>
                    )}
                </div>
                <div
                    className={cn(
                        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-xl',
                        colorMap[color],
                    )}
                >
                    {icon}
                </div>
            </div>
            {/* Decorative circle */}
            <div
                className={cn(
                    'absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 bg-gradient-to-br',
                    colorMap[color],
                )}
            />
        </Card>
    );
}
