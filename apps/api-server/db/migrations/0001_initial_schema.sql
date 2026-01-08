-- 0001_initial_schema.sql

-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'user')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Wallets Table
CREATE TABLE wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Wallet Transactions Table (Ledger)
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('credit', 'debit', 'hold', 'release')) NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Automation Jobs Table
CREATE TABLE automation_jobs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  meeting_url TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expected_duration_minutes INTEGER NOT NULL,
  requested_sessions INTEGER NOT NULL,
  status TEXT CHECK (
    status IN (
      'scheduled',
      'provisioning',
      'running',
      'completed',
      'failed',
      'cancelled'
    )
  ) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Job Runtime Metrics Table
CREATE TABLE job_runtime_metrics (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES automation_jobs(id) ON DELETE CASCADE,
  worker_id TEXT NOT NULL,
  session_count INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  actual_minutes INTEGER
);

-- 6. Workers Table
CREATE TABLE workers (
  id TEXT PRIMARY KEY,
  vm_id TEXT,
  status TEXT CHECK (status IN ('active', 'draining', 'terminated')),
  last_heartbeat TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_automation_jobs_user_id ON automation_jobs(user_id);
CREATE INDEX idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX idx_job_runtime_metrics_job_id ON job_runtime_metrics(job_id);
