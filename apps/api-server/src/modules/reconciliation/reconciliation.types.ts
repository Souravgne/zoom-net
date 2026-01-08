// apps/api-server/src/modules/reconciliation/reconciliation.types.ts
import { JobDbRecord } from "../jobs/jobs.types";

/**
 * Defines the types of inconsistencies the reconciliation service can detect.
 */
export enum InconsistencyType {
  STUCK_RUNNING = "STUCK_RUNNING", // Job has been in 'RUNNING' state for too long.
  UNSETTLED_COMPLETED = "UNSETTLED_COMPLETED", // Job is 'COMPLETED' but not settled in the wallet.
  UNSETTLED_FAILED = "UNSETTLED_FAILED", // Job is 'FAILED' but not settled in the wallet.
  // More types like ORPHANED_HOLD could be added later.
}

/**
 * Represents a single detected inconsistency, providing context.
 */
export interface InconsistencyReport {
  jobId: string;
  userId: string;
  type: InconsistencyType;
  details: string; // A human-readable description of the problem.
  jobData: JobDbRecord;
}

/**
 * Defines the types of manual repair actions that can be applied.
 */
export enum FixType {
  FORCE_FAIL_JOB = "FORCE_FAIL_JOB", // Marks a job as FAILED and releases the hold.
  FORCE_SETTLE_AS_COMPLETED = "FORCE_SETTLE_AS_COMPLETED", // Settles a COMPLETED job that was missed.
}

/**
 * Describes the outcome of a proposed fix for preview purposes.
 */
export interface FixPreview {
  jobId: string;
  fixType: FixType;
  willPerform: {
    jobUpdate: Partial<JobDbRecord>;
    walletActions: {
      type: "release" | "debit";
      amount: number;
    }[];
  };
  description: string;
}

/**
 * Data required to apply a fix.
 */
export interface ApplyFixDto {
  jobId: string;
  fixType: FixType;
  operator: string; // The user or system performing the action.
}

/**
 * Data required for logging a repair action.
 */
export interface ReconciliationLogDto {
  jobId: string;
  userId: string;
  fixType: string;
  previousState: object;
  newState: object;
  operator: string;
  notes?: string;
}
