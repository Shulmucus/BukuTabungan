import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/activity-logs
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const sp = request.nextUrl.searchParams;
        const page = parseInt(sp.get('page') || '1');
        const pageSize = parseInt(sp.get('pageSize') || '20');
        const action = sp.get('action');
        const userId = sp.get('user_id');
        const dateFrom = sp.get('date_from');
        const dateTo = sp.get('date_to');

        let query = supabase
            .from('activity_logs')
            .select('*, user:users(full_name, email, role)', { count: 'exact' });

        if (action) query = query.eq('action', action);
        if (userId) query = query.eq('user_id', userId);
        if (dateFrom) query = query.gte('created_at', dateFrom);
        if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

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
        console.error('GET activity logs error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
