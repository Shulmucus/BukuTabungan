import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { validatePin } from '@/lib/validation';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
    try {
        const { pin } = await request.json();

        // 1. Basic validation
        const pinValidation = validatePin(pin);
        if (!pinValidation.isValid) {
            return NextResponse.json({ success: false, error: pinValidation.error }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Hash PIN
        const pinHash = await bcrypt.hash(pin, 10);

        // 3. Update nasabah profile
        const { error: profileError } = await supabase
            .from('nasabah_profiles')
            .update({ pin_hash: pinHash })
            .eq('user_id', user.id);

        if (profileError) {
            return NextResponse.json({ success: false, error: profileError.message }, { status: 500 });
        }

        // 4. Log Activity
        await logActivity({
            supabase,
            userId: user.id,
            action: 'update',
            entityType: 'nasabah',
            entityId: user.id,
            details: { action: 'setup_pin' }
        });

        return NextResponse.json({ success: true, message: 'PIN berhasil diatur' });
    } catch (error) {
        console.error('Setup PIN API error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
