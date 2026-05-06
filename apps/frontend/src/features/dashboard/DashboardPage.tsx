import {
  Router,
  Wifi,
  WifiOff,
  AlertTriangle,
  Bell,
  ShieldCheck,
  Activity,
  Workflow,
} from 'lucide-react';
import { KpiCard } from './components/KpiCard';
import { DeviceStatusChart } from './components/DeviceStatusChart';
import { useDashboardStats } from './hooks/useDashboardStats';

export function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          RF Spectrum Orchestration &amp; Compliance Platform — real-time overview
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Total Devices"
          value={stats?.totalDevices ?? 0}
          icon={Router}
          description="Registered radio nodes"
          loading={isLoading}
        />
        <KpiCard
          title="Online"
          value={stats?.onlineDevices ?? 0}
          icon={Wifi}
          variant="success"
          description={
            stats
              ? `${Math.round((stats.onlineDevices / stats.totalDevices) * 100)}% availability`
              : undefined
          }
          loading={isLoading}
        />
        <KpiCard
          title="Offline"
          value={stats?.offlineDevices ?? 0}
          icon={WifiOff}
          variant="danger"
          loading={isLoading}
        />
        <KpiCard
          title="Degraded"
          value={stats?.degradedDevices ?? 0}
          icon={AlertTriangle}
          variant="warning"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Active Alerts"
          value={stats?.activeAlerts ?? 0}
          icon={Bell}
          variant={stats && stats.criticalAlerts > 0 ? 'danger' : 'default'}
          description={
            stats?.criticalAlerts
              ? `${stats.criticalAlerts} critical`
              : 'No critical alerts'
          }
          loading={isLoading}
        />
        <KpiCard
          title="Avg RF Score"
          value={stats ? `${stats.avgRfScore.toFixed(1)}` : '—'}
          icon={Activity}
          variant={
            !stats
              ? 'default'
              : stats.avgRfScore >= 80
                ? 'success'
                : stats.avgRfScore >= 60
                  ? 'warning'
                  : 'danger'
          }
          description="Spectrum quality score"
          loading={isLoading}
        />
        <KpiCard
          title="Compliance"
          value={stats ? `${stats.complianceRate.toFixed(0)}%` : '—'}
          icon={ShieldCheck}
          variant={
            !stats
              ? 'default'
              : stats.complianceRate >= 90
                ? 'success'
                : stats.complianceRate >= 70
                  ? 'warning'
                  : 'danger'
          }
          description="Balmon compliant devices"
          loading={isLoading}
        />
        <KpiCard
          title="Pending Jobs"
          value={stats?.pendingJobs ?? 0}
          icon={Workflow}
          variant={stats && stats.pendingJobs > 0 ? 'warning' : 'default'}
          description="Orchestration queue"
          loading={isLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {stats && (
          <DeviceStatusChart
            online={stats.onlineDevices}
            offline={stats.offlineDevices}
            degraded={stats.degradedDevices}
            unknown={stats.totalDevices - stats.onlineDevices - stats.offlineDevices - stats.degradedDevices}
          />
        )}
        {isLoading && (
          <div className="h-[260px] animate-pulse rounded-lg border bg-muted" />
        )}
      </div>
    </div>
  );
}
