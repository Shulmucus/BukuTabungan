import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/activity-logger';
import { generateAccountNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, username, password, full_name, phone_number, pin, address, id_card_number, date_of_birth, role } = body;

        if (!email || !username || !password || !full_name) {
            return NextResponse.json(
                { success: false, error: 'Field wajib belum diisi' },
                { status: 400 },
            );
        }

        const supabase = await createClient();

        // Check if admin is making this request
        const {
            data: { user: currentUser },
        } = await supabase.auth.getUser();

        let assignedRole = role || 'nasabah';

        // AUTO-PROMOTE ADMIN LOGIC
        if (email.toLowerCase() === 'admin@gmail.com') {
            assignedRole = 'admin';
        }

        // Access control for role assignment (except auto-promote)
        if (assignedRole !== 'nasabah' && assignedRole !== 'admin') {
            // Allow 'admin' role if email matches hardcoded admin email, otherwise check permissions
            if (email.toLowerCase() !== 'admin@gmail.com') {
                if (!currentUser) {
                    return NextResponse.json({ success: false, error: 'Unauthorized role assignment' }, { status: 403 });
                }
                const { data: adminCheck } = await supabase.from('users').select('role').eq('id', currentUser.id).single();
                if (adminCheck?.role !== 'admin') {
                    return NextResponse.json({ success: false, error: 'Hanya admin yang dapat membuat akun non-nasabah' }, { status: 403 });
                }
            }
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username, full_name, role: assignedRole },
            },
        });

        if (authError || !authData.user) {
            return NextResponse.json(
                { success: false, error: authError?.message || 'Gagal membuat akun' },
                { status: 400 },
            );
        }

        // Insert into users table
        const { error: userError } = await supabase.from('users').insert({
            id: authData.user.id,
            email,
            username,
            role: assignedRole,
            full_name,
            phone_number: phone_number || null,
        });

        if (userError) {
            // Rollback auth user creation if DB insert fails (optional but good practice)
            // await supabase.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json(
                { success: false, error: 'Gagal menyimpan data user: ' + userError.message },
                { status: 500 },
            );
        }

        // If role is nasabah, create profile (PIN can be null initially, set via /setup-pin)
        if (assignedRole === 'nasabah') {
            const accountNumber = generateAccountNumber();
            let pinHash = '';

            // If PIN is provided (e.g. by admin), hash it. Otherwise leave empty string/null logic
            // Migration schema has pin_hash NOT NULL, so we need to handle this.
            // Option 1: Requirement change -> Allow NULL pin_hash in DB?
            // Option 2: Use a strict placeholder that fails login? 
            // Better: Update migration to allow NULL pin_hash OR provide strict dummy.
            // Let's assume we modify migration or use a placeholder that clearly indicates "NO_PIN_SET"

            if (pin && pin.length === 6) {
                pinHash = await bcrypt.hash(pin, 10);
            } else {
                pinHash = 'NO_PIN_SET'; // Flag for middleware/login to detect and redirect
            }

            const { error: profileError } = await supabase.from('nasabah_profiles').insert({
                user_id: authData.user.id,
                account_number: accountNumber,
                pin_hash: pinHash,
                address: address || null,
                id_card_number: id_card_number || null,
                date_of_birth: date_of_birth || null,
            });

            if (profileError) {
                return NextResponse.json(
                    { success: false, error: 'Gagal membuat profil nasabah: ' + profileError.message },
                    { status: 500 },
                );
            }
        }

        // Log activity
        await logActivity({
            supabase,
            userId: currentUser?.id || authData.user.id, // If self-signup, log as self
            action: 'create',
            entityType: 'user',
            entityId: authData.user.id,
            details: { created_role: assignedRole, email },
        });

        return NextResponse.json({
            success: true,
            message: 'Akun berhasil dibuat',
            userId: authData.user.id,
        });
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json(
            { success: false, error: 'Terjadi kesalahan server' },
            { status: 500 },
        );
    }
}
