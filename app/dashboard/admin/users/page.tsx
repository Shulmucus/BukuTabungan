'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/ui/Header';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormSelect, FormInput } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import { UserRole } from '@/lib/types';
import { HiOutlineUserGroup, HiCheckBadge } from 'react-icons/hi2';

interface UserData {
    id: string;
    email: string;
    username: string;
    full_name: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    nasabah_profiles?: {
        account_number: string;
        transaction_limit: number;
    } | null;
}

export default function AdminUsersPage() {
    const [data, setData] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [form, setForm] = useState({
        role: 'nasabah' as UserRole,
        password: '',
        transaction_limit: 0,
        is_active: true
    });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/users?page=${page}&pageSize=10&search=${search}`);
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

    const handleUpdate = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (json.success) {
                setSelectedUser(null);
                fetchData();
            } else {
                alert(json.error || 'Gagal update user');
            }
        } catch (e) {
            console.error(e);
            alert('Error connection');
        } finally {
            setActionLoading(false);
        }
    };

    const openEdit = (user: UserData) => {
        setSelectedUser(user);
        setForm({
            role: user.role,
            password: '',
            transaction_limit: user.nasabah_profiles?.transaction_limit || 10000000,
            is_active: user.is_active
        });
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const columns = [
        {
            key: 'username', header: 'User', render: (r: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-surface-900">{r.full_name}</span>
                    <span className="text-xs text-surface-500">@{r.username}</span>
                </div>
            )
        },
        {
            key: 'email', header: 'Kontak', render: (r: any) => (
                <div className="flex flex-col">
                    <span className="text-sm">{r.email}</span>
                    {r.nasabah_profiles && <span className="text-[10px] text-primary-600 font-mono">ACC: {r.nasabah_profiles.account_number}</span>}
                </div>
            )
        },
        {
            key: 'role', header: 'Role', render: (r: any) => (
                <Badge variant={r.role === 'admin' ? 'primary' : r.role === 'petugas' ? 'warning' : 'success'}>
                    {r.role.toUpperCase()}
                </Badge>
            )
        },
        {
            key: 'is_active', header: 'Status', render: (r: any) => (
                <Badge variant={r.is_active ? 'success' : 'danger'}>
                    {r.is_active ? 'AKTIF' : 'NON-AKTIF'}
                </Badge>
            )
        },
    ];

    return (
        <div>
            <Header title="Kelola Pengguna" subtitle="Manajemen semua user dan hak akses" />

            <DataTable
                columns={columns}
                data={data as any[]}
                keyExtractor={(row: any) => row.id}
                searchable
                searchPlaceholder="Cari username/email/nama..."
                onSearch={(q) => { setSearch(q); setPage(1); }}
                loading={loading}
                serverSidePagination
                totalItems={total}
                currentPage={page}
                onPageChange={setPage}
                actions={(row: any) => (
                    <button
                        onClick={() => openEdit(row)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-100 text-surface-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    >
                        <HiOutlineUserGroup className="w-4 h-4" />
                        Kelola
                    </button>
                )}
            />

            <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Manajemen User" size="md">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FormSelect
                            label="Hak Akses (Role)"
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                            options={[
                                { value: 'admin', label: 'Admin (Full Access)' },
                                { value: 'petugas', label: 'Petugas (Staff)' },
                                { value: 'nasabah', label: 'Nasabah (Customer)' },
                            ]}
                        />
                        <FormSelect
                            label="Status Akun"
                            value={form.is_active ? 'true' : 'false'}
                            onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                            options={[
                                { value: 'true', label: 'Aktif' },
                                { value: 'false', label: 'Non-Aktif' },
                            ]}
                        />
                    </div>

                    <FormInput
                        label="Reset Password"
                        type="password"
                        placeholder="Isi jika ingin ganti password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        hint="Biarkan kosong jika tidak ingin mengubah password"
                    />

                    {form.role === 'nasabah' && (
                        <FormInput
                            label="Limit Transaksi Harian"
                            type="number"
                            placeholder="Contoh: 10000000"
                            value={form.transaction_limit}
                            onChange={(e) => setForm({ ...form, transaction_limit: Number(e.target.value) })}
                            hint="Maksimal nominal transaksi per hari"
                        />
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
                        <button
                            onClick={() => setSelectedUser(null)}
                            className="px-4 py-2 rounded-xl text-sm text-surface-600 hover:bg-surface-100 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-lg shadow-primary-500/25"
                        >
                            {actionLoading ? <LoadingSpinner size="sm" /> : (
                                <>
                                    <HiCheckBadge className="w-4 h-4" />
                                    Simpan Perubahan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
