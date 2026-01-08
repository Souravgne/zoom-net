// apps/api-server/src/modules/reconciliation/reconciliation.service.ts
import {
  PgTransactionManager,
  transactionManager,
} from "../../transaction.manager";
import { JobsRepository } from "../jobs/jobs.repository";
import { JobsService } from "../jobs/jobs.service";
import { ReconciliationRepository } from "./reconciliation.repository";
import {
  ApplyFixDto,
  FixPreview,
  FixType,
  InconsistencyReport,
  InconsistencyType,
} from "./reconciliation.types";

const STUCK_JOB_TIMEOUT_MINUTES = 60; // Configurable timeout

export class ReconciliationService {
  private jobsService: JobsService;

  constructor(
    private readonly reconciliationRepository: ReconciliationRepository,
    private readonly jobsRepository: JobsRepository,
    private readonly dbManager: PgTransactionManager,
  ) {
    // Reconciliation needs access to the JobsService to apply fixes safely.
    this.jobsService = new JobsService(jobsRepository, dbManager);
  }

  /**
   * Scans the system for all detectable inconsistencies. This is a read-only operation.
   * @returns A promise resolving to an array of inconsistency reports.
   */
  async scanInconsistencies(): Promise<InconsistencyReport[]> {
    return this.dbManager.execute(async (dbClient) => {
      const reports: InconsistencyReport[] = [];

      const stuckJobs =
        await this.reconciliationRepository.findStuckRunningJobs(
          STUCK_JOB_TIMEOUT_MINUTES,
          dbClient,
        );
      for (const job of stuckJobs) {
        reports.push({
          jobId: job.id,
          userId: job.user_id,
          type: InconsistencyType.STUCK_RUNNING,
          details: `Job has been in RUNNING state for over ${STUCK_JOB_TIMEOUT_MINUTES} minutes.`,
          jobData: job,
        });
      }

      const unsettledJobs =
        await this.reconciliationRepository.findUnsettledFinalizedJobs(
          dbClient,
        );
      for (const job of unsettledJobs) {
        reports.push({
          jobId: job.id,
          userId: job.user_id,
          type:
            job.status === "COMPLETED"
              ? InconsistencyType.UNSETTLED_COMPLETED
              : InconsistencyType.UNSETTLED_FAILED,
          details: `Job is marked ${job.status} but has not been settled in the wallet.`,
          jobData: job,
        });
      }

      return reports;
    });
  }

  /**
   * Previews the changes a specific fix would make without applying them. Read-only.
   * @param jobId The ID of the job to fix.
   * @param fixType The type of fix to preview.
   * @returns A promise resolving to a preview of the fix.
   */
  async previewFix(jobId: string, fixType: FixType): Promise<FixPreview> {
    const job = await this.dbManager.execute(async (dbClient) =>
      this.jobsRepository.findById(jobId, dbClient),
    );
    if (!job) throw new Error("Job not found.");

    switch (fixType) {
      case FixType.FORCE_FAIL_JOB:
        return {
          jobId,
          fixType,
          description:
            "Marks the job as FAILED, releases the original wallet hold, and debits 0.",
          willPerform: {
            jobUpdate: {
              status: "FAILED",
              settled_at: new Date(),
              actual_cost_cents: 0,
            },
            walletActions: [
              { type: "release", amount: job.estimated_cost_cents },
              { type: "debit", amount: 0 },
            ],
          },
        };
      case FixType.FORCE_SETTLE_AS_COMPLETED:
        return {
          jobId,
          fixType,
          description:
            "Settles a COMPLETED job that was missed, debiting the recorded actual cost.",
          willPerform: {
            jobUpdate: { status: "COMPLETED", settled_at: new Date() },
            walletActions: [
              { type: "release", amount: job.estimated_cost_cents },
              { type: "debit", amount: job.actual_cost_cents },
            ],
          },
        };
      default:
        throw new Error("Unknown fix type.");
    }
  }

  /**
   * Applies a manual fix to a job. This is a transactional write operation that is fully audited.
   * It reuses the idempotent JobsService.settleJobAttempt to ensure safety.
   * @param fixDto The data required to apply the fix.
   * @returns The updated job record after the fix.
   */
  async applyFix(fixDto: ApplyFixDto) {
    const { jobId, fixType, operator } = fixDto;

    return this.dbManager.execute(async (dbClient) => {
      const initialState = await this.jobsRepository.findById(jobId, dbClient);
      if (!initialState) throw new Error("Job not found.");

      let finalState;

      // The run ID for a manual fix should be unique and identifiable.
      const settlementRunId = `admin-fix-${fixType.toLowerCase()}-${Date.now()}`;

      switch (fixType) {
        case FixType.FORCE_FAIL_JOB:
          finalState = await this.jobsService.settleJobAttempt({
            jobId,
            status: "FAILED",
            workerRunId: settlementRunId,
            actualCostCents: 0,
          });
          break;
        case FixType.FORCE_SETTLE_AS_COMPLETED:
          if (initialState.status !== "COMPLETED") {
            throw new Error(
              "Can only force-settle a job already marked as COMPLETED.",
            );
          }
          finalState = await this.jobsService.settleJobAttempt({
            jobId,
            status: "COMPLETED",
            workerRunId: settlementRunId,
            actualCostCents: initialState.actual_cost_cents || 0,
          });
          break;
        default:
          throw new Error("Unknown fix type.");
      }

      // Log the action to the audit trail
      await this.reconciliationRepository.logRepairAction(
        {
          jobId,
          userId: initialState.user_id,
          fixType,
          previousState: initialState,
          newState: finalState,
          operator,
        },
        dbClient,
      );

      return finalState;
    });
  }
}
