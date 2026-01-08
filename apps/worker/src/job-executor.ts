// apps/worker/src/job-executor.ts
import { FetchedJob } from "./worker.types";

/**
 * This function simulates the actual, real-world task that the worker needs to perform.
 * For example, this is where the Playwright logic to join a meeting would go.
 *
 * @param job The job details received from the API.
 * @returns A promise that resolves with the calculated actual cost of the job.
 */
export const executeJob = async (
  job: FetchedJob,
): Promise<{ actualCostCents: number }> => {
  console.log(`[Executor] Starting execution for job: ${job.id}`);

  return new Promise((resolve, reject) => {
    // Simulate work with a timeout
    const workDuration = Math.random() * 5000 + 1000; // Random duration between 1-6 seconds

    setTimeout(() => {
      // Simulate random success or failure
      if (Math.random() > 0.2) {
        // 80% success rate
        const actualCostCents = Math.floor(Math.random() * 100); // Simulate some cost
        console.log(
          `[Executor] Successfully completed job: ${job.id} with cost ${actualCostCents}`,
        );
        resolve({ actualCostCents });
      } else {
        console.error(`[Executor] Failed to execute job: ${job.id}`);
        reject(new Error("Job execution failed randomly."));
      }
    }, workDuration);
  });
};
