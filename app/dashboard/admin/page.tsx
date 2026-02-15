'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/ui/Header';
import { StatCard } from '@/components/ui/Card';
import { formatCompactCurrency } from '@/lib/utils';
import {
    HiOutlineUsers,
    HiOutlineBanknotes,
    HiOutlineArrowsRightLeft,
    HiOutlineChartBar,
} from 'react-icons/hi2';

interface Stats {
    totalNasabah: number;
    totalPetugas: number;
    totalBalance: number;
    todayTransactions: number;
    totalTransfers: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalNasabah: 0,
        totalPetugas: 0,
        totalBalance: 0,
        todayTransactions: 0,
        totalTransfers: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats');
                const json = await res.json();
                if (json.success) {
                    setStats({
                        totalNasabah: json.totalNasabah,
                        totalPetugas: json.totalPetugas,
                        totalBalance: json.totalBalance,
                        todayTransactions: json.todayTransactions,
                        totalTransfers: json.totalTransfers,
                    });
                }
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
                        title="Total Petugas"
                        value={loading ? '...' : stats.totalPetugas}
                        icon={<HiOutlineUsers />}
                        color="primary"
                    />
                </div>
                <div className="animate-fade-in animate-delay-3">
                    <StatCard
                        title="Total Saldo"
                        value={loading ? '...' : formatCompactCurrency(stats.totalBalance)}
                        icon={<HiOutlineBanknotes />}
                        color="success"
                    />
                </div>
                <div className="animate-fade-in animate-delay-4">
                    <StatCard
                        title="Total Transaksi"
                        value={loading ? '...' : stats.todayTransactions}
                        icon={<HiOutlineChartBar />}
                        color="accent"
                    />
                </div>
                <div className="animate-fade-in animate-delay-5">
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
                            href="/dashboard/admin/users"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-200 transition-colors">
                                <HiOutlineUsers className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-surface-900">Kelola Petugas</p>
                                <p className="text-xs text-surface-500">Atur akses dan reset password petugas</p>
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
