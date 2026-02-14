'use client';

import { cn } from '@/lib/utils';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { LoadingSpinner } from './LoadingSpinner';

interface PinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (pin: string) => Promise<boolean>;
    title?: string;
    description?: string;
}

export function PinModal({
    isOpen,
    onClose,
    onVerify,
    title = 'Verifikasi PIN',
    description = 'Masukkan PIN 6 digit untuk melanjutkan transaksi',
}: PinModalProps) {
    const [pin, setPin] = useState<string[]>(Array(6).fill(''));
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const resetPin = useCallback(() => {
        setPin(Array(6).fill(''));
        setError('');
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            resetPin();
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [isOpen, resetPin]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);
        setError('');

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            setPin(pastedData.split(''));
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = async () => {
        const fullPin = pin.join('');
        if (fullPin.length !== 6) {
            setError('Masukkan 6 digit PIN');
            return;
        }

        setLoading(true);
        try {
            const success = await onVerify(fullPin);
            if (!success) {
                setError('PIN salah. Silakan coba lagi.');
                setPin(Array(6).fill(''));
                inputRefs.current[0]?.focus();
            }
        } catch {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const isPinComplete = pin.every((d) => d !== '');

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <div className="text-center">
                {/* Lock icon */}
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                <h3 className="text-lg font-semibold text-surface-900 mb-1">{title}</h3>
                <p className="text-sm text-surface-500 mb-6">{description}</p>

                {/* PIN inputs */}
                <div className="flex gap-2.5 justify-center mb-4" onPaste={handlePaste}>
                    {pin.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="password"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className={cn(
                                'w-11 h-13 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200',
                                'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                                error ? 'border-danger-300 bg-danger-50' : 'border-surface-200 bg-surface-50',
                                digit && 'border-primary-300 bg-primary-50',
                            )}
                            disabled={loading}
                        />
                    ))}
                </div>

                {error && (
                    <p className="text-sm text-danger-500 mb-4 animate-fade-in">{error}</p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={!isPinComplete || loading}
                    className={cn(
                        'w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                        isPinComplete && !loading
                            ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25'
                            : 'bg-surface-100 text-surface-400 cursor-not-allowed',
                    )}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <LoadingSpinner size="sm" />
                            Memverifikasi...
                        </span>
                    ) : (
                        'Verifikasi'
                    )}
                </button>
            </div>
        </Modal>
    );
}
