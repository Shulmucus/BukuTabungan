'use client';

import { Sidebar } from '@/components/ui/Sidebar';
import { UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface DashboardShellProps {
    role: UserRole;
    fullName: string;
    children: React.ReactNode;
}

export function DashboardShell({ role, fullName, children }: DashboardShellProps) {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    };

    return (
        <div className="flex min-h-screen bg-surface-50">
            <Sidebar role={role} fullName={fullName} onLogout={handleLogout} />
            <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8 overflow-x-hidden">
                <div className="max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    );
}
