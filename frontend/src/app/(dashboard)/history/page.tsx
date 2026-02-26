'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { toast } from 'sonner';
import { HistoryRowSkeleton } from '@/components/Skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExamAttempt {
  id: string;
  score: number;
  passed: boolean;
  startedAt: string;
  completedAt: string;
  mode: 'EXAM' | 'PRACTICE';
  exam: {
    id: string;
    name: string;
    passingScore: number;
    certification: {
      id: string;
      name: string;
      code: string;
      vendor: string;
    };
  };
}

const PER_PAGE = 10;

export default function HistoryPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'EXAM' | 'PRACTICE'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'score-desc' | 'score-asc'>('date-desc');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attemptToDelete, setAttemptToDelete] = useState<ExamAttempt | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !user) {
      router.push('/login');
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await api.get('/exams/attempts/my');
        setAttempts(response.data);
      } catch (err: any) {
        setError('Failed to load exam history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token, user, router, hasHydrated]);

  const handleDeleteClick = (attempt: ExamAttempt) => {
    setAttemptToDelete(attempt);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!attemptToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/exams/attempts/${attemptToDelete.id}`);
      setAttempts((prev) => prev.filter((a) => a.id !== attemptToDelete.id));
      setDeleteDialogOpen(false);
      setAttemptToDelete(null);
      toast.success('Attempt deleted');
    } catch (err: any) {
      toast.error('Failed to delete exam attempt');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filter, modeFilter, search, sortBy]);

  const filteredAttempts = useMemo(() => {
    let result = attempts.filter((attempt) => {
      const statusMatch =
        filter === 'all' ||
        (filter === 'passed' && attempt.passed) ||
        (filter === 'failed' && !attempt.passed);
      const modeMatch =
        modeFilter === 'all' || attempt.mode === modeFilter;
      const searchMatch = !search || (() => {
        const q = search.toLowerCase();
        return attempt.exam.name.toLowerCase().includes(q) ||
          attempt.exam.certification.name.toLowerCase().includes(q) ||
          attempt.exam.certification.code.toLowerCase().includes(q);
      })();
      return statusMatch && modeMatch && searchMatch;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
        case 'score-desc': return b.score - a.score;
        case 'score-asc': return a.score - b.score;
        default: return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      }
    });

    return result;
  }, [attempts, filter, modeFilter, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAttempts.length / PER_PAGE));
  const pagedAttempts = filteredAttempts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

  const examAttempts = attempts.filter((a) => a.mode === 'EXAM');
  const practiceAttempts = attempts.filter((a) => a.mode === 'PRACTICE');

  const stats = {
    total: attempts.length,
    passed: attempts.filter((a) => a.passed).length,
    failed: attempts.filter((a) => !a.passed).length,
    averageScore:
      attempts.length > 0
        ? Math.round(attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length)
        : 0,
    exams: examAttempts.length,
    practice: practiceAttempts.length,
  };

  const FilterBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold transition-all ${
        active ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10 border-l-4 border-primary pl-4">
        <h1 className="text-3xl font-bold mb-1">Exam History</h1>
        <p className="text-muted-foreground">
          Review your past exam attempts and track your progress
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mb-8">
        {[
          { label: 'Total', value: stats.total, icon: '📝' },
          { label: 'Passed', value: stats.passed, icon: '✅' },
          { label: 'Failed', value: stats.failed, icon: '❌' },
          { label: 'Avg Score', value: `${stats.averageScore}%`, icon: '📊' },
        ].map((s) => (
          <div key={s.label} className="bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <div className="text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters + Search + Sort */}
      <div className="bg-card p-4 border mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search exams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-input bg-background text-foreground focus:outline-none focus:border-primary text-sm"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 border border-input bg-background text-foreground text-sm focus:outline-none focus:border-primary"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="score-desc">Highest score</option>
            <option value="score-asc">Lowest score</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>All ({attempts.length})</FilterBtn>
          <FilterBtn active={filter === 'passed'} onClick={() => setFilter('passed')}>Passed ({stats.passed})</FilterBtn>
          <FilterBtn active={filter === 'failed'} onClick={() => setFilter('failed')}>Failed ({stats.failed})</FilterBtn>
          <span className="w-px bg-border mx-1 hidden sm:block" />
          <FilterBtn active={modeFilter === 'all'} onClick={() => setModeFilter('all')}>All Modes</FilterBtn>
          <FilterBtn active={modeFilter === 'EXAM'} onClick={() => setModeFilter('EXAM')}>Exam ({stats.exams})</FilterBtn>
          <FilterBtn active={modeFilter === 'PRACTICE'} onClick={() => setModeFilter('PRACTICE')}>Practice ({stats.practice})</FilterBtn>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing {pagedAttempts.length} of {filteredAttempts.length} results
          {filteredAttempts.length !== attempts.length && ` (filtered from ${attempts.length})`}
        </p>
      )}

      {/* Attempts List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <HistoryRowSkeleton key={i} />)}
        </div>
      ) : pagedAttempts.length === 0 ? (
        <div className="text-center py-12 bg-card border">
          <div className="w-16 h-16 bg-muted flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📈</span>
          </div>
          <p className="text-muted-foreground mb-4">
            {search ? `No results for "${search}"` : filter === 'all' ? 'No exam attempts yet. Start practicing!' : `No ${filter} attempts found.`}
          </p>
          {filter === 'all' && !search && (
            <Link
              href="/exams"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold"
            >
              Browse Exams
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {pagedAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="group bg-card p-6 border transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{attempt.exam.name}</h3>
                      <span
                        className={`px-3 py-1 text-xs font-bold border ${
                          attempt.mode === 'PRACTICE'
                            ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
                            : 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30'
                        }`}
                      >
                        {attempt.mode === 'PRACTICE' ? '📚 PRACTICE' : '🎯 EXAM'}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-bold border ${
                          attempt.passed
                            ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
                            : 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'
                        }`}
                      >
                        {attempt.passed ? '✅ PASSED' : '❌ FAILED'}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 font-medium">
                      {attempt.exam.certification.vendor} •{' '}
                      {attempt.exam.certification.name} ({attempt.exam.certification.code})
                    </p>

                    <div className="flex gap-6 text-sm flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-bold text-primary">{Math.round(attempt.score)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Passing:</span>
                        <span className="font-bold">{attempt.exam.passingScore}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">
                          {new Date(attempt.completedAt).toLocaleDateString()} at{' '}
                          {new Date(attempt.completedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Link
                      href={`/exam/${attempt.exam.id}/results?attemptId=${attempt.id}`}
                      className="px-4 py-2 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-center text-sm font-semibold whitespace-nowrap transition-all"
                    >
                      View Results
                    </Link>
                    <Link
                      href={`/exam/${attempt.exam.id}`}
                      className="px-4 py-2 bg-primary text-primary-foreground hover:bg-sky-600 transition-colors text-center text-sm font-semibold whitespace-nowrap"
                    >
                      Retake
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(attempt)}
                      className="px-4 py-2 border-2 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/50 text-center text-sm font-semibold whitespace-nowrap transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  First
                </button>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) {
                    p = i + 1;
                  } else if (page <= 3) {
                    p = i + 1;
                  } else if (page >= totalPages - 2) {
                    p = totalPages - 4 + i;
                  } else {
                    p = page - 2 + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-2 text-sm border transition-colors ${
                        p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-2 text-sm border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-3 py-2 text-sm border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam Attempt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exam attempt for{' '}
              <span className="font-semibold">{attemptToDelete?.exam.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
