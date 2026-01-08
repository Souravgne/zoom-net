-- 0004_create_reconciliation_logs.sql

-- This table stores an immutable audit trail of all manual repair actions performed.
CREATE TABLE reconciliation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES automation_jobs(id),
  user_id UUID,
  fix_type TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  operator TEXT NOT NULL, -- e.g., 'admin@example.com' or 'system-script'
  notes TEXT, -- Optional notes about why the fix was applied
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_reconciliation_logs_job_id ON reconciliation_logs(job_id);
CREATE INDEX idx_reconciliation_logs_operator ON reconciliation_logs(operator);
