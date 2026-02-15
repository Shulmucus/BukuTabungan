'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/ui/Header';
import { StatCard, Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, transactionTypeLabels } from '@/lib/utils';
import { NasabahProfile, Transaction } from '@/lib/types';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import {
    HiOutlineBanknotes,
    HiOutlineCreditCard,
    HiOutlineClock,
    HiOutlineArrowsRightLeft,
} from 'react-icons/hi2';
import { PinModal } from '@/components/ui/PinModal';
import { Modal } from '@/components/ui/Modal';
import { FormInput } from '@/components/ui/FormField';

export default function NasabahDashboard() {
    const [profile, setProfile] = useState<NasabahProfile | null>(null);
    const [recentTx, setRecentTx] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [showTxModal, setShowTxModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [txType, setTxType] = useState<'deposit' | 'withdrawal' | 'transfer_out'>('deposit');
    const [txForm, setTxForm] = useState({ amount: '', description: '', toAccount: '' });
    const [txLoading, setTxLoading] = useState(false);
    const [txError, setTxError] = useState('');

    const fetchData = async () => {
        try {
            console.log('Fetching nasabah dashboard data...');
            const [profileRes, txRes] = await Promise.all([
                fetch('/api/nasabah/me'),
                fetch('/api/nasabah/me/transactions?pageSize=5'),
            ]);

            console.log('Profile Response Status:', profileRes.status, profileRes.headers.get('content-type'));
            console.log('Transactions Response Status:', txRes.status, txRes.headers.get('content-type'));

            if (!profileRes.ok) {
                const text = await profileRes.text();
                console.error('Profile fetch failed:', text.substring(0, 100));
                return;
            }
            if (!txRes.ok) {
                const text = await txRes.text();
                console.error('Transactions fetch failed:', text.substring(0, 100));
                return;
            }

            const profileData = await profileRes.json();
            const txData = await txRes.json();

            if (profileData.success) setProfile(profileData.data);
            if (txData.success) setRecentTx(txData.data || []);
        } catch (err) {
            console.error('FetchData error details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <PageLoader />;

    return (
        <div>
            <Header title="Dashboard Nasabah" subtitle="Selamat datang kembali" />

            {/* Balance card */}
            <div className="mb-8 animate-fade-in">
                <div className="bg-gradient-primary rounded-2xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

                    <div className="relative">
                        <p className="text-sm text-white/60 mb-1">Saldo Anda</p>
                        <p className="text-4xl font-bold mb-4">
                            {formatCurrency(Number(profile?.balance || 0))}
                        </p>
                        <div className="flex gap-6 text-sm">
                            <div>
                                <p className="text-white/50">No. Rekening</p>
                                <p className="font-mono font-semibold">{profile?.account_number}</p>
                            </div>
                            <div>
                                <p className="text-white/50">Nama</p>
                                <p className="font-semibold">{profile?.user?.full_name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <button
                    onClick={() => { setTxType('deposit'); setShowTxModal(true); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-surface-100 hover:border-primary-200 hover:bg-primary-50 transition-all group shadow-sm"
                >
                    <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <HiOutlineBanknotes className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-surface-700">Setor Tunai</span>
                </button>
                <button
                    onClick={() => { setTxType('withdrawal'); setShowTxModal(true); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-surface-100 hover:border-danger-200 hover:bg-danger-50 transition-all group shadow-sm"
                >
                    <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <HiOutlineBanknotes className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-surface-700">Tarik Tunai</span>
                </button>
                <button
                    onClick={() => { setTxType('transfer_out'); setShowTxModal(true); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-surface-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group shadow-sm"
                >
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <HiOutlineArrowsRightLeft className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold text-surface-700">Transfer</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard
                    title="Saldo Tersedia"
                    value={formatCurrency(Number(profile?.balance || 0))}
                    icon={<HiOutlineBanknotes />}
                    color="success"
                    className="animate-fade-in animate-delay-1"
                />
                <StatCard
                    title="No. Rekening"
                    value={profile?.account_number || '-'}
                    icon={<HiOutlineCreditCard />}
                    color="primary"
                    className="animate-fade-in animate-delay-2"
                />
                <StatCard
                    title="Transaksi Terakhir"
                    value={recentTx.length}
                    icon={<HiOutlineClock />}
                    color="accent"
                    className="animate-fade-in animate-delay-3"
                />
            </div>

            {/* Recent transactions */}
            <Card className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-surface-900">Transaksi Terakhir</h3>
                    <div className="flex gap-4">
                        <a
                            href="/dashboard/nasabah/recap"
                            className="text-sm text-surface-500 hover:text-primary-600 font-medium transition-colors"
                        >
                            History Recap →
                        </a>
                        <a
                            href="/dashboard/nasabah/transactions"
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                        >
                            Lihat Semua →
                        </a>
                    </div>
                </div>

                {recentTx.length === 0 ? (
                    <p className="text-sm text-surface-400 py-8 text-center">Belum ada transaksi</p>
                ) : (
                    <div className="space-y-3">
                        {recentTx.map((tx) => {
                            const isCredit = tx.transaction_type === 'deposit' || tx.transaction_type === 'transfer_in';
                            return (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {isCredit ? '+' : '-'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-surface-900">
                                                <Badge variant={isCredit ? 'success' : 'danger'} className="text-[10px]">
                                                    {transactionTypeLabels[tx.transaction_type]}
                                                </Badge>
                                            </p>
                                            <p className="text-xs text-surface-400">{formatDate(tx.transaction_date)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-semibold ${isCredit ? 'text-success-600' : 'text-danger-600'}`}>
                                            {isCredit ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                                        </p>
                                        <p className="text-xs text-surface-400">Saldo: {formatCurrency(Number(tx.balance_after))}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
            {/* Transaction Modal */}
            <Modal
                isOpen={showTxModal}
                onClose={() => setShowTxModal(false)}
                title={txType === 'deposit' ? 'Setor Tunai' : txType === 'withdrawal' ? 'Tarik Tunai' : 'Transfer Dana'}
            >
                <div className="space-y-4">
                    {txType === 'transfer_out' && (
                        <FormInput
                            label="Rekening Tujuan"
                            placeholder="Contoh: 1000..."
                            value={txForm.toAccount}
                            onChange={(e) => setTxForm({ ...txForm, toAccount: e.target.value })}
                            required
                        />
                    )}
                    <FormInput
                        label="Nominal"
                        type="number"
                        placeholder="0"
                        value={txForm.amount}
                        onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                        required
                    />
                    <FormInput
                        label="Keterangan"
                        placeholder="Opsional"
                        value={txForm.description}
                        onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                    />
                    {txError && <p className="text-sm text-danger-500">{txError}</p>}
                    <button
                        onClick={() => {
                            if (!txForm.amount || (txType === 'transfer_out' && !txForm.toAccount)) {
                                setTxError('Harap lengkapi semua field');
                                return;
                            }
                            setShowTxModal(false);
                            setShowPinModal(true);
                        }}
                        className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all shadow-lg"
                    >
                        Lanjutkan
                    </button>
                </div>
            </Modal>

            {/* PIN Modal */}
            <PinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onVerify={async (pin) => {
                    setTxLoading(true);
                    setTxError('');
                    try {
                        const endpoint = txType === 'transfer_out' ? '/api/transfers' : '/api/transactions';
                        const res = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...(txType === 'transfer_out'
                                    ? { to_account: txForm.toAccount, from_nasabah_id: profile?.id }
                                    : { nasabah_id: profile?.id, transaction_type: txType }),
                                amount: Number(txForm.amount),
                                description: txForm.description,
                                pin // PIN for verification on server
                            }),
                        });
                        const data = await res.json();
                        if (data.success) {
                            setShowTxModal(false);
                            setShowPinModal(false);
                            setTxForm({ amount: '', description: '', toAccount: '' });
                            fetchData();
                            return { success: true };
                        } else {
                            const errorMsg = data.error || 'Transaksi gagal';
                            setTxError(errorMsg);
                            return { success: false, error: errorMsg };
                        }
                    } catch (err: any) {
                        const errorMsg = 'Terjadi kesalahan koneksi';
                        setTxError(errorMsg);
                        return { success: false, error: errorMsg };
                    } finally {
                        setTxLoading(false);
                    }
                }}
            />
        </div>
    );
}
