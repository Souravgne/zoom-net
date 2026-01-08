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

// --- Create Express App ---
const app = express();
app.use(express.json());

// --- Main Admin Router ---
const adminRouter = express.Router();

// All admin routes are protected by the isAdmin middleware
adminRouter.use(isAdmin);

// Mount the specific routers
adminRouter.use(
  "/wallets",
  createWalletRouter(walletService, transactionManager),
);
adminRouter.use("/jobs", createJobsRouter(jobsRepository, transactionManager));
adminRouter.use(
  "/audit",
  createAuditRouter(reconciliationRepository, transactionManager),
);
adminRouter.use(
  "/reconciliation",
  createReconciliationRouter(reconciliationService),
);

// Mount the main admin router
app.use("/admin", adminRouter);

// --- Basic Error Handling ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Something went wrong!", message: err.message });
});

export default app;
