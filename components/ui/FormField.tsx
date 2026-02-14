'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface BaseProps {
    label?: string;
    error?: string;
    hint?: string;
    labelClassName?: string;
}

// ---- Text Input ----
type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;

export const FormInput = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, className, labelClassName, ...props }, ref) => (
        <div className="space-y-1.5">
            {label && (
                <label className={cn("block text-sm font-medium text-surface-700", labelClassName)}>
                    {label}
                    {props.required && <span className="text-danger-500 ml-0.5">*</span>}
                </label>
            )}
            <input
                ref={ref}
                className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all duration-200',
                    'bg-white placeholder:text-surface-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                    error
                        ? 'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500'
                        : 'border-surface-200 hover:border-surface-300',
                    className,
                )}
                {...props}
            />
            {error && <p className="text-xs text-danger-500">{error}</p>}
            {hint && !error && <p className="text-xs text-surface-400">{hint}</p>}
        </div>
    ),
);
FormInput.displayName = 'FormInput';

// ---- Select ----
type SelectProps = BaseProps &
    SelectHTMLAttributes<HTMLSelectElement> & {
        options: { value: string; label: string }[];
        placeholder?: string;
    };

export const FormSelect = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, hint, options, placeholder, className, labelClassName, ...props }, ref) => (
        <div className="space-y-1.5">
            {label && (
                <label className={cn("block text-sm font-medium text-surface-700", labelClassName)}>
                    {label}
                    {props.required && <span className="text-danger-500 ml-0.5">*</span>}
                </label>
            )}
            <select
                ref={ref}
                className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all duration-200',
                    'bg-white appearance-none',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                    error
                        ? 'border-danger-500'
                        : 'border-surface-200 hover:border-surface-300',
                    className,
                )}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-danger-500">{error}</p>}
            {hint && !error && <p className="text-xs text-surface-400">{hint}</p>}
        </div>
    ),
);
FormSelect.displayName = 'FormSelect';

// ---- Textarea ----
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const FormTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, hint, className, labelClassName, ...props }, ref) => (
        <div className="space-y-1.5">
            {label && (
                <label className={cn("block text-sm font-medium text-surface-700", labelClassName)}>
                    {label}
                    {props.required && <span className="text-danger-500 ml-0.5">*</span>}
                </label>
            )}
            <textarea
                ref={ref}
                rows={3}
                className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all duration-200 resize-y',
                    'bg-white placeholder:text-surface-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                    error
                        ? 'border-danger-500'
                        : 'border-surface-200 hover:border-surface-300',
                    className,
                )}
                {...props}
            />
            {error && <p className="text-xs text-danger-500">{error}</p>}
            {hint && !error && <p className="text-xs text-surface-400">{hint}</p>}
        </div>
    ),
);
FormTextarea.displayName = 'FormTextarea';
