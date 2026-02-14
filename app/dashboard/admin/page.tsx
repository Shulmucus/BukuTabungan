'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/ui/Header';
import { StatCard } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import {
    HiOutlineUsers,
    HiOutlineBanknotes,
    HiOutlineArrowsRightLeft,
    HiOutlineChartBar,
} from 'react-icons/hi2';

interface Stats {
    totalNasabah: number;
    totalBalance: number;
    todayTransactions: number;
    totalTransfers: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalNasabah: 0,
        totalBalance: 0,
        todayTransactions: 0,
        totalTransfers: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [nasabahRes, txRes, transferRes] = await Promise.all([
                    fetch('/api/nasabah?pageSize=1'),
                    fetch('/api/transactions?pageSize=1'),
                    fetch('/api/transfers?pageSize=1'),
                ]);

                const nasabahData = await nasabahRes.json();
                const txData = await txRes.json();
                const transferData = await transferRes.json();

                // Fetch all nasabah for total balance
                const allNasabahRes = await fetch(`/api/nasabah?pageSize=${nasabahData.total || 100}`);
                const allNasabah = await allNasabahRes.json();
                const totalBalance = (allNasabah.data || []).reduce(
                    (sum: number, n: { balance: number }) => sum + Number(n.balance),
                    0,
                );

                setStats({
                    totalNasabah: nasabahData.total || 0,
                    totalBalance,
                    todayTransactions: txData.total || 0,
                    totalTransfers: transferData.total || 0,
                });
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    return (
        <div>
            <Header title="Dashboard Admin" subtitle="Selamat datang di panel administrasi" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="animate-fade-in animate-delay-1">
                    <StatCard
                        title="Total Nasabah"
                        value={loading ? '...' : stats.totalNasabah}
                        icon={<HiOutlineUsers />}
                        color="primary"
                    />
                </div>
                <div className="animate-fade-in animate-delay-2">
                    <StatCard
                        title="Total Saldo"
                        value={loading ? '...' : formatCurrency(stats.totalBalance)}
                        icon={<HiOutlineBanknotes />}
                        color="success"
                    />
                </div>
                <div className="animate-fade-in animate-delay-3">
                    <StatCard
                        title="Total Transaksi"
                        value={loading ? '...' : stats.todayTransactions}
                        icon={<HiOutlineChartBar />}
                        color="accent"
                    />
                </div>
                <div className="animate-fade-in animate-delay-4">
                    <StatCard
                        title="Total Transfer"
                        value={loading ? '...' : stats.totalTransfers}
                        icon={<HiOutlineArrowsRightLeft />}
                        color="warning"
                    />
                </div>
            </div>

            {/* Quick info cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 animate-fade-in">
                    <h3 className="text-lg font-semibold text-surface-900 mb-4">Aksi Cepat</h3>
                    <div className="space-y-3">
                        <a
                            href="/dashboard/admin/nasabah"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 group-hover:bg-primary-200 transition-colors">
                                <HiOutlineUsers className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-surface-900">Kelola Nasabah</p>
                                <p className="text-xs text-surface-500">Tambah, edit, atau hapus data nasabah</p>
                            </div>
                        </a>
                        <a
                            href="/dashboard/admin/transactions"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-200 transition-colors">
                                <HiOutlineBanknotes className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-surface-900">Transaksi Baru</p>
                                <p className="text-xs text-surface-500">Buat setoran atau penarikan</p>
                            </div>
                        </a>
                        <a
                            href="/dashboard/admin/transfers"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-200 transition-colors">
                                <HiOutlineArrowsRightLeft className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-surface-900">Transfer Dana</p>
                                <p className="text-xs text-surface-500">Transfer antar rekening nasabah</p>
                            </div>
                        </a>
                    </div>
                </div>

                <div className="glass-card p-6 animate-fade-in">
                    <h3 className="text-lg font-semibold text-surface-900 mb-4">Informasi Sistem</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-surface-100">
                            <span className="text-sm text-surface-500">Versi Aplikasi</span>
                            <span className="text-sm font-medium text-surface-900">1.0.0</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-surface-100">
                            <span className="text-sm text-surface-500">Status Server</span>
                            <span className="flex items-center gap-1.5 text-sm font-medium text-success-600">
                                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                                Online
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-surface-500">Database</span>
                            <span className="text-sm font-medium text-surface-900">Supabase</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
