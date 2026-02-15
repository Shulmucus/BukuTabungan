import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';
import bcrypt from 'bcryptjs';

// GET /api/transactions
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        // 1. Check if requester is admin
        const { data: adminCheck } = await supabase.from('users').select('role').eq('id', currentUser?.id).single();
        const isAdmin = adminCheck?.role === 'admin';

        const adminClient = createAdminClient();
        const targetClient = isAdmin ? adminClient : supabase;

        const sp = request.nextUrl.searchParams;
        const page = parseInt(sp.get('page') || '1');
        const pageSize = parseInt(sp.get('pageSize') || '10');
        const nasabahId = sp.get('nasabah_id');
        const type = sp.get('type');
        const dateFrom = sp.get('date_from');
        const dateTo = sp.get('date_to');
        const search = sp.get('search');

        let query = targetClient
            .from('transactions')
            .select('*, nasabah:nasabah_profiles(*, user:users(full_name, email)), performer:users!transactions_performed_by_fkey(full_name)', { count: 'exact' });

        if (nasabahId) query = query.eq('nasabah_id', nasabahId);
        if (type) query = query.eq('transaction_type', type);
        if (dateFrom) query = query.gte('transaction_date', dateFrom);
        if (dateTo) query = query.lte('transaction_date', dateTo);
        if (search) query = query.ilike('description', `%${search}%`);

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) {
            return NextResponse.json({ success: false, error: 'DB Error: ' + error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    } catch (error: any) {
        console.error('GET transactions error:', error);
        return NextResponse.json({ success: false, error: 'Server Catch: ' + (error?.message || 'Unknown error') }, { status: 500 });
    }
}

// POST /api/transactions — create deposit/withdrawal
export async function POST(request: NextRequest) {
    console.log('--- POST /api/transactions START ---');
    try {
        const body = await request.json();
        const { nasabah_id, transaction_type, amount, description, pin } = body;

        console.log('Request body:', { nasabah_id, transaction_type, amount, pin: '******' });

        if (!nasabah_id || !transaction_type || !amount || amount <= 0 || !pin) {
            return NextResponse.json({ success: false, error: 'Data transaksi tidak lengkap' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn('Unauthorized attempt to /api/transactions');
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Authenticated user:', user.id);

        // 1. PIN Verification & Profile Fetch
        const { data: profile, error: profileError } = await supabase
            .from('nasabah_profiles')
            .select('pin_hash, balance')
            .eq('id', nasabah_id)
            .single();

        if (profileError || !profile) {
            console.error('Profile fetch error:', profileError);
            return NextResponse.json({ success: false, error: 'Profil nasabah tidak ditemukan atau error database' }, { status: 404 });
        }

        console.log('Profile found, verifying PIN...');
        if (!profile.pin_hash) {
            console.error('PIN hash is missing for nasabah:', nasabah_id);
            return NextResponse.json({ success: false, error: 'PIN belum diatur untuk akun ini' }, { status: 400 });
        }

        let isPinValid = false;
        try {
            console.log('Comparing PIN with hash:', { hashLen: profile.pin_hash.length, pinLen: pin.length });
            isPinValid = await bcrypt.compare(String(pin), profile.pin_hash);
        } catch (bcryptError: any) {
            console.error('Bcrypt compare error:', bcryptError);
            return NextResponse.json({ success: false, error: 'Error saat verifikasi PIN: ' + bcryptError.message }, { status: 500 });
        }

        if (!isPinValid) {
            console.warn('Invalid PIN attempt for nasabah:', nasabah_id);
            return NextResponse.json({ success: false, error: 'PIN salah' }, { status: 401 });
        }

        console.log('PIN verified successfully');

        const adminClient = createAdminClient(); // Admin client for mutations

        // 2. Balance Logic
        const balanceBefore = Number(profile.balance);
        const txAmount = Number(amount);
        let balanceAfter = balanceBefore;

        if (transaction_type === 'deposit') {
            balanceAfter = balanceBefore + txAmount;
        } else if (transaction_type === 'withdrawal') {
            if (balanceBefore < txAmount) {
                return NextResponse.json({ success: false, error: 'Saldo tidak mencukupi' }, { status: 400 });
            }
            balanceAfter = balanceBefore - txAmount;
        } else {
            return NextResponse.json({ success: false, error: 'Jenis transaksi tidak valid' }, { status: 400 });
        }

        console.log(`Balance update: ${balanceBefore} -> ${balanceAfter}`);

        // 3. Insert Transaction (using adminClient to bypass RLS)
        const { data: transaction, error: txError } = await adminClient
            .from('transactions')
            .insert({
                nasabah_id,
                transaction_type,
                amount: txAmount,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                description,
                performed_by: user.id
            })
            .select()
            .single();

        if (txError) {
            console.error('Insert transaction error:', txError);
            return NextResponse.json({ success: false, error: 'Gagal mencatat transaksi: ' + txError.message }, { status: 500 });
        }

        console.log('Transaction inserted:', transaction.id);

        // 4. Update Saldo (using adminClient)
        const { error: updateError } = await adminClient
            .from('nasabah_profiles')
            .update({ balance: balanceAfter })
            .eq('id', nasabah_id);

        if (updateError) {
            console.error('Update saldo error:', updateError);
            // Consider rolling back transaction record if balance update fails
            await adminClient.from('transactions').delete().eq('id', transaction.id);
            return NextResponse.json({ success: false, error: 'Gagal memperbarui saldo' }, { status: 500 });
        }

        await logActivity({
            supabase,
            userId: user.id,
            action: 'create',
            entityType: 'transaction',
            entityId: transaction.id, // Changed from txData.id to transaction.id
            details: { transaction_type, amount: txAmount }
        });

        console.log('--- POST /api/transactions SUCCESS ---');
        return NextResponse.json({ success: true, data: transaction });
    } catch (error: any) {
        console.error('POST transaction fatal error:', error);
        return NextResponse.json({
            success: false,
            error: 'Fatal Error: ' + (error?.message || 'Unknown server error'),
            stack: error?.stack
        }, { status: 500 });
    }
}
