import { useAuthStore } from '@/store/authStore';
import type { ApiResponse } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const tokens = useAuthStore.getState().tokens;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new ApiError(401, 'Unauthorized');
  }

  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new ApiError(response.status, body.error ?? 'Request failed', body);
  }

  return body;
}

function get<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const search = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  return request<T>(`${path}${search}`);
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

function put<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

function patch<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}

function del<T>(path: string) {
  return request<T>(path, { method: 'DELETE' });
}

export const api = { get, post, put, patch, del };
export { ApiError };
