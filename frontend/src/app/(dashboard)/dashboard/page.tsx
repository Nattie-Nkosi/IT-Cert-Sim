'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Stats {
  totalAttempts: number;
  passedExams: number;
  averageScore: number;
  certifications: number;
  exams: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const [certificationsRes, examsRes, attemptsRes] = await Promise.all([
          api.get('/certifications'),
          api.get('/exams'),
          api.get('/exams/attempts/my').catch(() => ({ data: [] })),
        ]);

        const attempts = attemptsRes.data || [];
        const passedExams = attempts.filter((a: any) => a.passed).length;
        const averageScore = attempts.length > 0
          ? attempts.reduce((acc: number, a: any) => acc + a.score, 0) / attempts.length
          : 0;

        setStats({
          totalAttempts: attempts.length,
          passedExams,
          averageScore: Math.round(averageScore),
          certifications: certificationsRes.data.length,
          exams: examsRes.data.length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-lg text-muted-foreground">
          Ready to continue your certification journey?
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading your stats...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="group bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-xl shadow-sm border border-primary/20 hover:shadow-md hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-primary/80">
                  Total Attempts
                </div>
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📝</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-primary">{stats?.totalAttempts || 0}</div>
            </div>

            <div className="group bg-gradient-to-br from-green-500/10 to-green-500/5 p-6 rounded-xl shadow-sm border border-green-500/20 hover:shadow-md hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-green-700/80">
                  Passed Exams
                </div>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-green-600">
                {stats?.passedExams || 0}
              </div>
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
              <div className="text-4xl font-bold text-blue-600">{stats?.averageScore || 0}%</div>
            </div>

            <div className="group bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-6 rounded-xl shadow-sm border border-purple-500/20 hover:shadow-md hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-purple-700/80">
                  Available Exams
                </div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🎯</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-purple-600">
                {stats?.exams || 0}
              </div>
            </div>
          </div>

          {user.role === 'ADMIN' && (
            <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6 rounded-xl shadow-sm border border-amber-500/20">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <span className="mr-2">🛠️</span>
                Admin Panel
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link
                  href="/admin/questions"
                  className="block w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:opacity-90 transition-all hover:scale-105 text-center font-semibold shadow-md"
                >
                  📝 Manage Questions
                </Link>
                <Link
                  href="/admin/upload"
                  className="block w-full px-4 py-3 border-2 border-amber-500/30 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all text-center font-semibold"
                >
                  📤 Upload Question
                </Link>
                <Link
                  href="/certifications"
                  className="block w-full px-4 py-3 border-2 border-amber-500/30 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all text-center font-semibold"
                >
                  🎓 Manage Certs
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="mr-2">⚡</span>
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  href="/exams"
                  className="block w-full px-6 py-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-all hover:scale-105 text-center font-semibold shadow-md"
                >
                  🎯 Browse Exams
                </Link>
                <Link
                  href="/certifications"
                  className="block w-full px-6 py-4 border-2 border-primary/20 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center font-semibold"
                >
                  📚 View Certifications
                </Link>
                <Link
                  href="/history"
                  className="block w-full px-6 py-4 border-2 border-primary/20 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center font-semibold"
                >
                  📈 View My History
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 p-8 rounded-xl shadow-sm border border-primary/10 hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="mr-2">🚀</span>
                Getting Started
              </h2>
              <div className="space-y-5">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-purple-600 text-white rounded-lg flex items-center justify-center font-bold mr-4 shadow-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Choose a Certification</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Browse available IT certifications
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-purple-600 text-white rounded-lg flex items-center justify-center font-bold mr-4 shadow-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Take Practice Exams</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Test your knowledge with realistic exams
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-purple-600 text-white rounded-lg flex items-center justify-center font-bold mr-4 shadow-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Track Your Progress</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review results and improve your scores
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
