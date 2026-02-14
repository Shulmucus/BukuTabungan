'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/ui/Header';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PinModal } from '@/components/ui/PinModal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Transfer, NasabahProfile } from '@/lib/types';
import { HiOutlinePlus } from 'react-icons/hi2';

export default function AdminTransfersPage() {
    const [data, setData] = useState<Transfer[]>([]);
    const [nasabahList, setNasabahList] = useState<NasabahProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [showCreate, setShowCreate] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');

    const [createForm, setCreateForm] = useState({
        from_nasabah_id: '', to_nasabah_id: '', amount: '', description: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/transfers?page=${page}&pageSize=10`);
            const json = await res.json();
            if (json.success) {
                setData(json.data || []);
                setTotal(json.total || 0);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        fetch('/api/nasabah?pageSize=100')
            .then((r) => r.json())
            .then((json) => { if (json.success) setNasabahList(json.data || []); });
    }, []);

    const handleCreateClick = () => {
        if (!createForm.from_nasabah_id || !createForm.to_nasabah_id || !createForm.amount) {
            setError('Lengkapi semua field wajib');
            return;
        }
        if (createForm.from_nasabah_id === createForm.to_nasabah_id) {
            setError('Pengirim dan penerima tidak boleh sama');
            return;
        }
        setShowPin(true);
    };

    const handlePinVerified = async (pin: string): Promise<boolean> => {
        const res = await fetch('/api/verify-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nasabahId: createForm.from_nasabah_id, pin }),
        });
        const data = await res.json();
        if (!data.success) return false;

        setShowPin(false);
        await submitTransfer();
        return true;
    };

    const submitTransfer = async () => {
        setFormLoading(true);
        setError('');

        try {
            const res = await fetch('/api/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...createForm, amount: Number(createForm.amount) }),
            });
            const json = await res.json();

            if (json.success) {
                setShowCreate(false);
                setCreateForm({ from_nasabah_id: '', to_nasabah_id: '', amount: '', description: '' });
                fetchData();
            } else {
                setError(json.error || 'Gagal melakukan transfer');
            }
        } catch {
            setError('Terjadi kesalahan');
        } finally {
            setFormLoading(false);
        }
    };

    const statusVariant = (s: string) => {
        if (s === 'completed') return 'success';
        if (s === 'failed') return 'danger';
        return 'warning';
    };

    const statusLabel = (s: string) => {
        if (s === 'completed') return 'Selesai';
        if (s === 'failed') return 'Gagal';
        return 'Pending';
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const columns = [
        { key: 'created_at', header: 'Tanggal', sortable: true, render: (row: any) => formatDate(row.created_at) },
        { key: 'from', header: 'Pengirim', render: (row: any) => `${row.from_nasabah?.user?.full_name || '-'} (${row.from_nasabah?.account_number || ''})` },
        { key: 'to', header: 'Penerima', render: (row: any) => `${row.to_nasabah?.user?.full_name || '-'} (${row.to_nasabah?.account_number || ''})` },
        { key: 'amount', header: 'Jumlah', sortable: true, render: (row: any) => <span className="font-semibold">{formatCurrency(Number(row.amount))}</span> },
        { key: 'status', header: 'Status', render: (row: any) => <Badge variant={statusVariant(row.status)} dot>{statusLabel(row.status)}</Badge> },
        { key: 'description', header: 'Keterangan', render: (row: any) => <span className="text-surface-500">{row.description || '-'}</span> },
    ];
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return (
        <div>
            <Header title="Data Transfer" subtitle="Kelola transfer antar rekening" />

            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => { setShowCreate(true); setError(''); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25"
                >
                    <HiOutlinePlus className="w-4 h-4" />
                    Transfer Baru
                </button>
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

            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Transfer Baru" size="md">
                <div className="space-y-4">
                    <FormSelect
                        label="Pengirim"
                        required
                        value={createForm.from_nasabah_id}
                        onChange={(e) => setCreateForm((f) => ({ ...f, from_nasabah_id: e.target.value }))}
                        placeholder="Pilih pengirim"
                        options={nasabahList.map((n) => ({ value: n.id, label: `${n.account_number} — ${n.user?.full_name || ''} (${formatCurrency(Number(n.balance))})` }))}
                    />
                    <FormSelect
                        label="Penerima"
                        required
                        value={createForm.to_nasabah_id}
                        onChange={(e) => setCreateForm((f) => ({ ...f, to_nasabah_id: e.target.value }))}
                        placeholder="Pilih penerima"
                        options={nasabahList.filter((n) => n.id !== createForm.from_nasabah_id).map((n) => ({ value: n.id, label: `${n.account_number} — ${n.user?.full_name || ''}` }))}
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
                        <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm text-surface-600 hover:bg-surface-100">Batal</button>
                        <button type="button" onClick={handleCreateClick} disabled={formLoading} className="px-6 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                            {formLoading ? <LoadingSpinner size="sm" /> : 'Proses Transfer'}
                        </button>
                    </div>
                </div>
            </Modal>

            <PinModal
                isOpen={showPin}
                onClose={() => setShowPin(false)}
                onVerify={handlePinVerified}
                title="Verifikasi PIN Pengirim"
                description="Masukkan PIN pengirim untuk memproses transfer"
            />
        </div>
    );
}
