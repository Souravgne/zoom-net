// apps/api-server/src/routes/jobs.routes.ts
import { Router } from 'express';
import { JobsService } from '../modules/jobs/jobs.service';

export const createJobsRouter = (jobsService: JobsService): Router => {
  const router = Router();

  /**
   * POST /jobs/fetch-and-run
   * Endpoint for a worker to fetch a job from the queue.
   * The API atomically marks the job as 'RUNNING'.
   */
  router.post('/fetch-and-run', async (req, res, next) => {
    try {
      const job = await jobsService.fetchAndRunJob();
      if (job) {
        res.json(job);
      } else {
        res.status(204).send(); // No content, no job available
      }
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /jobs/settle
   * Endpoint for a worker to report the completion or failure of a job.
   * This uses the idempotent settlement service.
   */
  router.post('/settle', async (req, res, next) => {
    try {
      const { jobId, status, actualCostCents, workerRunId } = req.body;
      if (!jobId || !status || !workerRunId) {
        return res.status(400).json({ error: 'jobId, status, and workerRunId are required.' });
      }

      const result = await jobsService.settleJobAttempt({
        jobId,
        status,
        actualCostCents,
        workerRunId,
      });

      res.status(200).json({ message: 'Settlement processed.', result });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
