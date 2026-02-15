'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, useState } from 'react';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';

interface BaseProps {
    label?: string;
    error?: string;
    hint?: string;
    labelClassName?: string;
}

// ---- Text Input ----
type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;

export const FormInput = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, className, labelClassName, type, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';

        return (
            <div className="space-y-1.5">
                {label && (
                    <label className={cn("block text-sm font-medium text-surface-700", labelClassName)}>
                        {label}
                        {props.required && <span className="text-danger-500 ml-0.5">*</span>}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        type={isPassword ? (showPassword ? 'text' : 'password') : type}
                        className={cn(
                            'w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all duration-200',
                            'bg-white placeholder:text-surface-400',
                            'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                            error
                                ? 'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500'
                                : 'border-surface-200 hover:border-surface-300',
                            isPassword && 'pr-11',
                            className,
                        )}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 focus:outline-none p-1"
                        >
                            {showPassword ? (
                                <HiOutlineEyeSlash className="w-5 h-5" />
                            ) : (
                                <HiOutlineEye className="w-5 h-5" />
                            )}
                        </button>
                    )}
                </div>
                {error && <p className="text-xs text-danger-500">{error}</p>}
                {hint && !error && <p className="text-xs text-surface-400">{hint}</p>}
            </div>
        );
    },
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

// ---- Currency Input ----
interface CurrencyInputProps extends Omit<InputProps, 'onChange' | 'value'> {
    value: string;
    onChange: (value: string) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ label, value, onChange, error, hint, className, ...props }, ref) => {
        const formatValue = (val: string) => {
            if (!val) return '';
            const num = val.replace(/\D/g, '');
            return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value.replace(/\D/g, '');
            onChange(rawValue);
        };

        return (
            <FormInput
                {...props}
                ref={ref}
                label={label}
                error={error}
                hint={hint}
                className={className}
                value={formatValue(value)}
                onChange={handleChange}
                placeholder={props.placeholder || '0'}
            />
        );
    },
);
CurrencyInput.displayName = 'CurrencyInput';
