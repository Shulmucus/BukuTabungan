'use client';

import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import {
    HiOutlineClock,
    HiOutlinePrinter,
} from 'react-icons/hi2';
import { useRouter } from 'next/navigation';

export default function PetugasDashboard() {
    const router = useRouter();

    return (
        <div>
            <Header title="Dashboard Petugas" subtitle="Selamat datang di panel petugas" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card hover onClick={() => router.push('/dashboard/petugas/transactions')} className="animate-fade-in animate-delay-1">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white">
                            <HiOutlineClock className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-surface-900">Histori Transaksi</h3>
                            <p className="text-sm text-surface-500">Lihat semua histori transaksi nasabah</p>
                        </div>
                    </div>
                </Card>

                <Card hover onClick={() => router.push('/dashboard/petugas/mutasi')} className="animate-fade-in animate-delay-2">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white">
                            <HiOutlinePrinter className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-surface-900">Cetak Mutasi</h3>
                            <p className="text-sm text-surface-500">Generate dan cetak laporan mutasi rekening</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
