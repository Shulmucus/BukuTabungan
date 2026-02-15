import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient(); // For auth check
        const adminClient = createAdminClient(); // For data fetching

        // 1. Check if requester is admin
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { data: adminCheck } = await adminClient.from('users').select('role').eq('id', currentUser.id).single();
        if (adminCheck?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        // 2. Fetch counts and sums
        const [
            { count: totalNasabah },
            { count: totalPetugas },
            { data: balanceData },
            { count: todayTransactions },
            { count: totalTransfers }
        ] = await Promise.all([
            adminClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'nasabah'),
            adminClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'petugas'),
            adminClient.from('nasabah_profiles').select('balance'),
            adminClient.from('transactions').select('*', { count: 'exact', head: true }).eq('transaction_date', new Date().toISOString().split('T')[0]),
            adminClient.from('transfers').select('*', { count: 'exact', head: true })
        ]);

        const totalBalance = (balanceData || []).reduce((sum, n) => sum + Number(n.balance), 0);

        return NextResponse.json({
            success: true,
            totalNasabah: totalNasabah || 0,
            totalPetugas: totalPetugas || 0,
            totalBalance,
            todayTransactions: todayTransactions || 0,
            totalTransfers: totalTransfers || 0
        });
    } catch (error) {
        console.error('GET stats error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
