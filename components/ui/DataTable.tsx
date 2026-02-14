'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useState, useMemo } from 'react';
import { HiChevronUp, HiChevronDown, HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

interface Column<T> {
    key: string;
    header: string;
    sortable?: boolean;
    render?: (row: T) => ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (row: T) => string;
    pageSize?: number;
    searchable?: boolean;
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;
    serverSidePagination?: boolean;
    totalItems?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    emptyMessage?: string;
    actions?: (row: T) => ReactNode;
    loading?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
    columns,
    data,
    keyExtractor,
    pageSize = 10,
    searchable,
    searchPlaceholder = 'Cari...',
    onSearch,
    serverSidePagination,
    totalItems,
    currentPage: controlledPage,
    onPageChange,
    emptyMessage = 'Tidak ada data',
    actions,
    loading,
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [localPage, setLocalPage] = useState(1);

    const page = serverSidePagination ? (controlledPage || 1) : localPage;

    // Client-side sort & filter
    const processed = useMemo(() => {
        let items = [...data];

        if (search && !onSearch) {
            const q = search.toLowerCase();
            items = items.filter((row) =>
                Object.values(row).some(
                    (v) => v && String(v).toLowerCase().includes(q),
                ),
            );
        }

        if (sortKey) {
            items.sort((a, b) => {
                const av = a[sortKey] ?? '';
                const bv = b[sortKey] ?? '';
                const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
                return sortDir === 'asc' ? cmp : -cmp;
            });
        }

        return items;
    }, [data, search, sortKey, sortDir, onSearch]);

    const total = serverSidePagination ? (totalItems || 0) : processed.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageData = serverSidePagination
        ? processed
        : processed.slice((page - 1) * pageSize, page * pageSize);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const changePage = (p: number) => {
        if (serverSidePagination && onPageChange) {
            onPageChange(p);
        } else {
            setLocalPage(p);
        }
    };

    return (
        <div className="space-y-4">
            {searchable && (
                <div className="relative">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            onSearch?.(e.target.value);
                            if (!serverSidePagination) setLocalPage(1);
                        }}
                        className="w-full md:w-80 pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
                       placeholder:text-surface-400 transition-all"
                    />
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-surface-50 border-b border-surface-200">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                    className={cn(
                                        'px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider',
                                        col.sortable && 'cursor-pointer hover:text-surface-900 select-none',
                                        col.className,
                                    )}
                                >
                                    <span className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortable && sortKey === col.key && (
                                            sortDir === 'asc' ? <HiChevronUp className="w-3.5 h-3.5" /> : <HiChevronDown className="w-3.5 h-3.5" />
                                        )}
                                    </span>
                                </th>
                            ))}
                            {actions && (
                                <th className="px-4 py-3 text-right text-xs font-semibold text-surface-600 uppercase tracking-wider">
                                    Aksi
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-4 py-3">
                                            <div className="skeleton h-4 w-3/4" />
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-4 py-3">
                                            <div className="skeleton h-4 w-16 ml-auto" />
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : pageData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    className="px-4 py-12 text-center text-surface-400"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            pageData.map((row) => (
                                <tr
                                    key={keyExtractor(row)}
                                    className="hover:bg-surface-50 transition-colors"
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className={cn('px-4 py-3 text-surface-700', col.className)}>
                                            {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {actions(row)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-surface-500">
                        Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari {total}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => changePage(page - 1)}
                            disabled={page <= 1}
                            className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <HiChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let p: number;
                            if (totalPages <= 5) {
                                p = i + 1;
                            } else if (page <= 3) {
                                p = i + 1;
                            } else if (page >= totalPages - 2) {
                                p = totalPages - 4 + i;
                            } else {
                                p = page - 2 + i;
                            }
                            return (
                                <button
                                    key={p}
                                    onClick={() => changePage(p)}
                                    className={cn(
                                        'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                                        page === p
                                            ? 'bg-primary-600 text-white'
                                            : 'hover:bg-surface-100 text-surface-600',
                                    )}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => changePage(page + 1)}
                            disabled={page >= totalPages}
                            className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <HiChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
