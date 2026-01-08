// apps/api-server/src/app.ts
import express from 'express';
import { JobsRepository } from './modules/jobs/jobs.repository';
import { JobsService } from './modules/jobs/jobs.service';
import { transactionManager } from './transaction.manager';
import { createJobsRouter } from './routes/jobs.routes';

// --- Instantiate services and repos ---
const jobsRepository = new JobsRepository();
const jobsService = new JobsService(jobsRepository, transactionManager);

import pinoHttp from 'pino-http';
import logger from './logger';

// --- Create Express App ---
const app = express();
app.use(express.json());
app.use(pinoHttp({ logger, customSuccessMessage: () => 'request completed' }));

// --- Health Check ---
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

// --- API Routes ---
app.use('/jobs', createJobsRouter(jobsService));

// --- Basic Error Handling ---
app.use((err, req, res, next) => {
    logger.error({ err, service: 'api-server' }, 'Something went wrong!');
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});


export default app;
