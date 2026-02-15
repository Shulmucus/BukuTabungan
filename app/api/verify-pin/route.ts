import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { userId, pin, nasabahId } = await request.json();

        if (!pin || pin.length !== 6) {
            return NextResponse.json(
                { success: false, error: 'PIN harus 6 digit' },
                { status: 400 },
            );
        }

        const adminClient = createAdminClient();
        const supabase = await createClient(); // Still call this if needed for session, but use admin for the query

        // Look up by userId or nasabahId (using adminClient to bypass RLS during login)
        let query = adminClient.from('nasabah_profiles').select('pin_hash');
        if (nasabahId) {
            query = query.eq('id', nasabahId);
        } else if (userId) {
            query = query.eq('user_id', userId);
        } else {
            return NextResponse.json(
                { success: false, error: 'userId atau nasabahId wajib' },
                { status: 400 },
            );
        }

        const { data, error } = await query.single();

        if (error || !data) {
            return NextResponse.json(
                { success: false, error: 'Profil nasabah tidak ditemukan' },
                { status: 404 },
            );
        }

        const isValid = await bcrypt.compare(pin, data.pin_hash);

        return NextResponse.json({ success: isValid, error: isValid ? undefined : 'PIN salah' });
    } catch (error) {
        console.error('PIN verify error:', error);
        return NextResponse.json(
            { success: false, error: 'Terjadi kesalahan server' },
            { status: 500 },
        );
    }
}
