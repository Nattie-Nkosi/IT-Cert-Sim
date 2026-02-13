'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface FlaggedAttempt {
  id: string;
  userId: string;
  examId: string;
  score: number;
  passed: boolean;
  startedAt: string;
  completedAt: string | null;
  tabSwitchCount: number;
  flagged: boolean;
  flagReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  user: {
    id: string;
    email: string;
    name: string;
  };
  exam: {
    id: string;
    name: string;
  };
}

export default function FlaggedAttemptsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();

  const [attempts, setAttempts] = useState<FlaggedAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchFlaggedAttempts();
  }, [token, user, router, hasHydrated]);

  const fetchFlaggedAttempts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/flagged-attempts');
      setAttempts(response.data);
    } catch (err: any) {
      setError('Failed to load flagged attempts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          Flagged Exam Attempts
        </h1>
        <p className="text-lg text-muted-foreground">
          Review exam attempts flagged for suspicious activity
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg border border-red-500/30">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading flagged attempts...</p>
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl shadow-sm border">
          <div className="w-16 h-16 bg-green-500/10 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <p className="text-green-700 dark:text-green-400 font-semibold">No flagged attempts found</p>
          <p className="text-muted-foreground mt-2">All exam attempts appear to be legitimate</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <div
              key={attempt.id}
              className="bg-card p-6 rounded-xl shadow-sm border border-red-500/30 hover:shadow-md transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold">{attempt.exam.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    User: {attempt.user.name} ({attempt.user.email})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    attempt.passed
                      ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                      : 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                  }`}>
                    {attempt.passed ? 'PASSED' : 'FAILED'}
                  </span>
                  <span className="px-3 py-1 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full text-xs font-bold">
                    FLAGGED
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Score</div>
                  <div className="text-xl font-bold">{attempt.score.toFixed(1)}%</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Tab Switches</div>
                  <div className={`text-xl font-bold ${
                    attempt.tabSwitchCount >= 3 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {attempt.tabSwitchCount}
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Started</div>
                  <div className="text-sm font-medium">{formatDate(attempt.startedAt)}</div>
                </div>
              </div>

              <div className="bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Flag Reason:</div>
                <p className="text-red-600 dark:text-red-400">{attempt.flagReason || 'No reason provided'}</p>
              </div>

              {(attempt.ipAddress || attempt.userAgent) && (
                <div className="mt-4 text-xs text-muted-foreground">
                  {attempt.ipAddress && <div>IP: {attempt.ipAddress}</div>}
                  {attempt.userAgent && <div className="truncate">User Agent: {attempt.userAgent}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
