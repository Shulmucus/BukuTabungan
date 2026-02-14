'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/ui/Header';
import { FormSelect, FormInput } from '@/components/ui/FormField';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate, transactionTypeLabels } from '@/lib/utils';
import { NasabahProfile, Transaction } from '@/lib/types';
import { downloadStatement, printStatement } from '@/lib/pdf-generator';
import { HiOutlineArrowDownTray, HiOutlinePrinter } from 'react-icons/hi2';

export default function PetugasMutasiPage() {
    const [nasabahList, setNasabahList] = useState<NasabahProfile[]>([]);
    const [selectedNasabah, setSelectedNasabah] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        fetch('/api/nasabah?pageSize=200')
            .then((r) => r.json())
            .then((json) => { if (json.success) setNasabahList(json.data || []); });
    }, []);

    const handleSearch = async () => {
        if (!selectedNasabah || !dateFrom || !dateTo) return;
        setLoading(true);
        setSearched(true);

        try {
            const params = new URLSearchParams({
                nasabah_id: selectedNasabah,
                date_from: dateFrom,
                date_to: dateTo,
                pageSize: '500',
            });
            const res = await fetch(`/api/transactions?${params}`);
            const json = await res.json();
            if (json.success) {
                setTransactions(json.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getNasabah = () => nasabahList.find((n) => n.id === selectedNasabah);

    const handleDownload = () => {
        const nasabah = getNasabah();
        if (!nasabah) return;

        const sortedTx = [...transactions].sort(
            (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime(),
        );

        downloadStatement({
            accountNumber: nasabah.account_number,
            customerName: nasabah.user?.full_name || '',
            dateFrom,
            dateTo,
            transactions: sortedTx,
            openingBalance: sortedTx.length > 0 ? Number(sortedTx[0].balance_before) : Number(nasabah.balance),
            closingBalance: sortedTx.length > 0 ? Number(sortedTx[sortedTx.length - 1].balance_after) : Number(nasabah.balance),
        });
    };

    const handlePrint = () => {
        const nasabah = getNasabah();
        if (!nasabah) return;

        const sortedTx = [...transactions].sort(
            (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime(),
        );

        printStatement({
            accountNumber: nasabah.account_number,
            customerName: nasabah.user?.full_name || '',
            dateFrom,
            dateTo,
            transactions: sortedTx,
            openingBalance: sortedTx.length > 0 ? Number(sortedTx[0].balance_before) : Number(nasabah.balance),
            closingBalance: sortedTx.length > 0 ? Number(sortedTx[sortedTx.length - 1].balance_after) : Number(nasabah.balance),
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
                if (row.transaction_type === 'deposit' || row.transaction_type === 'transfer_in') {
                    return <span className="text-success-600 font-semibold">{formatCurrency(Number(row.amount))}</span>;
                }
                return '-';
            }
        },
        {
            key: 'debit', header: 'Debit', render: (row: any) => {
                if (row.transaction_type === 'withdrawal' || row.transaction_type === 'transfer_out') {
                    return <span className="text-danger-600 font-semibold">{formatCurrency(Number(row.amount))}</span>;
                }
                return '-';
            }
        },
        { key: 'balance_after', header: 'Saldo', render: (row: any) => formatCurrency(Number(row.balance_after)) },
        { key: 'description', header: 'Keterangan', render: (row: any) => <span className="text-surface-500">{row.description || '-'}</span> },
    ];
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return (
        <div>
            <Header title="Cetak Mutasi" subtitle="Generate dan cetak laporan mutasi rekening nasabah" />

            <div className="glass-card p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <FormSelect
                        label="Nasabah"
                        value={selectedNasabah}
                        onChange={(e) => setSelectedNasabah(e.target.value)}
                        placeholder="Pilih nasabah"
                        options={nasabahList.map((n) => ({
                            value: n.id,
                            label: `${n.account_number} — ${n.user?.full_name || ''}`,
                        }))}
                    />
                    <FormInput label="Dari Tanggal" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <FormInput label="Sampai Tanggal" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <button
                        onClick={handleSearch}
                        disabled={!selectedNasabah || !dateFrom || !dateTo || loading}
                        className="px-6 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? <LoadingSpinner size="sm" /> : 'Tampilkan'}
                    </button>
                </div>
            </div>

            {searched && (
                <>
                    {/* Summary bar */}
                    {transactions.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <p className="text-sm text-surface-500">
                                Ditemukan <strong>{transactions.length}</strong> transaksi
                            </p>
                            <div className="flex gap-2">
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
