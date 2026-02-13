'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Exam {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  passingScore: number;
  isActive: boolean;
  certification: {
    id: string;
    name: string;
    code: string;
    vendor: string;
  };
  _count: {
    questions: number;
  };
}

export default function ExamsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !user) {
      router.push('/login');
      return;
    }

    const fetchExams = async () => {
      try {
        const response = await api.get('/exams');
        setExams(response.data);
      } catch (err: any) {
        setError('Failed to load exams');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [token, user, router, hasHydrated]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await api.get('/exams');
      setExams(response.data);
    } catch (err: any) {
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-sky-600 bg-clip-text text-transparent">
            Available Exams
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose an exam to test your knowledge
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 border-2 border-primary/20 rounded-lg hover:border-primary hover:bg-primary/5 font-semibold transition-all disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg border border-red-500/30">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl shadow-sm border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <p className="text-muted-foreground mb-4">
            No exams available yet.
          </p>
          {user.role === 'ADMIN' && (
            <p className="text-sm text-muted-foreground">
              Create certifications and questions first, then build exams.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="group bg-card p-6 rounded-xl shadow-sm border hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    {exam.certification.vendor} • {exam.certification.code}
                  </div>
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-lg">⏱️</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{exam.name}</h2>
                <Link
                  href={`/certifications/${exam.certification.id}`}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  {exam.certification.name}
                </Link>
              </div>

              {exam.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {exam.description}
                </p>
              )}

              <div className="space-y-2 mb-4 text-sm bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <span>📝</span> Questions:
                  </span>
                  <span className="font-semibold">{exam._count.questions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <span>⏰</span> Duration:
                  </span>
                  <span className="font-semibold">{exam.duration} minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <span>🎯</span> Passing Score:
                  </span>
                  <span className="font-semibold">{exam.passingScore}%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/exam/${exam.id}/practice`}
                  className="flex-1 px-4 py-3 border-2 rounded-lg hover:border-primary hover:bg-accent transition-all text-center font-semibold"
                >
                  📚 Practice
                </Link>
                <Link
                  href={`/exam/${exam.id}`}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-center font-semibold"
                >
                  🎯 Start Exam
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
