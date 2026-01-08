export interface VmInstance {
    id: string;
    provider: 'hetzner';
    ipAddress: string;
    status: 'creating' | 'running' | 'destroying';
    jobId: string;
}
