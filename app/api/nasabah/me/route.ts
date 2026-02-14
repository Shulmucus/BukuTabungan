import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/nasabah/me — get current user's nasabah profile
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('nasabah_profiles')
            .select('*, user:users(full_name, email, phone_number)')
            .eq('user_id', user.id)
            .single();

        if (error || !data) {
            return NextResponse.json({ success: false, error: 'Profil tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('GET me error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
