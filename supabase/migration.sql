-- =============================================
-- Buku Tabungan — Complete Database Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'petugas', 'nasabah');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'transfer_in', 'transfer_out');
CREATE TYPE transfer_status AS ENUM ('pending', 'completed', 'failed');

-- 2. Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'nasabah',
  full_name TEXT NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 3. Nasabah profiles
CREATE TABLE nasabah_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_number TEXT UNIQUE NOT NULL,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  pin_hash TEXT NOT NULL,
  address TEXT,
  id_card_number TEXT,
  date_of_birth DATE,
  transaction_limit DECIMAL(15,2) NOT NULL DEFAULT 10000000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 4. Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nasabah_id UUID NOT NULL REFERENCES nasabah_profiles(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  balance_before DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 5. Transfers table
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_nasabah_id UUID NOT NULL REFERENCES nasabah_profiles(id) ON DELETE CASCADE,
  to_nasabah_id UUID NOT NULL REFERENCES nasabah_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  status transfer_status NOT NULL DEFAULT 'pending',
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CHECK (from_nasabah_id <> to_nasabah_id)
);

-- 6. Activity logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_nasabah_account_number ON nasabah_profiles(account_number);
CREATE INDEX idx_nasabah_user_id ON nasabah_profiles(user_id);
CREATE INDEX idx_transactions_nasabah_id ON transactions(nasabah_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transfers_from ON transfers(from_nasabah_id);
CREATE INDEX idx_transfers_to ON transfers(to_nasabah_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- 8. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_nasabah_profiles_updated_at
  BEFORE UPDATE ON nasabah_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9. Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nasabah_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can update users" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admin can delete users" ON users
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Nasabah profiles policies
CREATE POLICY "Nasabah can view own profile" ON nasabah_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Nasabah can update own profile" ON nasabah_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admin and staff can view all profiles" ON nasabah_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'petugas'))
  );

CREATE POLICY "Admin can manage profiles" ON nasabah_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Transactions policies
CREATE POLICY "Nasabah can view own transactions" ON transactions
  FOR SELECT USING (
    nasabah_id IN (SELECT id FROM nasabah_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin and staff can view all transactions" ON transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'petugas'))
  );

CREATE POLICY "Admin can manage transactions" ON transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Transfers policies
CREATE POLICY "Nasabah can view own transfers" ON transfers
  FOR SELECT USING (
    from_nasabah_id IN (SELECT id FROM nasabah_profiles WHERE user_id = auth.uid()) OR
    to_nasabah_id IN (SELECT id FROM nasabah_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin and staff can view all transfers" ON transfers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'petugas'))
  );

CREATE POLICY "Admin can manage transfers" ON transfers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Activity logs policies
CREATE POLICY "Admin can view all logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Users can insert own logs" ON activity_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can insert any logs" ON activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
