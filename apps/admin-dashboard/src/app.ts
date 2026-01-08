// apps/admin-dashboard/src/app.ts
import express from "express";
import { createWalletService } from "@zoom-net/wallet-engine";

// Import services and repos from the api-server (using path aliases)
import { JobsRepository } from "@api-services/modules/jobs/jobs.repository";
import { JobsService } from "@api-services/modules/jobs/jobs.service";
import { ReconciliationRepository } from "@api-services/modules/reconciliation/reconciliation.repository";
import { ReconciliationService } from "@api-services/modules/reconciliation/reconciliation.service";
import {
  transactionManager,
  PgTransactionManager,
} from "./transaction.manager";

// Import middleware and routers
import { isAdmin } from "./middleware/auth.middleware";
import { createWalletRouter } from "./routes/wallet.routes";
import { createJobsRouter } from "./routes/jobs.routes";
import { createAuditRouter } from "./routes/audit.routes";
import { createReconciliationRouter } from "./routes/reconciliation.routes";

// --- Instantiate all application layers ---
const jobsRepository = new JobsRepository();
const reconciliationRepository = new ReconciliationRepository();

const walletService = createWalletService(transactionManager);
const jobsService = new JobsService(jobsRepository, transactionManager);
const reconciliationService = new ReconciliationService(
  reconciliationRepository,
  jobsRepository,
  transactionManager,
);

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

// --- Main Admin Router ---
const adminRouter = express.Router();
// ... (rest of the file is the same)
// ...
// Mount the main admin router
app.use("/admin", adminRouter);

// --- Basic Error Handling ---
app.use((err, req, res, next) => {
  logger.error({ err, service: 'admin-dashboard' }, 'Something went wrong!');
  res
    .status(500)
    .json({ error: "Something went wrong!", message: err.message });
});

export default app;
