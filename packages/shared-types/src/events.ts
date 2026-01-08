export const MEETING_SCHEDULED = 'meeting.scheduled';
export const MEETING_START = 'meeting.start';
export const MEETING_ENDED = 'meeting.ended';
export const WORKER_REGISTERED = 'worker.registered';
export const WORKER_DRAINED = 'worker.drained';

export interface MeetingScheduledEvent {
  jobId: string;
  userId: string;
  scheduledAt: Date;
}
