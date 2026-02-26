'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { StatGridSkeleton, ChartSkeleton, Skeleton } from '@/components/Skeleton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';

interface Stats {
  totalAttempts: number;
  passedExams: number;
  averageScore: number;
  certifications: number;
  exams: number;
  practiceAttempts: number;
  examAttempts: number;
}

interface Attempt {
  id: string;
  score: number;
  passed: boolean;
  mode: 'EXAM' | 'PRACTICE';
  completedAt: string;
  exam: { name: string; passingScore: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
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

        const rawAttempts = attemptsRes.data || [];
        setAttempts(rawAttempts);
        const examAttempts = rawAttempts.filter((a: any) => a.mode === 'EXAM');
        const practiceAttempts = rawAttempts.filter((a: any) => a.mode === 'PRACTICE');
        const passedExams = examAttempts.filter((a: any) => a.passed).length;
        const averageScore = rawAttempts.length > 0
          ? rawAttempts.reduce((acc: number, a: any) => acc + a.score, 0) / rawAttempts.length
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

  const scoreTrendData = useMemo(() => {
    if (!attempts.length) return [];
    return [...attempts]
      .filter((a) => a.completedAt)
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .slice(-20)
      .map((a) => ({
        date: new Date(a.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: a.score,
        mode: a.mode,
      }));
  }, [attempts]);

  const passFailData = useMemo(() => {
    const examOnly = attempts.filter((a) => a.mode === 'EXAM');
    if (!examOnly.length) return [];
    const passed = examOnly.filter((a) => a.passed).length;
    const failed = examOnly.length - passed;
    return [
      { name: 'Passed', value: passed, color: '#22c55e' },
      { name: 'Failed', value: failed, color: '#ef4444' },
    ];
  }, [attempts]);

  const modeComparisonData = useMemo(() => {
    const examScores = attempts.filter((a) => a.mode === 'EXAM');
    const practiceScores = attempts.filter((a) => a.mode === 'PRACTICE');
    const avgExam = examScores.length
      ? Math.round(examScores.reduce((s, a) => s + a.score, 0) / examScores.length)
      : 0;
    const avgPractice = practiceScores.length
      ? Math.round(practiceScores.reduce((s, a) => s + a.score, 0) / practiceScores.length)
      : 0;
    return [
      { name: 'Exam', avg: avgExam, count: examScores.length },
      { name: 'Practice', avg: avgPractice, count: practiceScores.length },
    ];
  }, [attempts]);

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
        <div className="space-y-10">
          <StatGridSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartSkeleton />
            <div className="bg-card border p-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
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

          {attempts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-card border p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary inline-block" />
                  Score Trend
                </h2>
                {scoreTrendData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={scoreTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 0,
                          color: 'hsl(var(--foreground))',
                        }}
                        formatter={(value: any) => [`${value}%`, 'Score']}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                    Complete more attempts to see your score trend
                  </div>
                )}
              </div>

              <div className="bg-card border p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary inline-block" />
                  Performance Breakdown
                </h2>
                <div className="grid grid-cols-2 gap-4 h-[240px]">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 text-center">Pass / Fail Rate</p>
                    {passFailData.length > 0 && passFailData.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={passFailData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            dataKey="value"
                            stroke="none"
                          >
                            {passFailData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 0,
                              color: 'hsl(var(--foreground))',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-xs">
                        No exam attempts yet
                      </div>
                    )}
                    <div className="flex justify-center gap-4 text-xs mt-1">
                      {passFailData.map((d) => (
                        <div key={d.name} className="flex items-center gap-1.5">
                          <span className="w-3 h-3 inline-block" style={{ backgroundColor: d.color }} />
                          {d.name} ({d.value})
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 text-center">Avg Score by Mode</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={modeComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 0,
                            color: 'hsl(var(--foreground))',
                          }}
                          formatter={(value: any) => [`${value}%`, 'Avg Score']}
                        />
                        <Bar dataKey="avg" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

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
