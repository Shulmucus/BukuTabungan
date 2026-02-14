'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/ui/Header';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { FormSelect } from '@/components/ui/FormField';
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
}

export default function AdminUsersPage() {
    const [data, setData] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [promoteRole, setPromoteRole] = useState<UserRole>('nasabah');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Reuse nasabah endpoint? No, we need all users. 
            // We might need a new endpoint `GET /api/users`.
            // For now, let's assume we implement a quick fetcher or reuse logic.
            // Since I didn't create `/api/users`, let's mock or build one?
            // Wait, `GET /api/nasabah` only returns nasabah.
            // I need to create `app/api/users/route.ts` OR rely on client filtering? Server side is better.
            // I'll create the Route in the next tool call. Here is the UI.
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

    const handleRoleUpdate = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: promoteRole }),
            });
            const json = await res.json();
            if (json.success) {
                setSelectedUser(null);
                fetchData();
            } else {
                alert(json.error || 'Gagal update role');
            }
        } catch (e) {
            console.error(e);
            alert('Error connection');
        } finally {
            setActionLoading(false);
        }
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const columns = [
        { key: 'username', header: 'Username', sortable: true, render: (r: any) => <span className="font-medium text-surface-900">{r.username}</span> },
        { key: 'email', header: 'Email', render: (r: any) => r.email },
        { key: 'full_name', header: 'Nama Lengkap', sortable: true, render: (r: any) => r.full_name },
        {
            key: 'role', header: 'Role', render: (r: any) => (
                <Badge variant={r.role === 'admin' ? 'primary' : r.role === 'petugas' ? 'warning' : 'success'}>
                    {r.role.toUpperCase()}
                </Badge>
            )
        },
        { key: 'created_at', header: 'Terdaftar', render: (r: any) => formatDate(r.created_at) },
    ];
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return (
        <div>
            <Header title="Kelola Pengguna" subtitle="Manajemen semua user dan hak akses" />

            <DataTable
                columns={columns}
                data={data as any[]}
                keyExtractor={(row: any) => row.id}
                searchable
                searchPlaceholder="Cari username/email..."
                onSearch={(q) => { setSearch(q); setPage(1); }}
                loading={loading}
                serverSidePagination
                totalItems={total}
                currentPage={page}
                onPageChange={setPage}
                actions={(row: any) => (
                    <button
                        onClick={() => { setSelectedUser(row); setPromoteRole(row.role); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-100 text-surface-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        title="Ubah Role"
                    >
                        <HiOutlineUserGroup className="w-4 h-4" />
                        Role
                    </button>
                )}
            />

            <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Ubah Hak Akses User" size="sm">
                <div className="space-y-6">
                    <p className="text-sm text-surface-500">
                        Mengubah role untuk user <strong>{selectedUser?.username}</strong> ({selectedUser?.email}).
                    </p>

                    <FormSelect
                        label="Pilih Role Baru"
                        value={promoteRole}
                        onChange={(e) => setPromoteRole(e.target.value as UserRole)}
                        options={[
                            { value: 'admin', label: 'Admin (Full Access)' },
                            { value: 'petugas', label: 'Petugas (Staff)' },
                            { value: 'nasabah', label: 'Nasabah (Customer)' },
                        ]}
                    />

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setSelectedUser(null)}
                            className="px-4 py-2 rounded-xl text-sm text-surface-600 hover:bg-surface-100 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleRoleUpdate}
                            disabled={actionLoading || promoteRole === selectedUser?.role}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
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
