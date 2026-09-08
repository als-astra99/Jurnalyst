-- ============================================================
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id       UUID NOT NULL REFERENCES accounts(id)   ON DELETE CASCADE,
  category_id      UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount           NUMERIC(15,2) NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('income','expense')),
  note             TEXT,

  -- Pola pengulangan
  frequency        TEXT NOT NULL CHECK (frequency IN ('daily','monthly','yearly')),
  -- daily  : tidak perlu day_of_month / month_of_year
  -- monthly: day_of_month wajib (1-31)
  -- yearly : day_of_month + month_of_year wajib
  day_of_month     SMALLINT CHECK (day_of_month BETWEEN 1 AND 31),
  month_of_year    SMALLINT CHECK (month_of_year BETWEEN 1 AND 12),

  -- Rentang aktif
  start_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date         DATE,          -- NULL = selamanya

  -- Terakhir kali transaksi di-generate (untuk hindari duplikat)
  last_generated   DATE,

  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: hanya pemilik yang bisa akses
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_recurring" ON recurring_transactions
  FOR ALL USING (auth.uid() = user_id);
