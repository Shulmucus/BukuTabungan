'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { HiCheckCircle, HiLockClosed } from 'react-icons/hi2';

export default function SetupPinPage() {
    const router = useRouter();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
        setter(val);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (pin.length !== 6) {
            setError('PIN harus 6 digit angka');
            return;
        }
        if (pin !== confirmPin) {
            setError('Konfirmasi PIN tidak cocok');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/nasabah/setup-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin }),
            });
            const data = await res.json();

            if (data.success) {
                router.push('/dashboard/nasabah');
            } else {
                setError(data.error || 'Gagal menyimpan PIN');
            }
        } catch {
            setError('Terjadi kesalahan koneksi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-hero flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
                        <HiLockClosed className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Atur PIN Keamanan</h1>
                    <p className="text-white/80">Buat PIN 6 digit untuk transaksi Anda</p>
                </div>

                <div className="p-8 shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/90 mb-1.5">PIN Baru (6 Digit)</label>
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={(e) => handlePinChange(e, setPin)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all text-center tracking-[0.5em] text-lg font-bold"
                                    placeholder="••••••"
                                    maxLength={6}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/90 mb-1.5">Konfirmasi PIN</label>
                                <input
                                    type="password"
                                    value={confirmPin}
                                    onChange={(e) => handlePinChange(e, setConfirmPin)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all text-center tracking-[0.5em] text-lg font-bold"
                                    placeholder="••••••"
                                    maxLength={6}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || pin.length !== 6 || confirmPin.length !== 6}
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-primary-900 bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-900 focus:ring-white transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading ? <LoadingSpinner size="sm" color="text-primary-900" /> : (
                                <>
                                    <HiCheckCircle className="w-5 h-5" />
                                    Simpan PIN
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
