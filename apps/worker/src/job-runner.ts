// apps/worker/src/job-runner.ts
import axios from "axios";
import axiosRetry from "axios-retry";
import { executeJob } from "./job-executor";
import { FetchedJob, SettlementPayload } from "./worker.types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const JOB_TIMEOUT_MS = 30000; // 30 seconds

// Configure a retry mechanism for the API callback to handle transient network issues.
const apiClient = axios.create();
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return error.response?.status >= 500; // Retry on server errors
  },
});

/**
 * Reports the final status of a job back to the API server.
 * @param payload The settlement data to send.
 */
async function reportSettlement(payload: SettlementPayload) {
  console.log(
    `[Runner] Reporting settlement for job ${payload.jobId} with status ${payload.status}`,
  );
  try {
    await apiClient.post(`${API_BASE_URL}/jobs/settle`, payload);
    console.log(
      `[Runner] Successfully reported settlement for job ${payload.jobId}`,
    );
  } catch (error) {
    console.error(
      `[Runner] Failed to report settlement for job ${payload.jobId} after retries:`,
      error.message,
    );
    // Even if this fails, the reconciliation layer on the API server will eventually clean it up.
  }
}

/**
 * Orchestrates a single job run, including execution, timeout handling, and reporting.
 * @param job The job to run.
 */
export const runJob = async (job: FetchedJob): Promise<void> => {
  const workerRunId = job.settlement_run_id;
  let jobSucceeded = false;
  let actualCostCents = 0;

  try {
    const result = await Promise.race([
      executeJob(job),
      new Promise<{ actualCostCents: number }>((_, reject) =>
        setTimeout(() => reject(new Error("Job timed out")), JOB_TIMEOUT_MS),
      ),
    ]);
    actualCostCents = result.actualCostCents;
    jobSucceeded = true;
  } catch (error) {
    console.error(
      `[Runner] Job ${job.id} failed during execution:`,
      error.message,
    );
    jobSucceeded = false;
  }

  // Report the outcome back to the API
  await reportSettlement({
    jobId: job.id,
    status: jobSucceeded ? "COMPLETED" : "FAILED",
    actualCostCents: jobSucceeded ? actualCostCents : undefined,
    workerRunId,
  });
};
