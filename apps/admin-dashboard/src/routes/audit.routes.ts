// apps/admin-dashboard/src/routes/audit.routes.ts
import { Router } from 'express';
import { ReconciliationRepository } from '@api-services/modules/reconciliation/reconciliation.repository';
import { PgTransactionManager } from '../transaction.manager';

export const createAuditRouter = (
  reconciliationRepository: ReconciliationRepository,
  transactionManager: PgTransactionManager
): Router => {
  const router = Router();

  /**
   * GET /admin/audit/logs
   * Fetches the complete history of all manual repair actions.
   */
  router.get('/logs', async (req, res, next) => {
    try {
      const logs = await transactionManager.execute(async (dbClient) => {
        return reconciliationRepository.getAuditLogs(dbClient);
      });

      res.json(logs);
    } catch (error) => {
      next(error);
    }
  });

  return router;
};
