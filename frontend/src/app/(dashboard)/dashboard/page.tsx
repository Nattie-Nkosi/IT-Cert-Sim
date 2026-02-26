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
  practiceAttempts: number;
  examAttempts: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

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
        const examAttempts = attempts.filter((a: any) => a.mode === 'EXAM');
        const practiceAttempts = attempts.filter((a: any) => a.mode === 'PRACTICE');
        const passedExams = examAttempts.filter((a: any) => a.passed).length;
        const averageScore = attempts.length > 0
          ? attempts.reduce((acc: number, a: any) => acc + a.score, 0) / attempts.length
          : 0;

        setStats({
          totalAttempts: attempts.length,
          passedExams,
          averageScore: Math.round(averageScore),
          certifications: certificationsRes.data.length,
          exams: examsRes.data.length,
          practiceAttempts: practiceAttempts.length,
          examAttempts: examAttempts.length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, user, router, hasHydrated]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10 border-l-4 border-primary pl-4">
        <h1 className="text-3xl font-bold mb-1">
          Welcome back, {user.name}
        </h1>
        <p className="text-muted-foreground">
          Ready to continue your certification journey?
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground mt-4">Loading your stats...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border mb-10">
            {[
              { label: 'Exam Attempts', value: stats?.examAttempts || 0, icon: '🎯' },
              { label: 'Practice Sessions', value: stats?.practiceAttempts || 0, icon: '📚' },
              { label: 'Passed Exams', value: stats?.passedExams || 0, icon: '✅' },
              { label: 'Average Score', value: `${stats?.averageScore || 0}%`, icon: '📊' },
              { label: 'Total Attempts', value: stats?.totalAttempts || 0, icon: '📝' },
              { label: 'Available Exams', value: stats?.exams || 0, icon: '🎓' },
            ].map((stat) => (
              <div key={stat.label} className="bg-card p-6 hover:bg-primary/5 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
                  <div className="w-10 h-10 bg-muted flex items-center justify-center">
                    <span className="text-lg">{stat.icon}</span>
                  </div>
                </div>
                <div className="text-4xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>

          {user.role === 'ADMIN' && (
            <div className="mb-6 bg-card border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-orange-500 inline-block" />
                Admin Panel
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Link
                  href="/admin/questions"
                  className="block w-full px-4 py-3 bg-primary text-primary-foreground hover:bg-sky-600 transition-colors text-center font-semibold"
                >
                  📝 Manage Questions
                </Link>
                <Link
                  href="/admin/exams"
                  className="block w-full px-4 py-3 border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors text-center font-semibold"
                >
                  🎯 Manage Exams
                </Link>
                <Link
                  href="/admin/upload"
                  className="block w-full px-4 py-3 border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors text-center font-semibold"
                >
                  📤 Upload Question
                </Link>
                <Link
                  href="/certifications"
                  className="block w-full px-4 py-3 border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors text-center font-semibold"
                >
                  🎓 Manage Certs
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-8 border">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary inline-block" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  href="/exams"
                  className="block w-full px-6 py-4 bg-primary text-primary-foreground hover:bg-sky-600 transition-colors text-center font-semibold"
                >
                  🎯 Browse Exams
                </Link>
                <Link
                  href="/certifications"
                  className="block w-full px-6 py-4 border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors text-center font-semibold"
                >
                  📚 View Certifications
                </Link>
                <Link
                  href="/history"
                  className="block w-full px-6 py-4 border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors text-center font-semibold"
                >
                  📈 View My History
                </Link>
              </div>
            </div>

            <div className="bg-card p-8 border">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary inline-block" />
                Getting Started
              </h2>
              <div className="space-y-5">
                {[
                  { n: '1', title: 'Choose a Certification', desc: 'Browse available IT certifications' },
                  { n: '2', title: 'Take Practice Exams', desc: 'Test your knowledge with realistic exams' },
                  { n: '3', title: 'Track Your Progress', desc: 'Review results and improve your scores' },
                ].map((step) => (
                  <div key={step.n} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {step.n}
                    </div>
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
