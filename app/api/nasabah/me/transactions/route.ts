import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/nasabah/me/transactions
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Get their nasabah profile
        const { data: profile } = await supabase
            .from('nasabah_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ success: false, error: 'Profil tidak ditemukan' }, { status: 404 });
        }

        const sp = request.nextUrl.searchParams;
        const page = parseInt(sp.get('page') || '1');
        const pageSize = parseInt(sp.get('pageSize') || '10');
        const dateFrom = sp.get('date_from');
        const dateTo = sp.get('date_to');
        const type = sp.get('type');

        let query = supabase
            .from('transactions')
            .select('*', { count: 'exact' })
            .eq('nasabah_id', profile.id);

        if (type) query = query.eq('transaction_type', type);
        if (dateFrom) query = query.gte('transaction_date', dateFrom);
        if (dateTo) query = query.lte('transaction_date', dateTo);

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    } catch (error) {
        console.error('GET my transactions error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
