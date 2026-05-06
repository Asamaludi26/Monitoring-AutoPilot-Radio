import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { Alert, AlertSeverity } from '@/types';

const SEVERITY_VARIANT: Record<AlertSeverity, 'info' | 'warning' | 'destructive'> = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'destructive',
};

function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get<Alert[]>('/alerts'),
    select: (res) => res.data,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function AlertsPage() {
  const queryClient = useQueryClient();
  const { data: alerts, isLoading } = useAlerts();

  const acknowledge = useMutation({
    mutationFn: (id: string) => api.patch<Alert>(`/alerts/${id}/acknowledge`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alert acknowledged');
    },
    onError: () => toast.error('Failed to acknowledge alert'),
  });

  const activeAlerts = alerts?.filter((a) => a.status === 'ACTIVE') ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Real-time alerts from radio devices
          </p>
        </div>
        {activeAlerts.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <Bell className="h-3 w-3" />
            {activeAlerts.length} active
          </Badge>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Severity</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[80px]" />
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
            {!isLoading && (!alerts || alerts.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Bell className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No alerts found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              alerts?.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <Badge variant={SEVERITY_VARIANT[alert.severity]}>{alert.severity}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{alert.title}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {alert.message}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {alert.device?.name ?? alert.deviceId}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        alert.status === 'ACTIVE'
                          ? 'destructive'
                          : alert.status === 'ACKNOWLEDGED'
                            ? 'warning'
                            : 'success'
                      }
                    >
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(alert.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {alert.status === 'ACTIVE' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => acknowledge.mutate(alert.id)}
                        disabled={acknowledge.isPending}
                        aria-label="Acknowledge alert"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
