import { Network } from 'lucide-react';

export function TopologyPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Topology</h1>
        <p className="text-sm text-muted-foreground">
          Network graph — parent-child radio device relationships
        </p>
      </div>
      <div className="flex h-[500px] flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground">
        <Network className="h-12 w-12 opacity-30" aria-hidden="true" />
        <p className="mt-3 text-sm">Topology graph visualization</p>
        <p className="text-xs opacity-60">ECharts graph integration — coming soon</p>
      </div>
    </div>
  );
}
