// apps/worker/src/worker.types.ts
import { JobStatus } from "@shared-types/job";

// The job object received by the worker from the API.
// This is defined independently to avoid a direct dependency on the api-server's internal types.
export interface FetchedJob {
  id: string;
  user_id: string;
  meeting_url: string;
  // other relevant fields for the job execution would go here
  settlement_run_id: string; // This is the workerRunId
}

// The payload sent back to the API upon completion or failure
export interface SettlementPayload {
  jobId: string;
  status: "COMPLETED" | "FAILED";
  actualCostCents?: number;
  workerRunId: string;
}
