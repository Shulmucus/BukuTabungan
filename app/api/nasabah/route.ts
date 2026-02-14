import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';

// GET /api/nasabah — list all nasabah
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const search = request.nextUrl.searchParams.get('search') || '';
        const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
        const pageSize = parseInt(request.nextUrl.searchParams.get('pageSize') || '10');

        let query = supabase
            .from('nasabah_profiles')
            .select('*, user:users(*)', { count: 'exact' });

        if (search) {
            query = query.or(
                `account_number.ilike.%${search}%,user.full_name.ilike.%${search}%`,
            );
        }

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
        console.error('GET nasabah error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

// POST /api/nasabah — create (proxy to /api/auth/register with role=nasabah)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Forward to register
        const registerRes = await fetch(new URL('/api/auth/register', request.url), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' },
            body: JSON.stringify({ ...body, role: 'nasabah' }),
        });

        const result = await registerRes.json();

        if (result.success) {
            await logActivity({
                supabase,
                userId: user.id,
                action: 'create',
                entityType: 'nasabah',
                entityId: result.userId,
                details: { email: body.email, full_name: body.full_name },
            });
        }

        return NextResponse.json(result, { status: registerRes.status });
    } catch (error) {
        console.error('POST nasabah error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
