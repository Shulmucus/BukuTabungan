import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { pin } = await request.json();

        if (!pin || pin.length !== 6) {
            return NextResponse.json({ success: false, error: 'PIN invalid format' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const pinHash = await bcrypt.hash(pin, 10);

        const { error } = await supabase
            .from('nasabah_profiles')
            .update({ pin_hash: pinHash })
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'PIN berhasil disimpan' });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
