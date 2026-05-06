import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RadioDevice, DeviceListQuery, PaginationMeta } from '@/types';

interface DeviceListResponse {
  items: RadioDevice[];
  meta: PaginationMeta;
}

export function useDevices(query: DeviceListQuery = {}) {
  return useQuery({
    queryKey: ['devices', query],
    queryFn: () =>
      api.get<DeviceListResponse>('/devices', query as Record<string, string | number | boolean | undefined>),
    select: (res) => res,
    staleTime: 30_000,
  });
}
