import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from './DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch role from users table
    const { data: userData } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    const role = userData?.role || user.user_metadata?.role;
    const fullName = userData?.full_name || user.user_metadata?.full_name || 'User';

    if (!role) {
        redirect('/login');
    }

    return (
        <DashboardShell role={role} fullName={fullName}>
            {children}
        </DashboardShell>
    );
}
