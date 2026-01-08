-- 0002_add_costs_and_update_status_to_jobs.sql

-- Add columns to store cost in cents to avoid floating point issues
ALTER TABLE automation_jobs
ADD COLUMN estimated_cost_cents INTEGER,
ADD COLUMN actual_cost_cents INTEGER;

-- Update the status CHECK constraint to the new lifecycle states
-- First, drop the old constraint
ALTER TABLE automation_jobs
DROP CONSTRAINT automation_jobs_status_check;

-- Then, add the new constraint
ALTER TABLE automation_jobs
ADD CONSTRAINT automation_jobs_status_check
CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED'));
