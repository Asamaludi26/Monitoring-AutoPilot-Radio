import { Outlet, Navigate } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Radio className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">RSOCP</h1>
          <p className="text-sm text-muted-foreground">
            RF Spectrum Orchestration &amp; Compliance Platform
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
