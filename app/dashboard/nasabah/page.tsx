'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/ui/Header';
import { StatCard, Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, transactionTypeLabels } from '@/lib/utils';
import { NasabahProfile, Transaction } from '@/lib/types';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import {
    HiOutlineBanknotes,
    HiOutlineCreditCard,
    HiOutlineClock,
} from 'react-icons/hi2';

export default function NasabahDashboard() {
    const [profile, setProfile] = useState<NasabahProfile | null>(null);
    const [recentTx, setRecentTx] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [profileRes, txRes] = await Promise.all([
                    fetch('/api/nasabah/me'),
                    fetch('/api/nasabah/me/transactions?pageSize=5'),
                ]);
                const profileData = await profileRes.json();
                const txData = await txRes.json();

                if (profileData.success) setProfile(profileData.data);
                if (txData.success) setRecentTx(txData.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <PageLoader />;

    return (
        <div>
            <Header title="Dashboard Nasabah" subtitle="Selamat datang kembali" />

            {/* Balance card */}
            <div className="mb-8 animate-fade-in">
                <div className="bg-gradient-primary rounded-2xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

                    <div className="relative">
                        <p className="text-sm text-white/60 mb-1">Saldo Anda</p>
                        <p className="text-4xl font-bold mb-4">
                            {formatCurrency(Number(profile?.balance || 0))}
                        </p>
                        <div className="flex gap-6 text-sm">
                            <div>
                                <p className="text-white/50">No. Rekening</p>
                                <p className="font-mono font-semibold">{profile?.account_number}</p>
                            </div>
                            <div>
                                <p className="text-white/50">Nama</p>
                                <p className="font-semibold">{profile?.user?.full_name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="animate-fade-in animate-delay-1">
                    <StatCard
                        title="Saldo"
                        value={formatCurrency(Number(profile?.balance || 0))}
                        icon={<HiOutlineBanknotes />}
                        color="success"
                    />
                </div>
                <div className="animate-fade-in animate-delay-2">
                    <StatCard
                        title="No. Rekening"
                        value={profile?.account_number || '-'}
                        icon={<HiOutlineCreditCard />}
                        color="primary"
                    />
                </div>
                <div className="animate-fade-in animate-delay-3">
                    <StatCard
                        title="Transaksi Terakhir"
                        value={recentTx.length}
                        icon={<HiOutlineClock />}
                        color="accent"
                    />
                </div>
            </div>

            {/* Recent transactions */}
            <Card className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-surface-900">Transaksi Terakhir</h3>
                    <a
                        href="/dashboard/nasabah/transactions"
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Lihat Semua →
                    </a>
                </div>

                {recentTx.length === 0 ? (
                    <p className="text-sm text-surface-400 py-8 text-center">Belum ada transaksi</p>
                ) : (
                    <div className="space-y-3">
                        {recentTx.map((tx) => {
                            const isCredit = tx.transaction_type === 'deposit' || tx.transaction_type === 'transfer_in';
                            return (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {isCredit ? '+' : '-'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-surface-900">
                                                <Badge variant={isCredit ? 'success' : 'danger'} className="text-[10px]">
                                                    {transactionTypeLabels[tx.transaction_type]}
                                                </Badge>
                                            </p>
                                            <p className="text-xs text-surface-400">{formatDate(tx.transaction_date)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-semibold ${isCredit ? 'text-success-600' : 'text-danger-600'}`}>
                                            {isCredit ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                                        </p>
                                        <p className="text-xs text-surface-400">Saldo: {formatCurrency(Number(tx.balance_after))}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}
