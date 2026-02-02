'use client';

import { useEffect, useState } from 'react';

export default function MaintenancePage() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-amber-50/50 to-background dark:from-amber-950/20">
      <div className="text-center">
        <div className="text-6xl mb-6">🔧</div>
        <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          We're performing scheduled maintenance. Please check back soon{dots}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          Maintenance in progress
        </div>
      </div>
    </div>
  );
}
