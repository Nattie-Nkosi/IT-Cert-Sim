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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Exam History</h1>
        <p className="text-muted-foreground">
          Review your past exam attempts and track your progress
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Total Attempts
          </div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Passed
          </div>
          <div className="text-3xl font-bold text-green-600">{stats.passed}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Failed
          </div>
          <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Average Score
          </div>
          <div className="text-3xl font-bold">{stats.averageScore}%</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All ({attempts.length})
          </button>
          <button
            onClick={() => setFilter('passed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'passed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Passed ({stats.passed})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'failed'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Failed ({stats.failed})
          </button>
        </div>
      </div>

      {/* Attempts List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <p className="text-muted-foreground mb-4">
            {filter === 'all'
              ? 'No exam attempts yet. Start practicing!'
              : `No ${filter} attempts found.`}
          </p>
          {filter === 'all' && (
            <Link
              href="/exams"
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
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
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{attempt.exam.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        attempt.passed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {attempt.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {attempt.exam.certification.vendor} •{' '}
                    {attempt.exam.certification.name} ({attempt.exam.certification.code})
                  </p>

                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Score:</span>{' '}
                      <span className="font-medium">{Math.round(attempt.score)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Passing Score:</span>{' '}
                      <span className="font-medium">{attempt.exam.passingScore}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date:</span>{' '}
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
                    className="px-4 py-2 border border-border rounded-md hover:bg-accent text-center text-sm font-medium whitespace-nowrap"
                  >
                    View Results
                  </Link>
                  <Link
                    href={`/exam/${attempt.exam.id}`}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-center text-sm font-medium whitespace-nowrap"
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
