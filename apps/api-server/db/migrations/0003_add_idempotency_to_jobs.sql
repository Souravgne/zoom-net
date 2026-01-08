-- 0003_add_idempotency_to_jobs.sql

-- Add columns to track the settlement of a job for idempotency
ALTER TABLE automation_jobs
ADD COLUMN settled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN settlement_run_id TEXT;

-- Add an index to quickly find jobs by their settlement run ID to prevent duplicates
CREATE INDEX idx_jobs_settlement_run_id ON automation_jobs(settlement_run_id);
