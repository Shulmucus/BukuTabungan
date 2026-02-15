'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { validatePin } from '@/lib/validation';

export default function SetupPinPage() {
    const router = useRouter();
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Focus first input on mount
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);

        // Move to next input if value is entered
        if (value && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const pinString = pin.join('');

        const pinValidation = validatePin(pinString);
        if (!pinValidation.isValid) {
            setError(pinValidation.error || 'PIN tidak valid');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/setup-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pinString }),
            });

            const data = await res.json();

            if (data.success) {
                router.push('/dashboard/nasabah');
            } else {
                setError(data.error || 'Gagal menyimpan PIN');
            }
        } catch (err) {
            console.error('Setup PIN error:', err);
            setError('Terjadi kesalahan koneksi');
        } finally {
            setLoading(false);
        }
    };

    // Auto submit when last digit is filled
    useEffect(() => {
        if (pin.every(digit => digit !== '') && !loading) {
            handleSubmit();
        }
    }, [pin]);

    return (
        <div className="min-h-screen w-full bg-gradient-hero flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10 text-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Atur PIN Transaksi</h1>
                    <p className="text-white/80">Keamanan ekstra untuk akun tabungan Anda</p>
                </div>

                <div className="p-8 shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl">
                    <p className="text-sm text-white/60 mb-8">
                        Masukkan 6 digit angka yang akan digunakan untuk setiap transaksi
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-center gap-2 sm:gap-4">
                            {pin.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { (inputRefs.current[index] = el) }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border border-white/20 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all"
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || pin.some(d => d === '')}
                            className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-primary-900 bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-900 focus:ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading ? <LoadingSpinner size="sm" color="text-primary-900" /> : 'Simpan PIN'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
