'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/ui/Header';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { FormInput, FormSelect } from '@/components/ui/FormField';
import { formatCurrency, formatDate, transactionTypeLabels } from '@/lib/utils';
import { Transaction } from '@/lib/types';

export default function NasabahTransactionsPage() {
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        type: '', date_from: '', date_to: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: '10' });
            if (filters.type) params.set('type', filters.type);
            if (filters.date_from) params.set('date_from', filters.date_from);
            if (filters.date_to) params.set('date_to', filters.date_to);

            const res = await fetch(`/api/nasabah/me/transactions?${params}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data || []);
                setTotal(json.total || 0);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [page, filters]);

    useEffect(() => { fetchData(); }, [fetchData]);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const columns = [
        { key: 'transaction_date', header: 'Tanggal', sortable: true, render: (row: any) => formatDate(row.transaction_date) },
        {
            key: 'transaction_type', header: 'Jenis', render: (row: any) => {
                const v = row.transaction_type.includes('deposit') || row.transaction_type.includes('transfer_in') ? 'success' : 'danger';
                return <Badge variant={v}>{transactionTypeLabels[row.transaction_type]}</Badge>;
            }
        },
        {
            key: 'amount', header: 'Jumlah', sortable: true, render: (row: any) => {
                const isCredit = row.transaction_type === 'deposit' || row.transaction_type === 'transfer_in';
                return <span className={isCredit ? 'text-success-600 font-semibold' : 'text-danger-600 font-semibold'}>{isCredit ? '+' : '-'}{formatCurrency(Number(row.amount))}</span>;
            }
        },
        { key: 'balance_after', header: 'Saldo', render: (row: any) => formatCurrency(Number(row.balance_after)) },
        { key: 'description', header: 'Keterangan', render: (row: any) => <span className="text-surface-500">{row.description || '-'}</span> },
    ];
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return (
        <div>
            <Header title="Histori Transaksi" subtitle="Riwayat transaksi rekening Anda" />

            <div className="glass-card p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormSelect
                        label="Jenis"
                        value={filters.type}
                        onChange={(e) => { setFilters((f) => ({ ...f, type: e.target.value })); setPage(1); }}
                        options={[
                            { value: '', label: 'Semua' },
                            { value: 'deposit', label: 'Setoran' },
                            { value: 'withdrawal', label: 'Penarikan' },
                            { value: 'transfer_in', label: 'Transfer Masuk' },
                            { value: 'transfer_out', label: 'Transfer Keluar' },
                        ]}
                    />
                    <FormInput label="Dari" type="date" value={filters.date_from} onChange={(e) => { setFilters((f) => ({ ...f, date_from: e.target.value })); setPage(1); }} />
                    <FormInput label="Sampai" type="date" value={filters.date_to} onChange={(e) => { setFilters((f) => ({ ...f, date_to: e.target.value })); setPage(1); }} />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={data as any[]}
                keyExtractor={(row: any) => row.id}
                loading={loading}
                serverSidePagination
                totalItems={total}
                currentPage={page}
                onPageChange={setPage}
            />
        </div>
    );
}
