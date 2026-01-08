export interface Worker {
    id: string;
    jobId: string | null;
    status: 'idle' | 'busy' | 'draining';
    registeredAt: Date;
}
