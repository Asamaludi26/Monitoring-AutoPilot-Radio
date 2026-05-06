import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
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
import type { AuditLog, AuditAction } from '@/types';

const ACTION_VARIANT: Record<AuditAction, 'success' | 'destructive' | 'warning' | 'secondary' | 'info'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'destructive',
  LOGIN: 'secondary',
  LOGOUT: 'secondary',
  CONFIG_PUSH: 'warning',
  COMPLIANCE_RUN: 'warning',
};

function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.get<AuditLog[]>('/audit'),
    select: (res) => res.data,
    staleTime: 30_000,
  });
}

export function AuditPage() {
  const { data: logs, isLoading } = useAuditLogs();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Immutable record of all platform actions
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>User</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && (!logs || logs.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ClipboardList className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No audit records found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant={ACTION_VARIANT[log.action]}>{log.action}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{log.resource}</span>
                    {log.resourceId && (
                      <span className="ml-1 font-mono text-xs text-muted-foreground">
                        #{log.resourceId.slice(0, 8)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.user?.name ?? log.userId}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.ipAddress ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
