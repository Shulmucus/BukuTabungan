import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';
import bcrypt from 'bcryptjs';

// GET /api/transfers
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
        const status = sp.get('status');

        let query = targetClient
            .from('transfers')
            .select(
                '*, from_nasabah:nasabah_profiles!transfers_from_nasabah_id_fkey(account_number, user:users(full_name)), to_nasabah:nasabah_profiles!transfers_to_nasabah_id_fkey(account_number, user:users(full_name)), performer:users!transfers_performed_by_fkey(full_name)',
                { count: 'exact' },
            );

        if (status) query = query.eq('status', status);

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
        console.error('GET transfers error:', error);
        return NextResponse.json({ success: false, error: 'Catch: ' + error?.message }, { status: 500 });
    }
}

// POST /api/transfers — execute a transfer
export async function POST(request: NextRequest) {
    console.log('--- POST /api/transfers START ---');
    try {
        const body = await request.json();
        const { from_nasabah_id, to_account, amount, description, pin } = body;

        console.log('Transfer Request Body:', { from_nasabah_id, to_account, amount, pin: '******' });

        if (!from_nasabah_id || !to_account || !amount || amount <= 0 || !pin) {
            return NextResponse.json({ success: false, error: 'Data transfer tidak lengkap' }, { status: 400 });
        }

        const supabase = await createClient();
        const adminClient = createAdminClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 1. PIN Verification & Fetch Sender (using adminClient)
        const { data: fromNasabah, error: fromError } = await adminClient
            .from('nasabah_profiles')
            .select('id, balance, pin_hash, account_number')
            .eq('id', from_nasabah_id)
            .single();

        if (fromError || !fromNasabah) {
            console.error('Sender fetch error:', fromError);
            return NextResponse.json({ success: false, error: 'Nasabah pengirim tidak ditemukan' }, { status: 404 });
        }

        if (fromNasabah.account_number === to_account) {
            return NextResponse.json({ success: false, error: 'Tidak dapat transfer ke rekening sendiri' }, { status: 400 });
        }

        if (!fromNasabah.pin_hash) {
            return NextResponse.json({ success: false, error: 'PIN belum diatur untuk akun ini' }, { status: 400 });
        }

        let isPinValid = false;
        try {
            console.log('Verifying Transfer PIN...');
            isPinValid = await bcrypt.compare(String(pin), fromNasabah.pin_hash);
        } catch (bcryptError: any) {
            console.error('Bcrypt compare error (transfer):', bcryptError);
            return NextResponse.json({ success: false, error: 'Error verifikasi PIN: ' + bcryptError.message }, { status: 500 });
        }

        if (!isPinValid) {
            return NextResponse.json({ success: false, error: 'PIN salah' }, { status: 401 });
        }

        // 2. Fetch Receiver (using adminClient)
        const { data: toNasabah, error: toError } = await adminClient
            .from('nasabah_profiles')
            .select('id, balance')
            .eq('account_number', to_account)
            .single();

        if (toError || !toNasabah) {
            console.error('Receiver account not found:', to_account);
            return NextResponse.json({ success: false, error: 'Rekening tujuan tidak ditemukan' }, { status: 404 });
        }

        const senderBalance = Number(fromNasabah.balance);
        const transferAmount = Number(amount);

        if (senderBalance < transferAmount) {
            return NextResponse.json({ success: false, error: 'Saldo tidak mencukupi' }, { status: 400 });
        }

        const senderNewBalance = senderBalance - transferAmount;
        const receiverNewBalance = Number(toNasabah.balance) + transferAmount;

        // 3. Create transfer record (using adminClient)
        const { data: transferData, error: transferError } = await adminClient
            .from('transfers')
            .insert({
                from_nasabah_id,
                to_nasabah_id: toNasabah.id,
                amount: transferAmount,
                description: description || null,
                status: 'completed',
                performed_by: user.id,
                completed_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (transferError) {
            console.error('Insert transfer error:', transferError);
            return NextResponse.json({ success: false, error: 'Gagal mencatat data transfer: ' + transferError.message }, { status: 500 });
        }

        // 4. Create transaction records for both parties (using adminClient)
        const { error: txsError } = await adminClient.from('transactions').insert([
            {
                nasabah_id: from_nasabah_id,
                transaction_type: 'transfer_out',
                amount: transferAmount,
                balance_before: senderBalance,
                balance_after: senderNewBalance,
                description: description || `Transfer ke ${to_account}`,
                performed_by: user.id,
            },
            {
                nasabah_id: toNasabah.id,
                transaction_type: 'transfer_in',
                amount: transferAmount,
                balance_before: Number(toNasabah.balance),
                balance_after: receiverNewBalance,
                description: description || `Transfer dari ${fromNasabah.account_number}`,
                performed_by: user.id,
            },
        ]);

        if (txsError) {
            console.error('Insert transfer transactions error:', txsError);
        }

        // 5. Update balances (using adminClient)
        const { error: updateFromError } = await adminClient.from('nasabah_profiles').update({ balance: senderNewBalance }).eq('id', from_nasabah_id);
        const { error: updateToError } = await adminClient.from('nasabah_profiles').update({ balance: receiverNewBalance }).eq('id', toNasabah.id);

        if (updateFromError || updateToError) {
            console.error('Update balances transfer error:', updateFromError, updateToError);
        }

        await logActivity({
            supabase: adminClient,
            userId: user.id,
            action: 'create',
            entityType: 'transfer',
            entityId: transferData.id,
            details: { amount: transferAmount, to_account }
        });

        console.log('--- POST /api/transfers SUCCESS ---');
        return NextResponse.json({ success: true, data: transferData });
    } catch (error: any) {
        console.error('POST transfer fatal error:', error);
        return NextResponse.json({ success: false, error: 'Fatal Error: ' + error?.message }, { status: 500 });
    }
}
