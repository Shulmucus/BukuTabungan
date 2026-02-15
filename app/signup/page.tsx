'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormInput } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { validatePassword } from '@/lib/validation';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        phone_number: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // 1. Validate Form
        if (form.password !== form.confirmPassword) {
            setError('Password konfirmasi tidak cocok');
            setLoading(false);
            return;
        }

        const passwordValidation = validatePassword(form.password);
        if (!passwordValidation.isValid) {
            setError(passwordValidation.error || 'Password tidak memenuhi syarat');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    username: form.username,
                    password: form.password,
                    full_name: form.full_name,
                    phone_number: form.phone_number,
                    role: 'nasabah'
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Redirect to setup-pin for nasabah
                router.push('/setup-pin');
            } else {
                setError(data.error || 'Gagal mendaftar');
            }
        } catch (err) {
            console.error('Signup error:', err);
            setError('Terjadi kesalahan koneksi atau server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-hero flex items-center justify-center p-4 py-12">
            <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Buat Akun Baru</h1>
                    <p className="text-white/80">Bergabung dengan Buku Tabungan</p>
                </div>

                <div className="p-8 shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <FormInput
                                label="Nama Lengkap"
                                required
                                placeholder="Jhon Doe"
                                value={form.full_name}
                                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/50"
                                labelClassName="text-white/80"
                            />
                            <FormInput
                                label="Username"
                                required
                                placeholder="jhon.doe"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/50"
                                labelClassName="text-white/80"
                            />
                            <FormInput
                                label="Email"
                                type="email"
                                required
                                placeholder="name@example.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/50"
                                labelClassName="text-white/80"
                            />
                            <FormInput
                                label="Password"
                                type="password"
                                required
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/50"
                                labelClassName="text-white/80"
                                hint="Min. 8 karakter, ada angka, huruf besar & kecil"
                            />
                            <FormInput
                                label="Konfirmasi Password"
                                type="password"
                                required
                                placeholder="••••••••"
                                value={form.confirmPassword}
                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/50"
                                labelClassName="text-white/80"
                            />
                            <FormInput
                                label="No. Telepon (Opsional)"
                                type="tel"
                                placeholder="0812..."
                                value={form.phone_number}
                                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/50 focus:ring-white/50"
                                labelClassName="text-white/80"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-primary-900 bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-900 focus:ring-white transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading ? <LoadingSpinner size="sm" color="text-primary-900" /> : 'Daftar Sekarang'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-white/60">
                            Sudah punya akun?{' '}
                            <Link href="/login" className="font-medium text-white hover:text-white/80 hover:underline transition-all">
                                Login di sini
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
