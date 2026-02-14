'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/ui/Header';
import { FormInput, FormSelect } from '@/components/ui/FormField';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate, transactionTypeLabels } from '@/lib/utils';
import { NasabahProfile, Transaction } from '@/lib/types';
import { downloadStatement, printStatement } from '@/lib/pdf-generator';
import {
    HiOutlineArrowDownTray,
    HiOutlinePrinter,
    HiOutlineArrowTrendingUp,
    HiOutlineArrowTrendingDown,
    HiOutlineBanknotes,
} from 'react-icons/hi2';

export default function NasabahRecapPage() {
    const [profile, setProfile] = useState<NasabahProfile | null>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [type, setType] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        fetch('/api/nasabah/me').then((r) => r.json()).then((json) => {
            if (json.success) setProfile(json.data);
        });
    }, []);

    const handleSearch = async () => {
        if (!dateFrom || !dateTo) return;
        setLoading(true);
        setSearched(true);

        try {
            const params = new URLSearchParams({
                date_from: dateFrom,
                date_to: dateTo,
                pageSize: '500',
            });
            if (type) params.set('type', type);

            const res = await fetch(`/api/nasabah/me/transactions?${params}`);
            const json = await res.json();
            if (json.success) setTransactions(json.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Compute summary
    const totalDeposit = transactions
        .filter((t) => t.transaction_type === 'deposit' || t.transaction_type === 'transfer_in')
        .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalWithdrawal = transactions
        .filter((t) => t.transaction_type === 'withdrawal' || t.transaction_type === 'transfer_out')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const handleDownload = () => {
        if (!profile) return;
        const sortedTx = [...transactions].sort(
            (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime(),
        );
        downloadStatement({
            accountNumber: profile.account_number,
            customerName: profile.user?.full_name || '',
            dateFrom,
            dateTo,
            transactions: sortedTx,
            openingBalance: sortedTx.length > 0 ? Number(sortedTx[0].balance_before) : Number(profile.balance),
            closingBalance: sortedTx.length > 0 ? Number(sortedTx[sortedTx.length - 1].balance_after) : Number(profile.balance),
        });
    };

    const handlePrint = () => {
        if (!profile) return;
        const sortedTx = [...transactions].sort(
            (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime(),
        );
        printStatement({
            accountNumber: profile.account_number,
            customerName: profile.user?.full_name || '',
            dateFrom,
            dateTo,
            transactions: sortedTx,
            openingBalance: sortedTx.length > 0 ? Number(sortedTx[0].balance_before) : Number(profile.balance),
            closingBalance: sortedTx.length > 0 ? Number(sortedTx[sortedTx.length - 1].balance_after) : Number(profile.balance),
        });
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const columns = [
        { key: 'transaction_date', header: 'Tanggal', render: (row: any) => formatDate(row.transaction_date) },
        {
            key: 'transaction_type', header: 'Jenis', render: (row: any) => {
                const v = row.transaction_type.includes('deposit') || row.transaction_type.includes('transfer_in') ? 'success' : 'danger';
                return <Badge variant={v}>{transactionTypeLabels[row.transaction_type]}</Badge>;
            }
        },
        {
            key: 'credit', header: 'Kredit', render: (row: any) => {
                if (row.transaction_type === 'deposit' || row.transaction_type === 'transfer_in')
                    return <span className="text-success-600 font-semibold">{formatCurrency(Number(row.amount))}</span>;
                return '-';
            }
        },
        {
            key: 'debit', header: 'Debit', render: (row: any) => {
                if (row.transaction_type === 'withdrawal' || row.transaction_type === 'transfer_out')
                    return <span className="text-danger-600 font-semibold">{formatCurrency(Number(row.amount))}</span>;
                return '-';
            }
        },
        { key: 'balance_after', header: 'Saldo', render: (row: any) => formatCurrency(Number(row.balance_after)) },
        { key: 'description', header: 'Keterangan', render: (row: any) => <span className="text-surface-500">{row.description || '-'}</span> },
    ];
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return (
        <div>
            <Header title="Rekap Transaksi" subtitle="Ringkasan transaksi berdasarkan periode waktu" />

            <div className="glass-card p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <FormInput label="Dari Tanggal" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <FormInput label="Sampai Tanggal" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <FormSelect
                        label="Jenis"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        options={[
                            { value: '', label: 'Semua' },
                            { value: 'deposit', label: 'Setoran' },
                            { value: 'withdrawal', label: 'Penarikan' },
                            { value: 'transfer_in', label: 'Transfer Masuk' },
                            { value: 'transfer_out', label: 'Transfer Keluar' },
                        ]}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={!dateFrom || !dateTo || loading}
                        className="px-6 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? <LoadingSpinner size="sm" /> : 'Tampilkan'}
                    </button>
                </div>
            </div>

            {searched && (
                <>
                    {/* Summary stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <StatCard
                            title="Total Kredit"
                            value={formatCurrency(totalDeposit)}
                            icon={<HiOutlineArrowTrendingUp />}
                            color="success"
                        />
                        <StatCard
                            title="Total Debit"
                            value={formatCurrency(totalWithdrawal)}
                            icon={<HiOutlineArrowTrendingDown />}
                            color="danger"
                        />
                        <StatCard
                            title="Selisih"
                            value={formatCurrency(totalDeposit - totalWithdrawal)}
                            icon={<HiOutlineBanknotes />}
                            color={totalDeposit >= totalWithdrawal ? 'success' : 'danger'}
                        />
                    </div>

                    {transactions.length > 0 && (
                        <div className="flex justify-end gap-2 mb-4">
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-100 text-surface-700 text-sm font-medium hover:bg-surface-200 transition-colors"
                            >
                                <HiOutlineArrowDownTray className="w-4 h-4" /> Download PDF
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
                            >
                                <HiOutlinePrinter className="w-4 h-4" /> Cetak
                            </button>
                        </div>
                    )}

                    <DataTable
                        columns={columns}
                        data={transactions as any[]}
                        keyExtractor={(row: any) => row.id}
                        loading={loading}
                        emptyMessage="Tidak ada transaksi dalam periode ini"
                        pageSize={20}
                    />
                </>
            )}
        </div>
    );
}
