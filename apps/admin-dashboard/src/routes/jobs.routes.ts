// apps/admin-dashboard/src/routes/jobs.routes.ts
import { Router } from 'express';
import { JobsRepository } from '@api-services/modules/jobs/jobs.repository';
import { PgTransactionManager } from '../transaction.manager';
import { JobStatus } from '@shared-types/job';

export const createJobsRouter = (
  jobsRepository: JobsRepository,
  transactionManager: PgTransactionManager
): Router => {
  const router = Router();

  /**
   * GET /admin/jobs
   * Fetches a list of all jobs, with optional filtering by status.
   */
  router.get('/', async (req, res, next) => {
    try {
      const { status } = req.query;

      const jobs = await transactionManager.execute(async (dbClient) => {
        return jobsRepository.find({ status: status as JobStatus }, dbClient);
      });

      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
