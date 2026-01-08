// apps/worker/src/worker.ts
import axios from "axios";
import { runJob } from "./job-runner";
import { FetchedJob } from "./worker.types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const POLLING_INTERVAL_MS = 5000; // 5 seconds

/**
 * Fetches a single job from the API server's queue.
 * @returns A promise that resolves to a job object, or null if no job is available.
 */
async function fetchJob(): Promise<FetchedJob | null> {
  try {
    console.log("[Worker] Polling for a new job...");
    const response = await axios.post(`${API_BASE_URL}/jobs/fetch-and-run`);

    if (response.status === 204) {
      console.log("[Worker] No job available.");
      return null;
    }

    console.log(`[Worker] Fetched job ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error("[Worker] Failed to fetch job:", error.message);
    return null;
  }
}

/**
 * The main loop of the worker. It continuously polls for jobs and runs them.
 */
export const startWorkerLoop = () => {
  console.log("[Worker] Worker started. Entering polling loop...");

  const loop = async () => {
    const job = await fetchJob();

    if (job) {
      await runJob(job);
    }

    // Wait for the next poll, regardless of whether a job was found.
    setTimeout(loop, POLLING_INTERVAL_MS);
  };

  // Start the first iteration of the loop.
  loop();
};
