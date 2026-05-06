import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Skeleton } from '@/components/ui/skeleton';

const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const DeviceListPage = lazy(() =>
  import('@/features/devices/pages/DeviceListPage').then((m) => ({
    default: m.DeviceListPage,
  })),
);
const RfAnalyticsPage = lazy(() =>
  import('@/features/rf-analytics/pages/RfAnalyticsPage').then((m) => ({
    default: m.RfAnalyticsPage,
  })),
);
const OrchestrationPage = lazy(() =>
  import('@/features/orchestration/pages/OrchestrationPage').then((m) => ({
    default: m.OrchestrationPage,
  })),
);
const CompliancePage = lazy(() =>
  import('@/features/compliance/pages/CompliancePage').then((m) => ({
    default: m.CompliancePage,
  })),
);
const AlertsPage = lazy(() =>
  import('@/features/alerts/pages/AlertsPage').then((m) => ({ default: m.AlertsPage })),
);
const AuditPage = lazy(() =>
  import('@/features/audit/pages/AuditPage').then((m) => ({ default: m.AuditPage })),
);
const TopologyPage = lazy(() =>
  import('@/features/topology/pages/TopologyPage').then((m) => ({
    default: m.TopologyPage,
  })),
);

function PageFallback() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-80" />
      <div className="grid grid-cols-4 gap-4 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageFallback />}>
              <LoginPage />
            </Suspense>
          }
        />
      </Route>

      {/* Protected app routes */}
      <Route element={<MainLayout />}>
        <Route
          index
          element={
            <Suspense fallback={<PageFallback />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="/devices"
          element={
            <Suspense fallback={<PageFallback />}>
              <DeviceListPage />
            </Suspense>
          }
        />
        <Route
          path="/rf-analytics"
          element={
            <Suspense fallback={<PageFallback />}>
              <RfAnalyticsPage />
            </Suspense>
          }
        />
        <Route
          path="/orchestration"
          element={
            <Suspense fallback={<PageFallback />}>
              <OrchestrationPage />
            </Suspense>
          }
        />
        <Route
          path="/compliance"
          element={
            <Suspense fallback={<PageFallback />}>
              <CompliancePage />
            </Suspense>
          }
        />
        <Route
          path="/alerts"
          element={
            <Suspense fallback={<PageFallback />}>
              <AlertsPage />
            </Suspense>
          }
        />
        <Route
          path="/audit"
          element={
            <Suspense fallback={<PageFallback />}>
              <AuditPage />
            </Suspense>
          }
        />
        <Route
          path="/topology"
          element={
            <Suspense fallback={<PageFallback />}>
              <TopologyPage />
            </Suspense>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route
        path="*"
        element={
          <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="text-6xl font-bold text-foreground">404</p>
            <p className="text-sm">Page not found</p>
          </div>
        }
      />
    </Routes>
  );
}
