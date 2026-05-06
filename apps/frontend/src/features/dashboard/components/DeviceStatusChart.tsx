import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DeviceStatusChartProps {
  online: number;
  offline: number;
  degraded: number;
  unknown?: number;
}

export function DeviceStatusChart({
  online,
  offline,
  degraded,
  unknown = 0,
}: DeviceStatusChartProps) {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#94a3b8' },
    },
    series: [
      {
        name: 'Device Status',
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderWidth: 2, borderColor: 'transparent' },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#f1f5f9' },
        },
        data: [
          { value: online, name: 'Online', itemStyle: { color: '#22c55e' } },
          { value: offline, name: 'Offline', itemStyle: { color: '#ef4444' } },
          { value: degraded, name: 'Degraded', itemStyle: { color: '#f59e0b' } },
          { value: unknown, name: 'Unknown', itemStyle: { color: '#64748b' } },
        ].filter((d) => d.value > 0),
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Device Status</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <ReactECharts option={option} style={{ height: 200 }} />
      </CardContent>
    </Card>
  );
}
