export type JobStatus = 'scheduled' | 'provisioning' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AutomationJob {
  jobId: string;
  userId:string;
  meetingUrl: string;
  startTime: Date;
  durationMinutes: number;
  sessions: number;
  status: JobStatus;
}

export interface JobMetrics {
  jobId: string;
  workerId: string;
  sessionCount: number;
  startTime: Date;
  endTime: Date;
  actualMinutes: number;
}
