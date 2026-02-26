'use client';

import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      window.location.href = '/';
    }
  }, [isOnline]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-3xl font-bold mb-2">You're Offline</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Please check your internet connection and try again.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-medium">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          No connection
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          This page will automatically reload when you're back online.
        </p>
      </div>
    </div>
  );
}
