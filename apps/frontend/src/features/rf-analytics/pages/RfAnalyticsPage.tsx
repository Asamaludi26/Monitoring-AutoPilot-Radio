import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { RfScore, InterferenceLevel } from '@/types';

const INTERFERENCE_VARIANT: Record<
  InterferenceLevel,
  'success' | 'warning' | 'destructive' | 'secondary' | 'info'
> = {
  NONE: 'success',
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'destructive',
  CRITICAL: 'destructive',
};

function useRfScores() {
  return useQuery({
    queryKey: ['rf-scores'],
    queryFn: () => api.get<RfScore[]>('/rf-analytics/scores'),
    select: (res) => res.data,
    staleTime: 60_000,
  });
}

export function RfAnalyticsPage() {
  const { data: scores, isLoading } = useRfScores();

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: scores?.slice(0, 20).map((s) => s.deviceId.slice(0, 8)) ?? [],
      axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 30 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    series: [
      {
        name: 'RF Score',
        type: 'bar',
        data: scores?.slice(0, 20).map((s) => ({
          value: s.score,
          itemStyle: {
            color:
              s.score >= 80
                ? '#22c55e'
                : s.score >= 60
                  ? '#f59e0b'
                  : '#ef4444',
          },
        })) ?? [],
        barMaxWidth: 32,
      },
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">RF Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Spectrum quality scores &amp; interference detection
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            RF Score by Device (latest 20)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {isLoading ? (
            <Skeleton className="mx-4 h-48" />
          ) : (
            <ReactECharts option={chartOption} style={{ height: 200 }} />
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device ID</TableHead>
              <TableHead>RF Score</TableHead>
              <TableHead>Interference</TableHead>
              <TableHead>Recommended Freq.</TableHead>
              <TableHead>Analysed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && (!scores || scores.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Activity className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No RF scores available</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              scores?.map((score) => (
                <TableRow key={score.deviceId}>
                  <TableCell className="font-mono text-xs">{score.deviceId}</TableCell>
                  <TableCell>
                    <span
                      className={
                        score.score >= 80
                          ? 'font-semibold text-green-400'
                          : score.score >= 60
                            ? 'font-semibold text-yellow-400'
                            : 'font-semibold text-red-400'
                      }
                    >
                      {score.score.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={INTERFERENCE_VARIANT[score.interferenceLevel]}>
                      {score.interferenceLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {score.recommendedFrequency
                      ? `${score.recommendedFrequency} MHz`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(score.analysedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
