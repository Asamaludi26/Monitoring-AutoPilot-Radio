import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { LoginPayload, User, AuthTokens } from '@/types';

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export function useLogin() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post<LoginResponse>('/auth/login', payload),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.tokens);
      toast.success(`Welcome back, ${res.data.user.name}`);
      navigate('/', { replace: true });
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : 'Login failed. Please try again.';
      toast.error(message);
    },
  });
}
