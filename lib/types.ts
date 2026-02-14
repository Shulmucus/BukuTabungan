// ============================================
// Buku Tabungan — Shared TypeScript Types
// ============================================

export type UserRole = 'admin' | 'petugas' | 'nasabah';

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out';

export type TransferStatus = 'pending' | 'completed' | 'failed';

export type ActivityAction = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view';

export type EntityType = 'nasabah' | 'transaction' | 'transfer' | 'user';

export interface User {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    full_name: string;
    phone_number: string | null;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface NasabahProfile {
    id: string;
    user_id: string;
    account_number: string;
    balance: number;
    pin_hash: string;
    address: string | null;
    id_card_number: string | null;
    date_of_birth: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    user?: User;
}

export interface Transaction {
    id: string;
    nasabah_id: string;
    transaction_type: TransactionType;
    amount: number;
    balance_before: number;
    balance_after: number;
    description: string | null;
    performed_by: string | null;
    created_at: string;
    transaction_date: string;
    // Joined fields
    nasabah?: NasabahProfile;
    performer?: User;
}

export interface Transfer {
    id: string;
    from_nasabah_id: string;
    to_nasabah_id: string;
    amount: number;
    description: string | null;
    status: TransferStatus;
    performed_by: string | null;
    created_at: string;
    completed_at: string | null;
    // Joined fields
    from_nasabah?: NasabahProfile;
    to_nasabah?: NasabahProfile;
    performer?: User;
}

export interface ActivityLog {
    id: string;
    user_id: string;
    action: ActivityAction;
    entity_type: EntityType;
    entity_id: string | null;
    details: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    // Joined
    user?: User;
}

// ---- API / Form helpers ----

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface TransactionFilters {
    nasabah_id?: string;
    transaction_type?: TransactionType;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}

export interface NasabahFormData {
    email: string;
    username: string;
    password: string;
    full_name: string;
    phone_number: string;
    pin: string;
    address: string;
    id_card_number: string;
    date_of_birth: string;
}

export interface TransactionFormData {
    nasabah_id: string;
    transaction_type: TransactionType;
    amount: number;
    description: string;
    pin: string;
}

export interface TransferFormData {
    from_nasabah_id: string;
    to_nasabah_id: string;
    amount: number;
    description: string;
    pin: string;
}
