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
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !certification) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-100 text-red-700 rounded-md mb-4">
          {error || 'Certification not found'}
        </div>
        <Link href="/certifications" className="text-primary hover:underline">
          ← Back to Certifications
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/certifications"
        className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block"
      >
        ← Back to Certifications
      </Link>

      <div className="bg-white p-8 rounded-lg shadow-sm border mb-8">
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-2">
            {certification.vendor}
          </div>
          <h1 className="text-3xl font-bold mb-3">{certification.name}</h1>
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded">
            {certification.code}
          </div>
        </div>

        {certification.description && (
          <p className="text-muted-foreground mb-6">
            {certification.description}
          </p>
        )}

        <div className="flex gap-6 text-sm">
          <div>
            <span className="font-medium">Questions:</span>{' '}
            <span className="text-muted-foreground">
              {certification.questions.length}
            </span>
          </div>
          <div>
            <span className="font-medium">Exams:</span>{' '}
            <span className="text-muted-foreground">
              {certification.exams.length}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Available Exams</h2>

        {certification.exams.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
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
                  className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-bold mb-2">{exam.name}</h3>
                  {exam.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {exam.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{exam.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Passing Score:</span>
                      <span className="font-medium">{exam.passingScore}%</span>
                    </div>
                    {exam._count && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Questions:</span>
                        <span className="font-medium">
                          {exam._count.questions}
                        </span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/exam/${exam.id}`}
                    className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-center font-medium"
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
