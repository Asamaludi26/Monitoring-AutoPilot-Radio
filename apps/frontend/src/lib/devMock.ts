// DEV ONLY — hapus file ini dan import-nya di main.tsx setelah backend siap
import { useAuthStore } from '@/store/authStore';
import type { User, AuthTokens } from '@/types';

const mockUser: User = {
  id: 'dev-001',
  email: 'admin@rsocp.local',
  name: 'Dev Admin',
  role: 'SUPER_ADMIN',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTokens: AuthTokens = {
  accessToken: 'dev-bypass-token',
  refreshToken: 'dev-bypass-refresh',
  expiresIn: 86400,
};

export function seedDevAuth() {
  const { isAuthenticated, setAuth } = useAuthStore.getState();
  if (!isAuthenticated) {
    setAuth(mockUser, mockTokens);
  }
}
