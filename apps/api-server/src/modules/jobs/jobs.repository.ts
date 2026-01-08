// apps/api-server/src/modules/jobs/jobs.repository.ts
import { DbClient } from "@zoom-net/wallet-engine";
import { JobDbRecord, CreateJobDto } from "./jobs.types";
import { JobStatus } from "@shared-types/job";
import { randomUUID } from "crypto";

export class JobsRepository {
  /**
   * Creates a new automation job in the database.
   * @param jobDto The data for the new job.
   * @param dbClient The database client for the transaction.
   * @returns The newly created job record.
   */
  async create(jobDto: CreateJobDto, dbClient: DbClient): Promise<JobDbRecord> {
    const jobId = randomUUID();
    const result = await dbClient.query(
      `INSERT INTO automation_jobs (
        id, user_id, meeting_url, scheduled_at, expected_duration_minutes,
        requested_sessions, status, estimated_cost_cents
      ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7)
      RETURNING *`,
      [
        jobId,
        jobDto.userId,
        jobDto.meetingUrl,
        jobDto.startTime,
        jobDto.durationMinutes,
        jobDto.sessions,
        jobDto.estimatedCostCents,
      ],
    );
    return result.rows[0] as JobDbRecord;
  }

  /**
   * Finds a job by its ID.
   * @param jobId The ID of the job to find.
   * @param dbClient The database client for the transaction.
   * @returns The job record, or null if not found.
   */
  async find(
    filters: { id?: string; status?: JobStatus },
    dbClient: DbClient,
  ): Promise<JobDbRecord[]> {
    const { id, status } = filters;
    let query = "SELECT * FROM automation_jobs";
    const params: any[] = [];
    const conditions: string[] = [];

    if (id) {
      params.push(id);
      conditions.push(`id = ${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = ${params.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    const result = await dbClient.query(query, params);
    return result.rows;
  }

  /**
   * Finds a job by its ID.
   * @param jobId The ID of the job to find.
   * @param dbClient The database client for the transaction.
   * @returns The job record, or null if not found.
   */
  async findById(
    jobId: string,
    dbClient: DbClient,
  ): Promise<JobDbRecord | null> {
    const results = await this.find({ id: jobId }, dbClient);
    return results[0] || null;
  }

  /**
   * Updates the status and actual cost of a completed or failed job.
   * @param jobId The ID of the job to update.
   * @param status The new status ('COMPLETED' or 'FAILED').
   * @param actualCostCents The final cost of the job.
   * @param dbClient The database client for the transaction.
   * @returns The updated job record.
   */
  async findAndMarkAsRunning(
    workerRunId: string,
    dbClient: DbClient,
  ): Promise<JobDbRecord | null> {
    // This query finds the oldest pending job, locks the row so no other worker can select it,
    // and immediately updates it to 'RUNNING' with the given worker run ID.
    // It's the core of a database-backed job queue.
    const result = await dbClient.query(
      `WITH selected_job AS (
        SELECT id FROM automation_jobs
        WHERE status = 'PENDING'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE automation_jobs
      SET status = 'RUNNING', settlement_run_id = $1
      WHERE id = (SELECT id FROM selected_job)
      RETURNING *`,
      [workerRunId],
    );
    return result.rows[0] || null;
  }

  async finalizeSettlement(
    jobId: string,
    status: "COMPLETED" | "FAILED",
    actualCostCents: number,
    settlementRunId: string,
    dbClient: DbClient,
  ): Promise<JobDbRecord> {
    const result = await dbClient.query(
      `UPDATE automation_jobs
       SET status = $1, actual_cost_cents = $2, settled_at = NOW(), settlement_run_id = $3
       WHERE id = $4 RETURNING *`,
      [status, actualCostCents, settlementRunId, jobId],
    );
    return result.rows[0];
  }
}
