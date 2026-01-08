import {
  WalletService,
  createWalletService,
  InsufficientBalanceError,
} from "@zoom-net/wallet-engine";
import {
  transactionManager,
  PgTransactionManager,
} from "../../transaction.manager";
import { JobsRepository } from "./jobs.repository";
import { CreateJobDto, SettlementAttemptDto } from "./jobs.types";

export class JobsService {
  private walletService: WalletService;

  constructor(
    private readonly jobsRepository: JobsRepository,
    private readonly dbManager: PgTransactionManager,
  ) {
    this.walletService = createWalletService(dbManager);
  }

  async createJob(createJobDto: CreateJobDto) {
    return this.dbManager.execute(async (dbClient) => {
      const job = await this.jobsRepository.create(createJobDto, dbClient);
      try {
        await this.walletService.placeHold(
          job.user_id,
          job.estimated_cost_cents,
          job.id,
          dbClient,
        );
      } catch (error) {
        if (error instanceof InsufficientBalanceError) {
          throw error;
        }
        throw new Error(`Failed to place wallet hold: ${error.message}`);
      }
      return job;
    });
  }

  /**
   * Handles a worker's attempt to settle a job.
   * This method is idempotent and ensures a job is only ever settled once.
   * @param settlementDto Data from the worker about the job's completion.
   * @returns The finalized job record.
   * @throws {Error} if the job is not in a valid state to be settled.
   */
  async settleJobAttempt(settlementDto: SettlementAttemptDto) {
    return this.dbManager.execute(async (dbClient) => {
      const { jobId, status, actualCostCents = 0, workerRunId } = settlementDto;

      // 1. Find the job and lock it for the update.
      const job = await this.jobsRepository.findById(jobId, dbClient);
      if (!job) {
        throw new Error("Job not found.");
      }

      // 2. IDEMPOTENCY CHECK: If the job is already settled, ignore the request.
      if (job.settled_at) {
        console.log(`Ignoring duplicate settlement attempt for job ${jobId}.`);
        return job; // Return the already settled job.
      }

      // 3. State Machine Check: Ensure the job is in a valid state to be settled.
      if (status === "COMPLETED" && job.status !== "RUNNING") {
        throw new Error(
          "Job cannot be completed because it is not in RUNNING state.",
        );
      }
      if (
        status === "FAILED" &&
        job.status !== "RUNNING" &&
        job.status !== "PENDING"
      ) {
        throw new Error(
          "Job cannot be failed because it is not in RUNNING or PENDING state.",
        );
      }

      // 4. Wallet Settlement
      // For a FAILED job, the actual cost is 0.
      const finalCost = status === "COMPLETED" ? actualCostCents : 0;

      await this.walletService.settleJob(
        job.user_id,
        job.id,
        job.estimated_cost_cents,
        finalCost,
        dbClient,
      );

      // 5. Finalize the job record with the settlement details.
      const updatedJob = await this.jobsRepository.finalizeSettlement(
        jobId,
        status,
        finalCost,
        workerRunId,
        dbClient,
      );

      return updatedJob;
    });
  }
}
