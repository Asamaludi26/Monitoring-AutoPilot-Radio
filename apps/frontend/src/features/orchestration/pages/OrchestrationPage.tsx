import { useQuery } from '@tanstack/react-query';
import { Workflow } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import type { OrchestrationJob, JobStatus } from '@/types';

const STATUS_VARIANT: Record<JobStatus, 'success' | 'destructive' | 'warning' | 'secondary' | 'info'> = {
  PENDING: 'warning',
  RUNNING: 'info',
  SUCCESS: 'success',
  FAILED: 'destructive',
  ROLLED_BACK: 'secondary',
};

function useJobs() {
  return useQuery({
    queryKey: ['orchestration', 'jobs'],
    queryFn: () => api.get<OrchestrationJob[]>('/orchestration/jobs'),
    select: (res) => res.data,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}

export function OrchestrationPage() {
  const { data: jobs, isLoading } = useJobs();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orchestration</h1>
        <p className="text-sm text-muted-foreground">
          Configuration push jobs &amp; automation queue
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Completed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && (!jobs || jobs.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Workflow className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No orchestration jobs</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              jobs?.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}…</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {job.type.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {job.device?.name ?? job.deviceId.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[job.status]}>{job.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(job.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {job.completedAt ? new Date(job.completedAt).toLocaleString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
