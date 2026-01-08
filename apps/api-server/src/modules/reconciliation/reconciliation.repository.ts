// apps/api-server/src/modules/reconciliation/reconciliation.repository.ts
import { DbClient } from "@zoom-net/wallet-engine";
import { JobDbRecord } from "../jobs/jobs.types";
import { ReconciliationLogDto } from "./reconciliation.types";

export class ReconciliationRepository {
  /**
   * Finds jobs that have been in the 'RUNNING' state for longer than a specified timeout.
   * @param timeoutMinutes The number of minutes after which a running job is considered stuck.
   * @param dbClient The database client.
   * @returns A promise resolving to an array of stuck job records.
   */
  async findStuckRunningJobs(
    timeoutMinutes: number,
    dbClient: DbClient,
  ): Promise<JobDbRecord[]> {
    const result = await dbClient.query(
      `SELECT * FROM automation_jobs
       WHERE status = 'RUNNING'
       AND scheduled_at < NOW() - INTERVAL '$1 minutes'`,
      [timeoutMinutes],
    );
    return result.rows;
  }

  /**
   * Finds jobs that are marked as 'COMPLETED' or 'FAILED' but have not been settled.
   * @param dbClient The database client.
   * @returns A promise resolving to an array of unsettled finalized job records.
   */
  async findUnsettledFinalizedJobs(dbClient: DbClient): Promise<JobDbRecord[]> {
    const result = await dbClient.query(
      `SELECT * FROM automation_jobs
       WHERE status IN ('COMPLETED', 'FAILED')
       AND settled_at IS NULL`,
    );
    return result.rows;
  }

  /**
   * Retrieves all reconciliation audit logs, ordered by most recent first.
   * @param dbClient The database client.
   * @returns A promise resolving to an array of log records.
   */
  async getAuditLogs(dbClient: DbClient): Promise<any[]> {
    const result = await dbClient.query(
      `SELECT * FROM reconciliation_logs ORDER BY created_at DESC`,
    );
    return result.rows;
  }

  /**
   * Inserts a log entry into the reconciliation audit trail.
   * @param logDto The data for the log entry.
   * @param dbClient The database client for the transaction.
   */
  async logRepairAction(
    logDto: ReconciliationLogDto,
    dbClient: DbClient,
  ): Promise<void> {
    await dbClient.query(
      `INSERT INTO reconciliation_logs (
        job_id, user_id, fix_type, previous_state, new_state, operator, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        logDto.jobId,
        logDto.userId,
        logDto.fixType,
        JSON.stringify(logDto.previousState),
        JSON.stringify(logDto.newState),
        logDto.operator,
        logDto.notes,
      ],
    );
  }
}
