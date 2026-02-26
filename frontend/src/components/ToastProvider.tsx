'use client';

import { Toaster } from 'sonner';
import { useAuthStore } from '@/lib/store';

export function ToastProvider() {
  const { theme } = useAuthStore();

  const resolvedTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  return (
    <Toaster
      theme={resolvedTheme as 'light' | 'dark'}
      position="bottom-right"
      toastOptions={{
        style: {
          borderRadius: '0px',
          border: '1px solid',
        },
      }}
    />
  );
}
