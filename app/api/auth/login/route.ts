import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { identifier, password } = await request.json(); // identifier = username OR email

        if (!identifier || !password) {
            return NextResponse.json(
                { success: false, error: 'Username/Email dan password wajib diisi' },
                { status: 400 },
            );
        }

        const supabase = await createClient();
        let emailToLogin = identifier; // Initialize emailToLogin with identifier

        // Check if identifier is a username (no @ symbol)
        if (!identifier.includes('@')) {
            // Use RPC to securely fetch email/role/status by username
            const { data: userMap, error: rpcError } = await supabase.rpc('get_user_by_username', { p_username: identifier });

            if (userMap && userMap.length > 0) {
                const userData = userMap[0];
                emailToLogin = userData.email;

                if (!userData.is_active) {
                    return NextResponse.json({ success: false, error: 'Akun Anda dinonaktifkan' }, { status: 403 });
                }
            } else {
                return NextResponse.json({ success: false, error: 'Login dengan username gagal (User tidak ditemukan)' }, { status: 400 });
            }
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: emailToLogin,
            password,
        });

        if (authError || !authData.user) {
            return NextResponse.json(
                { success: false, error: 'Email/Username atau password salah' },
                { status: 401 },
            );
        }

        // Fetch user data from public table
        // We use the authenticated client to fetch the user's role
        const { data: userData } = await supabase
            .from('users')
            .select('role, is_active')
            .eq('id', authData.user.id)
            .single();

        // If lookup fails in public table, fallback to user metadata for the role
        // This handles cases where RLS or syncing delays might occur
        const role = userData?.role || authData.user.user_metadata?.role;
        const isActive = userData?.is_active ?? true;

        if (!role) {
            await supabase.auth.signOut();
            return NextResponse.json(
                { success: false, error: 'Data akun tidak ditemukan. Pastikan Anda sudah terdaftar.' },
                { status: 404 },
            );
        }

        if (!isActive) {
            await supabase.auth.signOut();
            return NextResponse.json(
                { success: false, error: 'Akun Anda dinonaktifkan' },
                { status: 403 },
            );
        }

        // CHECK NASABAH PIN STATUS
        let redirectUrl = null;
        if (role === 'nasabah') {
            const { data: profile } = await supabase.from('nasabah_profiles').select('pin_hash').eq('user_id', authData.user.id).single();
            // Check if PIN is not set or is the placeholder
            if (!profile || !profile.pin_hash || profile.pin_hash === 'NO_PIN_SET') {
                redirectUrl = '/setup-pin';
            }
        }

        // Log login activity
        await logActivity({
            supabase,
            userId: authData.user.id,
            action: 'login',
            entityType: 'user',
            entityId: authData.user.id,
            details: { method: 'password', identifier_type: identifier.includes('@') ? 'email' : 'username' },
        });

        return NextResponse.json({
            success: true,
            role: role,
            userId: authData.user.id,
            redirect: redirectUrl
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Terjadi kesalahan server' },
            { status: 500 },
        );
    }
}
