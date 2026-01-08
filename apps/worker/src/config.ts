// apps/worker/src/config.ts
import 'dotenv/config';

const config = {
    workerId: process.env.WORKER_ID || 'default-worker',
    apiBaseUrl: process.env.API_BASE_URL,
    jobTimeoutSeconds: process.env.JOB_TIMEOUT_SECONDS || '1800',
    workerPollIntervalMs: process.env.WORKER_POLL_INTERVAL_MS || '5000',
};

export function validateConfig(): void {
    if (!config.apiBaseUrl) {
        throw new Error("FATAL: API_BASE_URL environment variable is not set.");
    }
    console.log("✓ Config validation passed.");
}

export default config;
