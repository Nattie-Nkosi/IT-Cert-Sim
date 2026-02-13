'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
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

export default function HistoryPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'EXAM' | 'PRACTICE'>('all');
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
    } catch (err: any) {
      setError('Failed to delete exam attempt');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const filteredAttempts = attempts.filter((attempt) => {
    const statusMatch =
      filter === 'all' ||
      (filter === 'passed' && attempt.passed) ||
      (filter === 'failed' && !attempt.passed);
    const modeMatch =
      modeFilter === 'all' || attempt.mode === modeFilter;
    return statusMatch && modeMatch;
  });

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-sky-600 bg-clip-text text-transparent">
          Exam History
        </h1>
        <p className="text-lg text-muted-foreground">
          Review your past exam attempts and track your progress
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg border border-red-500/30">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="group bg-card p-6 rounded-xl shadow-sm border hover:shadow-md hover:border-primary/50 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-muted-foreground">
              Total Attempts
            </div>
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-lg">📝</span>
            </div>
          </div>
          <div className="text-4xl font-bold">{stats.total}</div>
        </div>

        <div className="group bg-card p-6 rounded-xl shadow-sm border hover:shadow-md hover:border-primary/50 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-muted-foreground">
              Passed
            </div>
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-lg">✅</span>
            </div>
          </div>
          <div className="text-4xl font-bold">{stats.passed}</div>
        </div>

        <div className="group bg-card p-6 rounded-xl shadow-sm border hover:shadow-md hover:border-primary/50 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-muted-foreground">
              Failed
            </div>
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-lg">❌</span>
            </div>
          </div>
          <div className="text-4xl font-bold">{stats.failed}</div>
        </div>

        <div className="group bg-card p-6 rounded-xl shadow-sm border hover:shadow-md hover:border-primary/50 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-muted-foreground">
              Average Score
            </div>
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
          </div>
          <div className="text-4xl font-bold">{stats.averageScore}%</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-card p-4 rounded-xl shadow-sm border mb-6">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Status
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'border hover:bg-accent'
                }`}
              >
                All ({attempts.length})
              </button>
              <button
                onClick={() => setFilter('passed')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  filter === 'passed'
                    ? 'bg-primary text-primary-foreground'
                    : 'border hover:bg-accent'
                }`}
              >
                Passed ({stats.passed})
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  filter === 'failed'
                    ? 'bg-primary text-primary-foreground'
                    : 'border hover:bg-accent'
                }`}
              >
                Failed ({stats.failed})
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Mode
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setModeFilter('all')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  modeFilter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'border hover:bg-accent'
                }`}
              >
                All ({attempts.length})
              </button>
              <button
                onClick={() => setModeFilter('EXAM')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  modeFilter === 'EXAM'
                    ? 'bg-primary text-primary-foreground'
                    : 'border hover:bg-accent'
                }`}
              >
                Exam ({stats.exams})
              </button>
              <button
                onClick={() => setModeFilter('PRACTICE')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  modeFilter === 'PRACTICE'
                    ? 'bg-primary text-primary-foreground'
                    : 'border hover:bg-accent'
                }`}
              >
                Practice ({stats.practice})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attempts List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading history...</p>
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl shadow-sm border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📈</span>
          </div>
          <p className="text-muted-foreground mb-4">
            {filter === 'all'
              ? 'No exam attempts yet. Start practicing!'
              : `No ${filter} attempts found.`}
          </p>
          {filter === 'all' && (
            <Link
              href="/exams"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-semibold"
            >
              Browse Exams
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAttempts.map((attempt) => (
            <div
              key={attempt.id}
              className="group bg-card p-6 rounded-xl shadow-sm border hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{attempt.exam.name}</h3>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        attempt.mode === 'PRACTICE'
                          ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
                          : 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30'
                      }`}
                    >
                      {attempt.mode === 'PRACTICE' ? '📚 PRACTICE' : '🎯 EXAM'}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${
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
                      <span className="text-muted-foreground">Passing Score:</span>
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
                    className="px-4 py-2 border-2 border-primary/20 rounded-lg hover:border-primary hover:bg-primary/5 text-center text-sm font-semibold whitespace-nowrap transition-all"
                  >
                    View Results
                  </Link>
                  <Link
                    href={`/exam/${attempt.exam.id}`}
                    className="px-4 py-2 bg-gradient-to-r from-primary to-sky-600 text-white rounded-lg hover:opacity-90 transition-all hover:scale-105 text-center text-sm font-semibold whitespace-nowrap shadow-md"
                  >
                    Retake
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(attempt)}
                    className="px-4 py-2 border-2 border-red-500/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/10 hover:border-red-500/50 text-center text-sm font-semibold whitespace-nowrap transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
