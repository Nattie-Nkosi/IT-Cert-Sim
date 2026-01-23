'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface ExamAttempt {
  id: string;
  score: number;
  passed: boolean;
  startedAt: string;
  completedAt: string;
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
  const { user, token } = useAuthStore();
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  useEffect(() => {
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
  }, [token, user, router]);

  if (!user) return null;

  const filteredAttempts = attempts.filter((attempt) => {
    if (filter === 'passed') return attempt.passed;
    if (filter === 'failed') return !attempt.passed;
    return true;
  });

  const stats = {
    total: attempts.length,
    passed: attempts.filter((a) => a.passed).length,
    failed: attempts.filter((a) => !a.passed).length,
    averageScore:
      attempts.length > 0
        ? Math.round(attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length)
        : 0,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Exam History
        </h1>
        <p className="text-lg text-muted-foreground">
          Review your past exam attempts and track your progress
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="group bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-xl shadow-sm border border-primary/20 hover:shadow-md hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-primary/80">
              Total Attempts
            </div>
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">📝</span>
            </div>
          </div>
          <div className="text-4xl font-bold text-primary">{stats.total}</div>
        </div>

        <div className="group bg-gradient-to-br from-green-500/10 to-green-500/5 p-6 rounded-xl shadow-sm border border-green-500/20 hover:shadow-md hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-green-700/80">
              Passed
            </div>
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">✅</span>
            </div>
          </div>
          <div className="text-4xl font-bold text-green-600">{stats.passed}</div>
        </div>

        <div className="group bg-gradient-to-br from-red-500/10 to-red-500/5 p-6 rounded-xl shadow-sm border border-red-500/20 hover:shadow-md hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-red-700/80">
              Failed
            </div>
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">❌</span>
            </div>
          </div>
          <div className="text-4xl font-bold text-red-600">{stats.failed}</div>
        </div>

        <div className="group bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-6 rounded-xl shadow-sm border border-blue-500/20 hover:shadow-md hover:scale-105 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-blue-700/80">
              Average Score
            </div>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
          </div>
          <div className="text-4xl font-bold text-blue-600">{stats.averageScore}%</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-md'
                : 'bg-primary/5 hover:bg-primary/10 text-primary'
            }`}
          >
            All ({attempts.length})
          </button>
          <button
            onClick={() => setFilter('passed')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              filter === 'passed'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-green-50 hover:bg-green-100 text-green-700'
            }`}
          >
            Passed ({stats.passed})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              filter === 'failed'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-red-50 hover:bg-red-100 text-red-700'
            }`}
          >
            Failed ({stats.failed})
          </button>
        </div>
      </div>

      {/* Attempts List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading history...</p>
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-xl shadow-sm border border-primary/10">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
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
              className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-all hover:scale-105 shadow-md font-semibold"
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
              className="group bg-white p-6 rounded-xl shadow-sm border hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{attempt.exam.name}</h3>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        attempt.passed
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
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
                    className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-all hover:scale-105 text-center text-sm font-semibold whitespace-nowrap shadow-md"
                  >
                    Retake
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
