// apps/api-server/src/modules/jobs/jobs.types.ts
import { AutomationJob, JobStatus } from "@shared-types/job";

// We can extend the shared AutomationJob with API-specific details if needed,
// but for now, we can create a type for creation parameters.

export type CreateJobDto = Omit<AutomationJob, "jobId" | "status"> & {
  estimatedCostCents: number;
};

// We can define the full Job type as it is in the database, including the new fields.
export interface JobDbRecord extends AutomationJob {
  estimated_cost_cents: number | null;
  actual_cost_cents: number | null;
  settled_at: Date | null;
  settlement_run_id: string | null;
}

export interface SettlementAttemptDto {
  jobId: string;
  status: "COMPLETED" | "FAILED";
  actualCostCents?: number;
  workerRunId: string;
}
