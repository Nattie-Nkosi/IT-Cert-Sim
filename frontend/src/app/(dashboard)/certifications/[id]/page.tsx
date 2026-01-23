'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Certification {
  id: string;
  name: string;
  code: string;
  vendor: string;
  description: string | null;
  exams: Array<{
    id: string;
    name: string;
    description: string | null;
    duration: number;
    passingScore: number;
    isActive: boolean;
    _count?: {
      questions: number;
    };
  }>;
  questions: any[];
}

export default function CertificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token } = useAuthStore();
  const [certification, setCertification] = useState<Certification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }

    const fetchCertification = async () => {
      try {
        const response = await api.get(`/certifications/${params.id}`);
        setCertification(response.data);
      } catch (err: any) {
        setError('Failed to load certification details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCertification();
    }
  }, [token, user, router, params.id]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading certification...</p>
        </div>
      </div>
    );
  }

  if (error || !certification) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 mb-4">
          {error || 'Certification not found'}
        </div>
        <Link href="/certifications" className="text-primary hover:underline font-semibold">
          ← Back to Certifications
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/certifications"
        className="text-sm text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-2 font-medium"
      >
        <span>←</span> Back to Certifications
      </Link>

      <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 p-8 rounded-xl shadow-sm border border-primary/10 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="text-sm font-semibold text-primary/80 mb-2">
              {certification.vendor}
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {certification.name}
            </h1>
            <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary text-sm font-bold rounded-full border border-primary/20">
              {certification.code}
            </div>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🎓</span>
          </div>
        </div>

        {certification.description && (
          <p className="text-muted-foreground mb-6 text-lg">
            {certification.description}
          </p>
        )}

        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-lg">
            <span className="text-lg">📝</span>
            <span className="font-semibold">Questions:</span>
            <span className="text-primary font-bold">
              {certification.questions.length}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-lg">
            <span className="text-lg">🎯</span>
            <span className="font-semibold">Exams:</span>
            <span className="text-primary font-bold">
              {certification.exams.length}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Available Exams
        </h2>

        {certification.exams.length === 0 ? (
          <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 p-8 rounded-xl shadow-sm border border-primary/10 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <p className="text-muted-foreground">
              No exams available for this certification yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certification.exams
              .filter((exam) => exam.isActive)
              .map((exam) => (
                <div
                  key={exam.id}
                  className="group bg-white p-6 rounded-xl shadow-sm border hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold flex-1 group-hover:text-primary transition-colors">{exam.name}</h3>
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center ml-3">
                      <span className="text-lg">⏱️</span>
                    </div>
                  </div>
                  {exam.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {exam.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4 text-sm bg-primary/5 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <span>⏰</span> Duration:
                      </span>
                      <span className="font-semibold text-primary">{exam.duration} minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <span>🎯</span> Passing Score:
                      </span>
                      <span className="font-semibold text-primary">{exam.passingScore}%</span>
                    </div>
                    {exam._count && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <span>📝</span> Questions:
                        </span>
                        <span className="font-semibold text-primary">
                          {exam._count.questions}
                        </span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/exam/${exam.id}`}
                    className="block w-full px-4 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-all hover:scale-105 text-center font-semibold shadow-md"
                  >
                    Start Exam
                  </Link>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
