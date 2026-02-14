'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormInput } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PinModal } from '@/components/ui/PinModal';
import Link from 'next/link';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);
    const [tempUserId, setTempUserId] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password }),
            });
            const data = await res.json();

            if (data.success) {
                if (data.redirect) {
                    router.push(data.redirect);
                    return;
                }

                if (data.role === 'nasabah') {
                    setTempUserId(data.userId);
                    setShowPinModal(true);
                    setLoading(false);
                } else {
                    router.push(data.role === 'admin' ? '/dashboard/admin' : '/dashboard/petugas');
                }
            } else {
                setError(data.error || 'Login gagal');
                setLoading(false);
            }
        } catch {
            setError('Terjadi kesalahan koneksi');
            setLoading(false);
        }
    };

    const handlePinVerify = async (pin: string) => {
        const res = await fetch('/api/verify-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nasabahId: tempUserId, pin, isLogin: true }),
        });
        const data = await res.json();

        if (data.success) {
            router.push('/dashboard/nasabah');
            return true;
        } else {
            return false;
        }
    };

    return (
        <>
            <div className="p-8 shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl">
                {registered && (
                    <div className="mb-6 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200 text-sm text-center">
                        Akun berhasil dibuat! Silakan login.
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <FormInput
                            label="Username atau Email"
                            required
                            placeholder="user@example.com"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/50"
                            labelClassName="text-white/80"
                        />
                        <FormInput
                            label="Password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/50"
                            labelClassName="text-white/80"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-primary-900 bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-900 focus:ring-white transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                    >
                        {loading ? <LoadingSpinner size="sm" color="text-primary-900" /> : 'Masuk'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-white/60">
                        Belum punya akun?{' '}
                        <Link href="/signup" className="font-medium text-white hover:text-white/80 hover:underline transition-all">
                            Daftar Sekarang
                        </Link>
                    </p>
                </div>
            </div>

            <PinModal
                isOpen={showPinModal}
                title="Verifikasi Keamanan"
                description="Masukkan PIN 6-digit Anda untuk melanjutkan"
                onClose={() => window.location.reload()}
                onVerify={handlePinVerify}
            />
        </>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full bg-gradient-hero flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Selamat Datang</h1>
                    <p className="text-white/80">Login untuk mengakses akun Anda</p>
                </div>

                <Suspense fallback={<div className="text-white text-center">Memuat...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
