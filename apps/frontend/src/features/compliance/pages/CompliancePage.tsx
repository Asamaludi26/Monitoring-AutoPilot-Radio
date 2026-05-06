import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
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
import type { DeviceCompliance, ComplianceStatus } from '@/types';

const STATUS_VARIANT: Record<ComplianceStatus, 'success' | 'destructive' | 'warning' | 'secondary'> = {
  COMPLIANT: 'success',
  NON_COMPLIANT: 'destructive',
  PENDING: 'warning',
  EXEMPT: 'secondary',
};

function useCompliance() {
  return useQuery({
    queryKey: ['compliance'],
    queryFn: () => api.get<DeviceCompliance[]>('/compliance'),
    select: (res) => res.data,
    staleTime: 60_000,
  });
}

export function CompliancePage() {
  const { data: records, isLoading } = useCompliance();

  const nonCompliantCount = records?.filter((r) => r.status === 'NON_COMPLIANT').length ?? 0;
  const compliantCount = records?.filter((r) => r.status === 'COMPLIANT').length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
          <p className="text-sm text-muted-foreground">
            Balmon EIRP compliance monitoring for all devices
          </p>
        </div>
        {records && (
          <div className="flex gap-3">
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Compliant</span>
              <span className="text-lg font-bold text-green-400">{compliantCount}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Non-Compliant</span>
              <span className="text-lg font-bold text-red-400">{nonCompliantCount}</span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tx Power (dBm)</TableHead>
              <TableHead>Max Allowed (dBm)</TableHead>
              <TableHead>Frequency (MHz)</TableHead>
              <TableHead>Checked At</TableHead>
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
            {!isLoading && (!records || records.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No compliance records found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              records?.map((record) => (
                <TableRow key={record.deviceId}>
                  <TableCell className="font-medium">
                    {record.device?.name ?? record.deviceId}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[record.status]}>{record.status}</Badge>
                  </TableCell>
                  <TableCell
                    className={
                      record.txPower > record.maxAllowedTxPower
                        ? 'font-semibold text-red-400'
                        : 'text-foreground'
                    }
                  >
                    {record.txPower}
                  </TableCell>
                  <TableCell>{record.maxAllowedTxPower}</TableCell>
                  <TableCell className="font-mono text-sm">{record.frequency}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(record.checkedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
