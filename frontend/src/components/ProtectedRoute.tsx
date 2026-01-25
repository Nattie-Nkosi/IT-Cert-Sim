'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !user) {
      router.push('/login');
      return;
    }

    if (requireAdmin && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [token, user, requireAdmin, router, hasHydrated]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!token || !user) {
    return null;
  }

  if (requireAdmin && user.role !== 'ADMIN') {
    return null;
  }

  return <>{children}</>;
}
