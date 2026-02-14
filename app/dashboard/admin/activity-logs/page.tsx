'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/ui/Header';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { FormInput, FormSelect } from '@/components/ui/FormField';
import { formatDateTime } from '@/lib/utils';
import { ActivityLog } from '@/lib/types';

export default function AdminActivityLogsPage() {
    const [data, setData] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        action: '',
        date_from: '',
        date_to: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: '20' });
            if (filters.action) params.set('action', filters.action);
            if (filters.date_from) params.set('date_from', filters.date_from);
            if (filters.date_to) params.set('date_to', filters.date_to);

            const res = await fetch(`/api/activity-logs?${params}`);
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
    }, [page, filters]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const actionVariant = (action: string) => {
        if (action === 'create') return 'success';
        if (action === 'delete') return 'danger';
        if (action === 'update') return 'warning';
        if (action === 'login') return 'primary';
        if (action === 'logout') return 'neutral';
        return 'neutral';
    };

    const actionLabel: Record<string, string> = {
        login: 'Login',
        logout: 'Logout',
        create: 'Buat',
        update: 'Ubah',
        delete: 'Hapus',
        view: 'Lihat',
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const columns = [
        { key: 'created_at', header: 'Waktu', sortable: true, render: (row: any) => <span className="text-xs">{formatDateTime(row.created_at)}</span> },
        {
            key: 'user', header: 'User', render: (row: any) => (
                <div>
                    <p className="font-medium text-sm">{row.user?.full_name || '-'}</p>
                    <p className="text-xs text-surface-400">{row.user?.email || ''}</p>
                </div>
            )
        },
        { key: 'action', header: 'Aksi', render: (row: any) => <Badge variant={actionVariant(row.action)}>{actionLabel[row.action] || row.action}</Badge> },
        { key: 'entity_type', header: 'Entitas', render: (row: any) => <span className="capitalize">{row.entity_type}</span> },
        {
            key: 'details', header: 'Detail', render: (row: any) => (
                <span className="text-xs text-surface-500">
                    {row.details ? JSON.stringify(row.details).slice(0, 60) : '-'}
                </span>
            )
        },
        { key: 'ip_address', header: 'IP', render: (row: any) => <span className="text-xs font-mono">{row.ip_address || '-'}</span> },
    ];
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return (
        <div>
            <Header title="Log Aktivitas" subtitle="Pantau semua aktivitas pengguna dalam sistem" />

            {/* Filters */}
            <div className="glass-card p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormSelect
                        label="Jenis Aksi"
                        value={filters.action}
                        onChange={(e) => { setFilters((f) => ({ ...f, action: e.target.value })); setPage(1); }}
                        options={[
                            { value: '', label: 'Semua' },
                            { value: 'login', label: 'Login' },
                            { value: 'logout', label: 'Logout' },
                            { value: 'create', label: 'Buat' },
                            { value: 'update', label: 'Ubah' },
                            { value: 'delete', label: 'Hapus' },
                        ]}
                    />
                    <FormInput
                        label="Dari Tanggal"
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => { setFilters((f) => ({ ...f, date_from: e.target.value })); setPage(1); }}
                    />
                    <FormInput
                        label="Sampai Tanggal"
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => { setFilters((f) => ({ ...f, date_to: e.target.value })); setPage(1); }}
                    />
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
                pageSize={20}
                emptyMessage="Belum ada log aktivitas"
            />
        </div>
    );
}
