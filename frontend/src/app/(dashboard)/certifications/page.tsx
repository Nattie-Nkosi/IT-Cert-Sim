'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Certification {
  id: string;
  name: string;
  code: string;
  vendor: string;
  description: string | null;
  _count: {
    questions: number;
    exams: number;
  };
}

export default function CertificationsPage() {
  const router = useRouter();
  const { user, token, hasHydrated } = useAuthStore();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !user) {
      router.push('/login');
      return;
    }

    const fetchCertifications = async () => {
      try {
        const response = await api.get('/certifications');
        setCertifications(response.data);
      } catch (err: any) {
        setError('Failed to load certifications');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCertifications();
  }, [token, user, router, hasHydrated]);

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
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-sky-600 bg-clip-text text-transparent">
          IT Certifications
        </h1>
        <p className="text-lg text-muted-foreground">
          Browse available certification programs and start practicing
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg border border-red-500/30">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading certifications...</p>
        </div>
      ) : certifications.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-primary/5 to-sky-500/5 rounded-xl shadow-sm border border-primary/10">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📚</span>
          </div>
          <p className="text-muted-foreground mb-4">
            No certifications available yet.
          </p>
          {user.role === 'ADMIN' && (
            <Link
              href="/admin/upload"
              className="text-primary hover:underline font-medium"
            >
              Create your first certification →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="group bg-card p-6 rounded-xl shadow-sm border hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-primary/80">
                    {cert.vendor}
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-sky-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🎓</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{cert.name}</h2>
                <div className="inline-block px-3 py-1 bg-gradient-to-r from-primary/10 to-sky-500/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                  {cert.code}
                </div>
              </div>

              {cert.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {cert.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm mb-4 p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-1">
                  <span className="text-base">📝</span>
                  <span className="text-muted-foreground">{cert._count.questions} questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-base">🎯</span>
                  <span className="text-muted-foreground">{cert._count.exams} exams</span>
                </div>
              </div>

              <Link
                href={`/certifications/${cert.id}`}
                className="block w-full px-4 py-3 bg-gradient-to-r from-primary to-sky-600 text-white rounded-lg hover:opacity-90 transition-all hover:scale-105 text-center font-semibold shadow-md"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
