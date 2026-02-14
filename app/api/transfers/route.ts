import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';

// GET /api/transfers
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const sp = request.nextUrl.searchParams;
        const page = parseInt(sp.get('page') || '1');
        const pageSize = parseInt(sp.get('pageSize') || '10');
        const status = sp.get('status');

        let query = supabase
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
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        });
    } catch (error) {
        console.error('GET transfers error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

// POST /api/transfers — execute a transfer
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { from_nasabah_id, to_nasabah_id, amount, description } = body;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (!from_nasabah_id || !to_nasabah_id || !amount || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Data transfer tidak lengkap' }, { status: 400 });
        }

        if (from_nasabah_id === to_nasabah_id) {
            return NextResponse.json({ success: false, error: 'Tidak dapat transfer ke rekening sendiri' }, { status: 400 });
        }

        // Get sender balance
        const { data: sender } = await supabase
            .from('nasabah_profiles')
            .select('balance')
            .eq('id', from_nasabah_id)
            .single();

        const { data: receiver } = await supabase
            .from('nasabah_profiles')
            .select('balance')
            .eq('id', to_nasabah_id)
            .single();

        if (!sender || !receiver) {
            return NextResponse.json({ success: false, error: 'Nasabah tidak ditemukan' }, { status: 404 });
        }

        const senderBalance = Number(sender.balance);
        const transferAmount = Number(amount);

        if (senderBalance < transferAmount) {
            return NextResponse.json({ success: false, error: 'Saldo pengirim tidak mencukupi' }, { status: 400 });
        }

        const senderNewBalance = senderBalance - transferAmount;
        const receiverNewBalance = Number(receiver.balance) + transferAmount;

        // Create transfer record
        const { data: transferData, error: transferError } = await supabase
            .from('transfers')
            .insert({
                from_nasabah_id,
                to_nasabah_id,
                amount: transferAmount,
                description: description || null,
                status: 'completed',
                performed_by: user.id,
                completed_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (transferError) {
            return NextResponse.json({ success: false, error: transferError.message }, { status: 500 });
        }

        // Create transaction records for both parties
        await supabase.from('transactions').insert([
            {
                nasabah_id: from_nasabah_id,
                transaction_type: 'transfer_out',
                amount: transferAmount,
                balance_before: senderBalance,
                balance_after: senderNewBalance,
                description: description || 'Transfer keluar',
                performed_by: user.id,
            },
            {
                nasabah_id: to_nasabah_id,
                transaction_type: 'transfer_in',
                amount: transferAmount,
                balance_before: Number(receiver.balance),
                balance_after: receiverNewBalance,
                description: description || 'Transfer masuk',
                performed_by: user.id,
            },
        ]);

        // Update balances
        await supabase.from('nasabah_profiles').update({ balance: senderNewBalance }).eq('id', from_nasabah_id);
        await supabase.from('nasabah_profiles').update({ balance: receiverNewBalance }).eq('id', to_nasabah_id);

        await logActivity({
            supabase,
            userId: user.id,
            action: 'create',
            entityType: 'transfer',
            entityId: transferData.id,
            details: { from_nasabah_id, to_nasabah_id, amount: transferAmount },
        });

        return NextResponse.json({ success: true, data: transferData, message: 'Transfer berhasil' });
    } catch (error) {
        console.error('POST transfer error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
