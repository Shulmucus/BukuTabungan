import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient(); // For auth check
        const adminClient = createAdminClient(); // For data fetching (bypass RLS recursion)

        // 1. Check if requester is admin
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { data: adminCheck } = await supabase.from('users').select('role').eq('id', currentUser.id).single();
        if (adminCheck?.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        const sp = request.nextUrl.searchParams;
        const page = parseInt(sp.get('page') || '1');
        const pageSize = parseInt(sp.get('pageSize') || '10');
        const search = sp.get('search');

        let query = adminClient
            .from('users')
            .select(`
                *,
                nasabah_profiles:nasabah_profiles(account_number, transaction_limit)
            `, { count: 'exact' });

        if (search) {
            query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

        return NextResponse.json({
            success: true,
            data,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    } catch (error) {
        console.error('GET users error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
