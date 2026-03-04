'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FlaggedAttempt {
  id: string;
  userId: string;
  score: number;
  passed: boolean;
  startedAt: string;
  completedAt: string | null;
  tabSwitchCount: number;
  fullscreenExits: number;
  copyAttempts: number;
  pasteAttempts: number;
  windowBlurs: number;
  flagReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  user: { id: string; email: string; name: string };
  exam: { id: string; name: string };
}

const REASON_FILTERS = [
  { value: 'all', label: 'All Flags' },
  { value: 'tab_switch', label: 'Tab Switches' },
  { value: 'time', label: 'Time Violation' },
];

export default function FlaggedAttemptsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();

  const [attempts, setAttempts] = useState<FlaggedAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [reasonFilter, setReasonFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actingOn, setActingOn] = useState<string | null>(null);

  const fetchAttempts = useCallback(async (loadMore = false) => {
    try {
      if (!loadMore) setLoading(true);
      const currentPage = loadMore ? page + 1 : 1;
      const params = new URLSearchParams({ page: String(currentPage), limit: '20' });
      if (reasonFilter !== 'all') params.set('reason', reasonFilter);
      if (search) params.set('search', search);

      const res = await api.get(`/admin/flagged-attempts?${params}`);
      const data = res.data;

      if (loadMore) {
        setAttempts((prev) => [...prev, ...data.attempts]);
        setPage(currentPage);
      } else {
        setAttempts(data.attempts);
        setPage(1);
      }
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch {
      setError('Failed to load flagged attempts');
    } finally {
      setLoading(false);
    }
  }, [page, reasonFilter, search]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token || !user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchAttempts();
  }, [token, user, router, hasHydrated, reasonFilter, search]);

  const handleUnflag = async (id: string) => {
    setActingOn(id);
    try {
      await api.patch(`/admin/flagged-attempts/${id}/unflag`);
      setAttempts((prev) => prev.filter((a) => a.id !== id));
      setTotal((t) => t - 1);
      toast.success('Flag cleared — attempt marked as reviewed');
    } catch {
      toast.error('Failed to clear flag');
    } finally {
      setActingOn(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActingOn(id);
    try {
      await api.delete(`/admin/flagged-attempts/${id}`);
      setAttempts((prev) => prev.filter((a) => a.id !== id));
      setTotal((t) => t - 1);
      toast.success('Attempt deleted');
    } catch {
      toast.error('Failed to delete attempt');
    } finally {
      setActingOn(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const tabSwitchCount = attempts.filter((a) => a.tabSwitchCount >= 3).length;
  const timeViolationCount = attempts.filter((a) => a.flagReason?.toLowerCase().includes('time')).length;

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 border-l-4 border-red-500 pl-4">
        <h1 className="text-3xl font-bold mb-1">Flagged Exam Attempts</h1>
        <p className="text-muted-foreground">Review and manage suspicious exam activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border mb-8">
        <div className="bg-card p-5">
          <div className="text-sm text-muted-foreground mb-1">Total Flagged</div>
          <div className="text-3xl font-bold text-red-600">{total}</div>
        </div>
        <div className="bg-card p-5">
          <div className="text-sm text-muted-foreground mb-1">Tab Switch Violations</div>
          <div className="text-3xl font-bold text-yellow-600">{tabSwitchCount}</div>
        </div>
        <div className="bg-card p-5">
          <div className="text-sm text-muted-foreground mb-1">Time Violations</div>
          <div className="text-3xl font-bold text-orange-600">{timeViolationCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {REASON_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setReasonFilter(f.value)}
              className={`px-4 py-2 text-sm font-semibold transition-all ${
                reasonFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border hover:bg-accent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="ml-auto flex gap-2">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border bg-background px-3 py-2 text-sm w-56"
          />
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              className="px-3 py-2 border text-sm hover:bg-accent"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/10 text-red-700 border border-red-500/30">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground mt-4">Loading flagged attempts...</p>
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-12 bg-card border">
          <div className="w-16 h-16 bg-green-500/10 flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
          <p className="text-green-700 dark:text-green-400 font-semibold">No flagged attempts found</p>
          <p className="text-muted-foreground mt-1 text-sm">All exam attempts appear to be legitimate</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="bg-card border border-red-500/20 p-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-lg font-bold">{attempt.exam.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {attempt.user.name}
                      <span className="mx-1.5">·</span>
                      <span className="font-mono">{attempt.user.email}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 text-xs font-bold ${
                      attempt.passed
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                        : 'bg-red-500/10 text-red-700 dark:text-red-400'
                    }`}>
                      {attempt.passed ? 'PASSED' : 'FAILED'}
                    </span>
                    <span className="px-3 py-1 bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-bold">
                      FLAGGED
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="bg-muted/50 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Score</div>
                    <div className="text-xl font-bold">{attempt.score.toFixed(1)}%</div>
                  </div>
                  <div className="bg-muted/50 p-3">
                    <div className="text-xs text-muted-foreground mb-1">Started</div>
                    <div className="text-sm font-medium">{new Date(attempt.startedAt).toLocaleString()}</div>
                  </div>
                  <div className="bg-muted/50 p-3 col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">Completed</div>
                    <div className="text-sm font-medium">
                      {attempt.completedAt ? new Date(attempt.completedAt).toLocaleString() : 'Incomplete'}
                    </div>
                  </div>
                </div>

                {/* Security event counters */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-5">
                  {[
                    { label: 'Tab Switches', value: attempt.tabSwitchCount, threshold: 3 },
                    { label: 'Fullscreen Exits', value: attempt.fullscreenExits, threshold: 2 },
                    { label: 'Copy Attempts', value: attempt.copyAttempts, threshold: 3 },
                    { label: 'Paste Attempts', value: attempt.pasteAttempts, threshold: 1 },
                    { label: 'Window Blurs', value: attempt.windowBlurs, threshold: 5 },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className={`p-2 text-center border ${
                        m.value >= m.threshold
                          ? 'bg-red-500/10 border-red-500/30'
                          : m.value > 0
                          ? 'bg-yellow-500/10 border-yellow-500/30'
                          : 'bg-muted/30 border-transparent'
                      }`}
                    >
                      <div className={`text-lg font-bold ${
                        m.value >= m.threshold ? 'text-red-600 dark:text-red-400' :
                        m.value > 0 ? 'text-yellow-600 dark:text-yellow-400' : ''
                      }`}>{m.value}</div>
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Flag reason */}
                <div className="bg-red-500/10 border border-red-500/20 p-3 mb-4">
                  <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Flag Reason: </span>
                  <span className="text-sm text-red-600 dark:text-red-400">{attempt.flagReason || 'No reason recorded'}</span>
                </div>

                {/* IP / UA */}
                {(attempt.ipAddress || attempt.userAgent) && (
                  <div className="text-xs text-muted-foreground mb-4 space-y-0.5">
                    {attempt.ipAddress && <div>IP: {attempt.ipAddress}</div>}
                    {attempt.userAgent && <div className="truncate">UA: {attempt.userAgent}</div>}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 flex-wrap pt-2 border-t">
                  <button
                    onClick={() => handleUnflag(attempt.id)}
                    disabled={actingOn === attempt.id}
                    className="px-4 py-2 text-sm font-semibold border-2 border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                  >
                    {actingOn === attempt.id ? 'Working...' : 'Clear Flag'}
                  </button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        disabled={actingOn === attempt.id}
                        className="px-4 py-2 text-sm font-semibold border-2 border-red-500/40 text-red-700 dark:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        Delete Attempt
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Exam Attempt</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {attempt.user.name}'s attempt on "{attempt.exam.name}". This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(attempt.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={() => fetchAttempts(true)}
                disabled={loading}
                className="px-6 py-3 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 font-semibold transition-all disabled:opacity-50"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
