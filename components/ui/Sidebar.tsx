'use client';

import { cn, getInitials, roleLabels } from '@/lib/utils';
import { UserRole } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from './Badge';
import {
    HiOutlineHome,
    HiOutlineUsers,
    HiOutlineBanknotes,
    HiOutlineArrowsRightLeft,
    HiOutlineClipboardDocumentList,
    HiOutlinePrinter,
    HiOutlineClock,
    HiOutlineDocumentChartBar,
    HiOutlineChevronLeft,
    HiOutlineArrowRightOnRectangle,
    HiOutlineListBullet,
    HiOutlineDocumentText,
    HiOutlineUserCircle,
} from 'react-icons/hi2';

interface MenuItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const menuByRole: Record<UserRole, MenuItem[]> = {
    admin: [
        { label: 'Dashboard', href: '/dashboard/admin', icon: <HiOutlineHome className="w-5 h-5" /> },
        { label: 'Kelola Pengguna', href: '/dashboard/admin/users', icon: <HiOutlineUsers className="w-5 h-5" /> },
        { label: 'Data Nasabah', href: '/dashboard/admin/nasabah', icon: <HiOutlineUsers className="w-5 h-5" /> },
        { label: 'Transaksi', href: '/dashboard/admin/transactions', icon: <HiOutlineBanknotes className="w-5 h-5" /> },
        { label: 'Transfer', href: '/dashboard/admin/transfers', icon: <HiOutlineArrowsRightLeft className="w-5 h-5" /> },
        { label: 'Log Aktivitas', href: '/dashboard/admin/activity-logs', icon: <HiOutlineClipboardDocumentList className="w-5 h-5" /> },
    ],
    petugas: [
        { label: 'Dashboard', href: '/dashboard/petugas', icon: <HiOutlineHome className="w-5 h-5" /> },
        { label: 'Histori Transaksi', href: '/dashboard/petugas/transactions', icon: <HiOutlineClock className="w-5 h-5" /> },
        { label: 'Cetak Mutasi', href: '/dashboard/petugas/mutasi', icon: <HiOutlinePrinter className="w-5 h-5" /> },
    ],
    nasabah: [
        { label: 'Dashboard', href: '/dashboard/nasabah', icon: <HiOutlineHome className="w-5 h-5" /> },
        { label: 'Histori Transaksi', href: '/dashboard/nasabah/transactions', icon: <HiOutlineListBullet className="w-5 h-5" /> },
        { label: 'Rekap Tabungan', href: '/dashboard/nasabah/recap', icon: <HiOutlineDocumentText className="w-5 h-5" /> },
        { label: 'Profil Saya', href: '/dashboard/nasabah/profile', icon: <HiOutlineUserCircle className="w-5 h-5" /> },
    ],
};

interface SidebarProps {
    role: UserRole;
    fullName: string;
    onLogout: () => void;
}

export function Sidebar({ role, fullName, onLogout }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const items = menuByRole[role] || [];

    const roleBadgeVariant = role === 'admin' ? 'primary' : role === 'petugas' ? 'accent' : 'success';

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo area */}
            <div className="px-4 py-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        BT
                    </div>
                    {!collapsed && (
                        <div className="animate-fade-in">
                            <h1 className="text-base font-bold text-white leading-tight">Buku Tabungan</h1>
                            <p className="text-xs text-white/50">Savings Management</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <button
                            key={item.href}
                            onClick={() => {
                                router.push(item.href);
                                setMobileOpen(false);
                            }}
                            className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-white/15 text-white shadow-lg shadow-black/10'
                                    : 'text-white/60 hover:bg-white/8 hover:text-white',
                                collapsed && 'justify-center px-2',
                            )}
                        >
                            {item.icon}
                            {!collapsed && <span>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="px-3 py-4 border-t border-white/10">
                <div className={cn('flex items-center gap-3 mb-3', collapsed && 'justify-center')}>
                    <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(fullName)}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0 animate-fade-in">
                            <p className="text-sm font-medium text-white truncate">{fullName}</p>
                            <Badge variant={roleBadgeVariant} className="mt-0.5 text-[10px]">
                                {roleLabels[role]}
                            </Badge>
                        </div>
                    )}
                </div>
                <button
                    onClick={onLogout}
                    className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/60 hover:bg-white/8 hover:text-white transition-colors',
                        collapsed && 'justify-center px-2',
                    )}
                >
                    <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                    {!collapsed && 'Keluar'}
                </button>
            </div>

            {/* Collapse toggle - desktop */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex items-center justify-center py-3 border-t border-white/10 text-white/40 hover:text-white/80 transition-colors"
            >
                <HiOutlineChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
            </button>
        </div>
    );

    return (
        <>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile toggle button */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white shadow-lg border border-surface-200"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed lg:sticky top-0 left-0 h-screen bg-gradient-primary z-40 transition-all duration-300 shrink-0',
                    collapsed ? 'w-[72px]' : 'w-64',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                )}
            >
                {sidebarContent}
            </aside>
        </>
    );
}
