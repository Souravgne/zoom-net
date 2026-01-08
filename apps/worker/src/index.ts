// apps/worker/src/index.ts
import { startWorkerLoop } from "./worker";
import config, { validateConfig } from './config';
import logger from './logger';

logger.info({ service: 'worker' }, "--- Zoom-Net Worker Initializing ---");

try {
    validateConfig();
} catch (error) {
    const err = error as Error;
    logger.error({ err, service: 'worker' }, 'Config validation failed');
    process.exit(1);
}

const startupLog = {
    service: 'worker',
    workerId: config.workerId,
    apiBaseUrl: config.apiBaseUrl,
    jobTimeout: `${config.jobTimeoutSeconds}s`,
    pollInterval: `${config.workerPollIntervalMs}ms`,
};
logger.info(startupLog, "✓ Startup self-check complete. Worker is ready.");

startWorkerLoop();
