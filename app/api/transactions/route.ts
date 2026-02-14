import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity-logger';

// GET /api/transactions
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const sp = request.nextUrl.searchParams;
        const page = parseInt(sp.get('page') || '1');
        const pageSize = parseInt(sp.get('pageSize') || '10');
        const nasabahId = sp.get('nasabah_id');
        const type = sp.get('type');
        const dateFrom = sp.get('date_from');
        const dateTo = sp.get('date_to');
        const search = sp.get('search');

        let query = supabase
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
        console.error('GET transactions error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

// POST /api/transactions — create deposit/withdrawal
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nasabah_id, transaction_type, amount, description } = body;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (!nasabah_id || !transaction_type || !amount || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Data transaksi tidak lengkap' }, { status: 400 });
        }

        // Get current balance
        const { data: nasabah, error: nasabahError } = await supabase
            .from('nasabah_profiles')
            .select('balance')
            .eq('id', nasabah_id)
            .single();

        if (nasabahError || !nasabah) {
            return NextResponse.json({ success: false, error: 'Nasabah tidak ditemukan' }, { status: 404 });
        }

        const balanceBefore = Number(nasabah.balance);
        let balanceAfter: number;

        if (transaction_type === 'deposit') {
            balanceAfter = balanceBefore + Number(amount);
        } else if (transaction_type === 'withdrawal') {
            if (balanceBefore < Number(amount)) {
                return NextResponse.json({ success: false, error: 'Saldo tidak mencukupi' }, { status: 400 });
            }
            balanceAfter = balanceBefore - Number(amount);
        } else {
            return NextResponse.json({ success: false, error: 'Jenis transaksi tidak valid' }, { status: 400 });
        }

        // Insert transaction
        const { data: txData, error: txError } = await supabase
            .from('transactions')
            .insert({
                nasabah_id,
                transaction_type,
                amount: Number(amount),
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                description: description || null,
                performed_by: user.id,
            })
            .select()
            .single();

        if (txError) {
            return NextResponse.json({ success: false, error: txError.message }, { status: 500 });
        }

        // Update balance
        await supabase
            .from('nasabah_profiles')
            .update({ balance: balanceAfter })
            .eq('id', nasabah_id);

        await logActivity({
            supabase,
            userId: user.id,
            action: 'create',
            entityType: 'transaction',
            entityId: txData.id,
            details: { transaction_type, amount, nasabah_id },
        });

        return NextResponse.json({ success: true, data: txData, message: 'Transaksi berhasil' });
    } catch (error) {
        console.error('POST transaction error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
