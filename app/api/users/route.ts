import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const search = searchParams.get('search') || '';

        // Check admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        // RLS will handle the query check (Admin only), but we fail fast for clarity
        // Since we didn't inject `role` into session JWT, we verify via DB or trust RLS.
        // Trusting RLS here.

        let query = supabase.from('users').select('*', { count: 'exact' });

        if (search) {
            query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }

        const { data, count, error } = await query
            .range((page - 1) * pageSize, page * pageSize - 1)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data, total: count });
    } catch (err) {
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
