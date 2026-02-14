import { createClient } from '@/lib/supabase/server';
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

        const supabase = await createClient();

        // Look up by userId or nasabahId
        let query = supabase.from('nasabah_profiles').select('pin_hash');
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
