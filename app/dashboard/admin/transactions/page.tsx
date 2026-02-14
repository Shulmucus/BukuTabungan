'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/ui/Header';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PinModal } from '@/components/ui/PinModal';
import { formatCurrency, formatDate, transactionTypeLabels } from '@/lib/utils';
import { Transaction, NasabahProfile } from '@/lib/types';
import { HiOutlinePlus } from 'react-icons/hi2';

export default function AdminTransactionsPage() {
    const [data, setData] = useState<Transaction[]>([]);
    const [nasabahList, setNasabahList] = useState<NasabahProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');

    const [createForm, setCreateForm] = useState({
        nasabah_id: '', transaction_type: 'deposit', amount: '', description: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/transactions?page=${page}&pageSize=10&search=${search}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data || []);
                setTotal(json.total || 0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        fetch('/api/nasabah?pageSize=100')
            .then((r) => r.json())
            .then((json) => { if (json.success) setNasabahList(json.data || []); });
    }, []);

    const handleCreateClick = () => {
        if (!createForm.nasabah_id || !createForm.amount) {
            setError('Pilih nasabah dan jumlah');
            return;
        }
        setShowPin(true);
    };

    const handlePinVerified = async (pin: string): Promise<boolean> => {
        const res = await fetch('/api/verify-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nasabahId: createForm.nasabah_id, pin }),
        });
        const data = await res.json();
        if (!data.success) return false;

        setShowPin(false);
        await submitTransaction();
        return true;
    };

    const submitTransaction = async () => {
        setFormLoading(true);
        setError('');

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...createForm,
                    amount: Number(createForm.amount),
                }),
            });
            const json = await res.json();

            if (json.success) {
                setShowCreate(false);
                setCreateForm({ nasabah_id: '', transaction_type: 'deposit', amount: '', description: '' });
                fetchData();
            } else {
                setError(json.error || 'Gagal membuat transaksi');
            }
        } catch {
            setError('Terjadi kesalahan');
        } finally {
            setFormLoading(false);
        }
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const columns = [
        {
            key: 'transaction_date',
            header: 'Tanggal',
            sortable: true,
            render: (row: any) => formatDate(row.transaction_date),
        },
        {
            key: 'nasabah',
            header: 'Nasabah',
            render: (row: any) => row.nasabah?.user?.full_name || '-',
        },
        {
            key: 'transaction_type',
            header: 'Jenis',
            render: (row: any) => {
                const variant = row.transaction_type.includes('deposit') || row.transaction_type.includes('transfer_in')
                    ? 'success' : 'danger';
                return <Badge variant={variant}>{transactionTypeLabels[row.transaction_type]}</Badge>;
            },
        },
        {
            key: 'amount',
            header: 'Jumlah',
            sortable: true,
            render: (row: any) => {
                const isCredit = row.transaction_type === 'deposit' || row.transaction_type === 'transfer_in';
                return (
                    <span className={isCredit ? 'text-success-600 font-semibold' : 'text-danger-600 font-semibold'}>
                        {isCredit ? '+' : '-'}{formatCurrency(Number(row.amount))}
                    </span>
                );
            },
        },
        {
            key: 'balance_after',
            header: 'Saldo Setelah',
            render: (row: any) => formatCurrency(Number(row.balance_after)),
        },
        {
            key: 'description',
            header: 'Keterangan',
            render: (row: any) => <span className="text-surface-500">{row.description || '-'}</span>,
        },
    ];
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return (
        <div>
            <Header title="Data Transaksi" subtitle="Kelola transaksi setoran dan penarikan" />

            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => { setShowCreate(true); setError(''); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25"
                >
                    <HiOutlinePlus className="w-4 h-4" />
                    Transaksi Baru
                </button>
            </div>

            <DataTable
                columns={columns}
                data={data as any[]}
                keyExtractor={(row: any) => row.id}
                searchable
                searchPlaceholder="Cari transaksi..."
                onSearch={(q) => { setSearch(q); setPage(1); }}
                loading={loading}
                serverSidePagination
                totalItems={total}
                currentPage={page}
                onPageChange={setPage}
            />

            {/* Create Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Transaksi Baru" size="md">
                <div className="space-y-4">
                    <FormSelect
                        label="Nasabah"
                        required
                        value={createForm.nasabah_id}
                        onChange={(e) => setCreateForm((f) => ({ ...f, nasabah_id: e.target.value }))}
                        placeholder="Pilih nasabah"
                        options={nasabahList.map((n) => ({
                            value: n.id,
                            label: `${n.account_number} — ${n.user?.full_name || ''} (${formatCurrency(Number(n.balance))})`,
                        }))}
                    />
                    <FormSelect
                        label="Jenis Transaksi"
                        required
                        value={createForm.transaction_type}
                        onChange={(e) => setCreateForm((f) => ({ ...f, transaction_type: e.target.value }))}
                        options={[
                            { value: 'deposit', label: 'Setoran' },
                            { value: 'withdrawal', label: 'Penarikan' },
                        ]}
                    />
                    <FormInput
                        label="Jumlah (Rp)"
                        type="number"
                        required
                        min={1}
                        value={createForm.amount}
                        onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))}
                    />
                    <FormTextarea
                        label="Keterangan"
                        value={createForm.description}
                        onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    />

                    {error && <p className="text-sm text-danger-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm text-surface-600 hover:bg-surface-100 transition-colors">Batal</button>
                        <button type="button" onClick={handleCreateClick} disabled={formLoading} className="px-6 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors">
                            {formLoading ? <LoadingSpinner size="sm" /> : 'Proses'}
                        </button>
                    </div>
                </div>
            </Modal>

            <PinModal
                isOpen={showPin}
                onClose={() => setShowPin(false)}
                onVerify={handlePinVerified}
                title="Verifikasi PIN Nasabah"
                description="Masukkan PIN nasabah untuk memproses transaksi"
            />
        </div>
    );
}
