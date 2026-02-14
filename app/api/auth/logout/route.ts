import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';

export async function POST() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (user) {
            await logActivity({
                supabase,
                userId: user.id,
                action: 'logout',
                entityType: 'user',
                entityId: user.id,
            });
        }

        await supabase.auth.signOut();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, error: 'Terjadi kesalahan' },
            { status: 500 },
        );
    }
}
