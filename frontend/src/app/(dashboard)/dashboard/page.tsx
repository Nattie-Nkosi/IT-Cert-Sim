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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}! 👋</h1>
        <p className="text-muted-foreground">
          Ready to continue your certification journey?
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your stats...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Total Attempts
              </div>
              <div className="text-3xl font-bold">{stats?.totalAttempts || 0}</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Passed Exams
              </div>
              <div className="text-3xl font-bold text-green-600">
                {stats?.passedExams || 0}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Average Score
              </div>
              <div className="text-3xl font-bold">{stats?.averageScore || 0}%</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Available Exams
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {stats?.exams || 0}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/exams"
                  className="block w-full px-4 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-center font-medium"
                >
                  Browse Exams
                </Link>
                <Link
                  href="/certifications"
                  className="block w-full px-4 py-3 border border-border rounded-md hover:bg-accent transition-colors text-center font-medium"
                >
                  View Certifications
                </Link>
                <Link
                  href="/history"
                  className="block w-full px-4 py-3 border border-border rounded-md hover:bg-accent transition-colors text-center font-medium"
                >
                  View My History
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-bold mb-4">Getting Started</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mr-3">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium">Choose a Certification</h3>
                    <p className="text-sm text-muted-foreground">
                      Browse available IT certifications
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mr-3">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium">Take Practice Exams</h3>
                    <p className="text-sm text-muted-foreground">
                      Test your knowledge with realistic exams
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mr-3">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium">Track Your Progress</h3>
                    <p className="text-sm text-muted-foreground">
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
