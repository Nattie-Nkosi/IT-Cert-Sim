'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ErrorPageProps {
  code: number;
  title: string;
  message: string;
  showBack?: boolean;
  showHome?: boolean;
  showLogin?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
}

const errorColors: Record<number, string> = {
  400: 'text-yellow-500/20',
  401: 'text-orange-500/20',
  403: 'text-red-500/20',
  404: 'text-primary/20',
  500: 'text-red-500/20',
  502: 'text-purple-500/20',
  503: 'text-amber-500/20',
};

export default function ErrorPage({
  code,
  title,
  message,
  showBack = true,
  showHome = true,
  showLogin = false,
  showRetry = false,
  onRetry,
}: ErrorPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className={`text-8xl font-bold ${errorColors[code] || 'text-gray-500/20'} mb-4`}>
          {code}
        </div>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">{message}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all"
            >
              Try Again
            </button>
          )}
          {showBack && (
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-primary/20 font-medium hover:bg-primary/5 transition-all"
            >
              Go Back
            </button>
          )}
          {showHome && (
            <Link
              href="/"
              className="px-6 py-3 border border-primary/20 font-medium hover:bg-primary/5 transition-all"
            >
              Home
            </Link>
          )}
          {showLogin && (
            <Link
              href="/login"
              className="px-6 py-3 bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
