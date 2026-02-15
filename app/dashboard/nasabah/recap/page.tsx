'use client';

import { useState, useCallback } from 'react';
import { Header } from '@/components/ui/Header';
import { Card, StatCard } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, transactionTypeLabels } from '@/lib/utils';
import { Transaction } from '@/lib/types';
import { HiOutlineArrowDownTray, HiOutlineBanknotes, HiOutlineArrowUpRight, HiOutlineArrowDownLeft } from 'react-icons/hi2';

export default function NasabahRecapPage() {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({ incoming: 0, outgoing: 0, net: 0 });

    const fetchRecap = useCallback(async () => {
        if (!dateFrom || !dateTo) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/nasabah/me/transactions?date_from=${dateFrom}&date_to=${dateTo}&pageSize=100`);
            const json = await res.json();
            if (json.success) {
                const txs: Transaction[] = json.data || [];
                setData(txs);

                let incoming = 0;
                let outgoing = 0;
                txs.forEach(tx => {
                    const amt = Number(tx.amount);
                    if (tx.transaction_type === 'deposit' || tx.transaction_type === 'transfer_in') {
                        incoming += amt;
                    } else {
                        outgoing += amt;
                    }
                });
                setSummary({ incoming, outgoing, net: incoming - outgoing });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo]);

    const columns = [
        { key: 'transaction_date', header: 'Tanggal', render: (r: any) => formatDate(r.transaction_date) },
        {
            key: 'transaction_type',
            header: 'Jenis',
            render: (r: any) => {
                const isCredit = r.transaction_type === 'deposit' || r.transaction_type === 'transfer_in';
                return (
                    <Badge variant={isCredit ? 'success' : 'danger'}>
                        {transactionTypeLabels[r.transaction_type]}
                    </Badge>
                );
            }
        },
        { key: 'description', header: 'Keterangan' },
        {
            key: 'amount',
            header: 'Nominal',
            className: 'text-right',
            render: (r: any) => {
                const isCredit = r.transaction_type === 'deposit' || r.transaction_type === 'transfer_in';
                return (
                    <span className={isCredit ? 'text-success-600 font-semibold' : 'text-danger-600 font-semibold'}>
                        {isCredit ? '+' : '-'}{formatCurrency(Number(r.amount))}
                    </span>
                );
            }
        },
        { key: 'balance_after', header: 'Saldo Akhir', className: 'text-right', render: (r: any) => formatCurrency(Number(r.balance_after)) },
    ];

    return (
        <div className="space-y-6">
            <Header
                title="Rekap Transaksi"
                subtitle="Lihat ringkasan aktivitas tabungan Anda"
            />

            <Card className="p-6">
                <div className="flex flex-col md:flex-row items-end gap-4">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium text-surface-700">Dari Tanggal</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium text-surface-700">Sampai Tanggal</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-surface-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={fetchRecap}
                        disabled={loading || !dateFrom || !dateTo}
                        className="px-8 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/25 flex items-center gap-2"
                    >
                        {loading ? 'Memuat...' : 'Tampilkan Recap'}
                    </button>
                </div>
            </Card>

            {data.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                        <StatCard
                            title="Total Pasukan (In)"
                            value={formatCurrency(summary.incoming)}
                            icon={<HiOutlineArrowDownLeft />}
                            color="success"
                        />
                        <StatCard
                            title="Total Pengeluaran (Out)"
                            value={formatCurrency(summary.outgoing)}
                            icon={<HiOutlineArrowUpRight />}
                            color="danger"
                        />
                        <StatCard
                            title="Selisih (Net)"
                            value={formatCurrency(summary.net)}
                            icon={<HiOutlineBanknotes />}
                            color="primary"
                        />
                    </div>

                    <Card className="animate-fade-in">
                        <div className="p-6 border-b border-surface-100">
                            <h3 className="text-lg font-semibold text-surface-900">Detail Transaksi</h3>
                        </div>
                        <DataTable
                            columns={columns}
                            data={data as any[]}
                            keyExtractor={(r: any) => r.id}
                        />
                    </Card>

                    <div className="flex justify-end">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl border border-surface-200 text-surface-600 hover:bg-surface-50 transition-all font-medium"
                        >
                            <HiOutlineArrowDownTray className="w-4 h-4" />
                            Cetak Laporan
                        </button>
                    </div>
                </>
            )}

            {data.length === 0 && !loading && dateFrom && dateTo && (
                <div className="py-12 text-center text-surface-400">
                    Tidak ada transaksi pada periode ini.
                </div>
            )}
        </div>
    );
}
