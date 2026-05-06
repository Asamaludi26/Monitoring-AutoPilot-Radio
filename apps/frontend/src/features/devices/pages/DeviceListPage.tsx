import { useState } from 'react';
import { Search, Router } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { useDevices } from '../hooks/useDevices';
import type { DeviceStatus, DeviceVendor } from '@/types';

const STATUS_VARIANT: Record<DeviceStatus, 'success' | 'destructive' | 'warning' | 'secondary'> = {
  ONLINE: 'success',
  OFFLINE: 'destructive',
  DEGRADED: 'warning',
  UNKNOWN: 'secondary',
};

function VendorBadge({ vendor }: { vendor: DeviceVendor }) {
  return (
    <span className="text-xs font-medium text-muted-foreground">
      {vendor === 'CAMBIUM' ? 'Cambium' : 'Mimosa'}
    </span>
  );
}

export function DeviceListPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useDevices({ search: search || undefined, limit: 50 });

  const devices = data?.data.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Devices</h1>
          <p className="text-sm text-muted-foreground">
            Manage Cambium &amp; Mimosa radio nodes
          </p>
        </div>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search devices…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Search devices"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Vendor / Model</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && devices.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Router className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No devices found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <VendorBadge vendor={device.vendor} />
                      <span className="text-xs">{device.model}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{device.ipAddress}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {device.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[device.status]}>
                      {device.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {device.lastSeen
                      ? new Date(device.lastSeen).toLocaleString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
