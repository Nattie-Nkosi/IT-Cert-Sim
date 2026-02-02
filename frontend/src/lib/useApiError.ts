'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useAuthStore } from './store';

interface ApiError {
  response?: {
    status: number;
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

export function useApiError() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleError = useCallback(
    (error: ApiError, options?: { redirect?: boolean }) => {
      const status = error.response?.status;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'An error occurred';

      if (options?.redirect !== false) {
        switch (status) {
          case 401:
            logout();
            router.push('/unauthorized');
            break;
          case 403:
            router.push('/forbidden');
            break;
          case 503:
            router.push('/maintenance');
            break;
        }
      }

      return { status, message };
    },
    [router, logout]
  );

  return { handleError };
}
