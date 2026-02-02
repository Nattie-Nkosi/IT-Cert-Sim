'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Stats {
  certifications: number;
  questions: number;
  exams: number;
  users: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ certifications: 0, questions: 0, exams: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const [certsRes, examsRes, questionsRes] = await Promise.all([
          api.get('/certifications'),
          api.get('/exams'),
          api.get('/admin/questions'),
        ]);
        setStats({
          certifications: certsRes.data.length,
          questions: questionsRes.data.length,
          exams: examsRes.data.length,
          users: 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, user, router, hasHydrated]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  const adminSections = [
    {
      title: 'Certifications',
      description: 'Create and manage IT certifications (e.g., CompTIA A+, Microsoft MD-102)',
      href: '/admin/certifications',
      icon: '📜',
      color: 'from-blue-500/10 to-blue-600/5',
      borderColor: 'border-blue-500/20',
      count: stats.certifications,
      countLabel: 'certifications',
    },
    {
      title: 'Questions',
      description: 'Upload individual questions, bulk import from PDF, or edit existing questions',
      href: '/admin/questions',
      icon: '❓',
      color: 'from-purple-500/10 to-purple-600/5',
      borderColor: 'border-purple-500/20',
      count: stats.questions,
      countLabel: 'questions',
    },
    {
      title: 'Exams',
      description: 'Create exams by selecting questions, set duration and passing scores',
      href: '/admin/exams',
      icon: '📝',
      color: 'from-green-500/10 to-green-600/5',
      borderColor: 'border-green-500/20',
      count: stats.exams,
      countLabel: 'exams',
    },
    {
      title: 'Quick Upload',
      description: 'Quickly add a single question with answers to a certification',
      href: '/admin/upload',
      icon: '⚡',
      color: 'from-amber-500/10 to-amber-600/5',
      borderColor: 'border-amber-500/20',
    },
    {
      title: 'Audit Logs',
      description: 'Monitor user activity, login attempts, and security events',
      href: '/admin/audit-logs',
      icon: '📋',
      color: 'from-slate-500/10 to-slate-600/5',
      borderColor: 'border-slate-500/20',
    },
    {
      title: 'Flagged Attempts',
      description: 'Review exam attempts flagged for suspicious activity',
      href: '/admin/flagged-attempts',
      icon: '🚩',
      color: 'from-red-500/10 to-red-600/5',
      borderColor: 'border-red-500/20',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage certifications, questions, and exams
        </p>
      </div>

      {/* Stats Overview */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 rounded-xl border border-blue-500/20">
            <div className="text-3xl font-bold text-blue-600">{stats.certifications}</div>
            <div className="text-sm text-muted-foreground">Certifications</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6 rounded-xl border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-600">{stats.questions}</div>
            <div className="text-sm text-muted-foreground">Questions</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 p-6 rounded-xl border border-green-500/20">
            <div className="text-3xl font-bold text-green-600">{stats.exams}</div>
            <div className="text-sm text-muted-foreground">Exams</div>
          </div>
        </div>
      )}

      {/* Workflow Guide */}
      <div className="bg-gradient-to-r from-primary/5 to-sky-500/5 border border-primary/20 rounded-xl p-6 mb-10">
        <h2 className="text-lg font-bold mb-3">Quick Start Guide</h2>
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="px-3 py-1.5 bg-primary/10 rounded-lg font-medium">1. Create Certification</span>
          <span className="text-muted-foreground">→</span>
          <span className="px-3 py-1.5 bg-primary/10 rounded-lg font-medium">2. Add Questions</span>
          <span className="text-muted-foreground">→</span>
          <span className="px-3 py-1.5 bg-primary/10 rounded-lg font-medium">3. Create Exam</span>
          <span className="text-muted-foreground">→</span>
          <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-medium">Ready for Students!</span>
        </div>
      </div>

      {/* Admin Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className={`group bg-gradient-to-br ${section.color} p-6 rounded-xl border ${section.borderColor} hover:shadow-lg transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white/50 dark:bg-white/10 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                {section.icon}
              </div>
              {section.count !== undefined && (
                <span className="px-3 py-1 bg-white/50 dark:bg-white/10 rounded-lg text-sm font-bold">
                  {section.count} {section.countLabel}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
              {section.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
