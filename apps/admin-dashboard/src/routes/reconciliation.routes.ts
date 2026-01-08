// apps/admin-dashboard/src/routes/reconciliation.routes.ts
import { Router } from 'express';
import { ReconciliationService } from '@api-services/modules/reconciliation/reconciliation.service';
import { FixType } from '@api-services/modules/reconciliation/reconciliation.types';

export const createReconciliationRouter = (
  reconciliationService: ReconciliationService,
): Router => {
  const router = Router();

  /**
   * GET /admin/reconciliation/scan
   * Scans the system for all detectable inconsistencies in a read-only manner.
   */
  router.get('/scan', async (req, res, next) => {
    try {
      const reports = await reconciliationService.scanInconsistencies();
      res.json(reports);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /admin/reconciliation/preview/:jobId
   * Previews the effect of a potential fix without applying it.
   */
  router.get('/preview/:jobId', async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const { fixType } = req.query;
      const preview = await reconciliationService.previewFix(jobId, fixType as FixType);
      res.json(preview);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /admin/reconciliation/apply
   * Applies a specific, audited, manual fix to a job. This is a critical write operation.
   */
  router.post('/apply', async (req, res, next) => {
    try {
      const { jobId, fixType, operator } = req.body;
      if (!jobId || !fixType || !operator) {
        return res.status(400).json({ error: 'jobId, fixType, and operator are required.' });
      }

      const result = await reconciliationService.applyFix({ jobId, fixType, operator });
      res.status(200).json({ message: 'Fix applied successfully.', result });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
