import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';

// GET /api/nasabah/[id]
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('nasabah_profiles')
            .select('*, user:users(*)')
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json({ success: false, error: 'Nasabah tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('GET nasabah detail error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

// PUT /api/nasabah/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Update nasabah profile
        const profileUpdate: Record<string, unknown> = {};
        if (body.address !== undefined) profileUpdate.address = body.address;
        if (body.id_card_number !== undefined) profileUpdate.id_card_number = body.id_card_number;
        if (body.date_of_birth !== undefined) profileUpdate.date_of_birth = body.date_of_birth;

        if (Object.keys(profileUpdate).length > 0) {
            const { error } = await supabase
                .from('nasabah_profiles')
                .update(profileUpdate)
                .eq('id', id);
            if (error) {
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }
        }

        // Update user info if provided
        const { data: profile } = await supabase
            .from('nasabah_profiles')
            .select('user_id')
            .eq('id', id)
            .single();

        if (profile) {
            const userUpdate: Record<string, unknown> = {};
            if (body.full_name) userUpdate.full_name = body.full_name;
            if (body.phone_number !== undefined) userUpdate.phone_number = body.phone_number;
            if (body.is_active !== undefined) userUpdate.is_active = body.is_active;

            if (Object.keys(userUpdate).length > 0) {
                await supabase.from('users').update(userUpdate).eq('id', profile.user_id);
            }
        }

        await logActivity({
            supabase,
            userId: user.id,
            action: 'update',
            entityType: 'nasabah',
            entityId: id,
            details: { updated_fields: Object.keys({ ...profileUpdate, ...body }) },
        });

        return NextResponse.json({ success: true, message: 'Data nasabah berhasil diperbarui' });
    } catch (error) {
        console.error('PUT nasabah error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

// DELETE /api/nasabah/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Soft delete by deactivating
        const { data: profile } = await supabase
            .from('nasabah_profiles')
            .select('user_id')
            .eq('id', id)
            .single();

        if (!profile) {
            return NextResponse.json({ success: false, error: 'Nasabah tidak ditemukan' }, { status: 404 });
        }

        await supabase.from('users').update({ is_active: false }).eq('id', profile.user_id);

        await logActivity({
            supabase,
            userId: user.id,
            action: 'delete',
            entityType: 'nasabah',
            entityId: id,
        });

        return NextResponse.json({ success: true, message: 'Nasabah berhasil dinonaktifkan' });
    } catch (error) {
        console.error('DELETE nasabah error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
