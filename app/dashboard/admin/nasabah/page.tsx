'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/ui/Header';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormInput, FormTextarea } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { NasabahProfile } from '@/lib/types';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePlus, HiOutlineEye } from 'react-icons/hi2';

export default function AdminNasabahPage() {
    const [data, setData] = useState<NasabahProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState<NasabahProfile | null>(null);
    const [showDetail, setShowDetail] = useState<NasabahProfile | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');

    const [createForm, setCreateForm] = useState({
        email: '', username: '', password: '', full_name: '',
        phone_number: '', pin: '', address: '', id_card_number: '', date_of_birth: '',
    });

    const [editForm, setEditForm] = useState({
        full_name: '', phone_number: '', address: '', id_card_number: '', date_of_birth: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/nasabah?page=${page}&pageSize=10&search=${search}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data || []);
                setTotal(json.total || 0);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError('');

        try {
            const res = await fetch('/api/nasabah', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm),
            });
            const json = await res.json();

            if (json.success) {
                setShowCreate(false);
                setCreateForm({ email: '', username: '', password: '', full_name: '', phone_number: '', pin: '', address: '', id_card_number: '', date_of_birth: '' });
                fetchData();
            } else {
                setError(json.error || 'Gagal membuat nasabah');
            }
        } catch {
            setError('Terjadi kesalahan');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showEdit) return;
        setFormLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/nasabah/${showEdit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const json = await res.json();

            if (json.success) {
                setShowEdit(null);
                fetchData();
            } else {
                setError(json.error || 'Gagal memperbarui');
            }
        } catch {
            setError('Terjadi kesalahan');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menonaktifkan nasabah ini?')) return;

        try {
            const res = await fetch(`/api/nasabah/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) fetchData();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const openEdit = (nasabah: NasabahProfile) => {
        setEditForm({
            full_name: nasabah.user?.full_name || '',
            phone_number: nasabah.user?.phone_number || '',
            address: nasabah.address || '',
            id_card_number: nasabah.id_card_number || '',
            date_of_birth: nasabah.date_of_birth || '',
        });
        setShowEdit(nasabah);
        setError('');
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const columns = [
        {
            key: 'account_number',
            header: 'No. Rekening',
            sortable: true,
            render: (row: any) => (
                <span className="font-mono text-sm font-medium text-primary-700">{row.account_number}</span>
            ),
        },
        {
            key: 'full_name',
            header: 'Nama',
            sortable: true,
            render: (row: any) => row.user?.full_name || '-',
        },
        {
            key: 'email',
            header: 'Email',
            render: (row: any) => row.user?.email || '-',
        },
        {
            key: 'balance',
            header: 'Saldo',
            sortable: true,
            render: (row: any) => (
                <span className="font-semibold text-success-600">{formatCurrency(Number(row.balance))}</span>
            ),
        },
        {
            key: 'is_active',
            header: 'Status',
            render: (row: any) => (
                <Badge variant={row.user?.is_active ? 'success' : 'danger'} dot>
                    {row.user?.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            header: 'Terdaftar',
            sortable: true,
            render: (row: any) => formatDate(row.created_at),
        },
    ];
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return (
        <div>
            <Header title="Data Nasabah" subtitle="Kelola data nasabah / customer" />

            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => { setShowCreate(true); setError(''); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25"
                >
                    <HiOutlinePlus className="w-4 h-4" />
                    Tambah Nasabah
                </button>
            </div>

            <DataTable
                columns={columns}
                data={data as any[]}
                keyExtractor={(row: any) => row.id}
                searchable
                searchPlaceholder="Cari nasabah..."
                onSearch={(q) => { setSearch(q); setPage(1); }}
                loading={loading}
                serverSidePagination
                totalItems={total}
                currentPage={page}
                onPageChange={setPage}
                actions={(row: any) => (
                    <>
                        <button
                            onClick={() => setShowDetail(row)}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Detail"
                        >
                            <HiOutlineEye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => openEdit(row)}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit"
                        >
                            <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(row.id)}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-red-50 transition-colors"
                            title="Nonaktifkan"
                        >
                            <HiOutlineTrash className="w-4 h-4" />
                        </button>
                    </>
                )}
            />

            {/* Create Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Tambah Nasabah Baru" size="lg">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput label="Nama Lengkap" required value={createForm.full_name} onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))} />
                        <FormInput label="Username" required value={createForm.username} onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))} />
                        <FormInput label="Email" type="email" required value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} />
                        <FormInput label="Password" type="password" required value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} />
                        <FormInput label="No. Telepon" value={createForm.phone_number} onChange={(e) => setCreateForm((f) => ({ ...f, phone_number: e.target.value }))} />
                        <FormInput label="PIN (6 digit)" required maxLength={6} value={createForm.pin} onChange={(e) => setCreateForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))} hint="PIN digunakan untuk verifikasi transaksi" />
                        <FormInput label="No. KTP" value={createForm.id_card_number} onChange={(e) => setCreateForm((f) => ({ ...f, id_card_number: e.target.value }))} />
                        <FormInput label="Tanggal Lahir" type="date" value={createForm.date_of_birth} onChange={(e) => setCreateForm((f) => ({ ...f, date_of_birth: e.target.value }))} />
                    </div>
                    <FormTextarea label="Alamat" value={createForm.address} onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))} />

                    {error && <p className="text-sm text-danger-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm text-surface-600 hover:bg-surface-100 transition-colors">Batal</button>
                        <button type="submit" disabled={formLoading} className="px-6 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors">
                            {formLoading ? <LoadingSpinner size="sm" /> : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Nasabah" size="lg">
                <form onSubmit={handleEdit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput label="Nama Lengkap" required value={editForm.full_name} onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))} />
                        <FormInput label="No. Telepon" value={editForm.phone_number} onChange={(e) => setEditForm((f) => ({ ...f, phone_number: e.target.value }))} />
                        <FormInput label="No. KTP" value={editForm.id_card_number} onChange={(e) => setEditForm((f) => ({ ...f, id_card_number: e.target.value }))} />
                        <FormInput label="Tanggal Lahir" type="date" value={editForm.date_of_birth} onChange={(e) => setEditForm((f) => ({ ...f, date_of_birth: e.target.value }))} />
                    </div>
                    <FormTextarea label="Alamat" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />

                    {error && <p className="text-sm text-danger-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowEdit(null)} className="px-4 py-2 rounded-xl text-sm text-surface-600 hover:bg-surface-100 transition-colors">Batal</button>
                        <button type="submit" disabled={formLoading} className="px-6 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors">
                            {formLoading ? <LoadingSpinner size="sm" /> : 'Perbarui'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Detail Nasabah" size="lg">
                {showDetail && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-surface-500">No. Rekening</span><p className="font-mono font-semibold text-primary-700">{showDetail.account_number}</p></div>
                            <div><span className="text-surface-500">Saldo</span><p className="font-semibold text-success-600">{formatCurrency(Number(showDetail.balance))}</p></div>
                            <div><span className="text-surface-500">Nama</span><p className="font-medium">{showDetail.user?.full_name}</p></div>
                            <div><span className="text-surface-500">Email</span><p>{showDetail.user?.email}</p></div>
                            <div><span className="text-surface-500">Telepon</span><p>{showDetail.user?.phone_number || '-'}</p></div>
                            <div><span className="text-surface-500">No. KTP</span><p>{showDetail.id_card_number || '-'}</p></div>
                            <div><span className="text-surface-500">Tanggal Lahir</span><p>{showDetail.date_of_birth ? formatDate(showDetail.date_of_birth) : '-'}</p></div>
                            <div><span className="text-surface-500">Status</span>
                                <Badge variant={showDetail.user?.is_active ? 'success' : 'danger'} dot>{showDetail.user?.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                            </div>
                        </div>
                        {showDetail.address && (
                            <div className="text-sm"><span className="text-surface-500">Alamat</span><p>{showDetail.address}</p></div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
