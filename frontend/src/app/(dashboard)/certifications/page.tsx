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
  const { user, token } = useAuthStore();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, [token, user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">IT Certifications</h1>
        <p className="text-muted-foreground">
          Browse available certification programs and start practicing
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading certifications...</p>
        </div>
      ) : certifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
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
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {cert.vendor}
                </div>
                <h2 className="text-xl font-bold mb-2">{cert.name}</h2>
                <div className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  {cert.code}
                </div>
              </div>

              {cert.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {cert.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>{cert._count.questions} questions</span>
                <span>{cert._count.exams} exams</span>
              </div>

              <Link
                href={`/certifications/${cert.id}`}
                className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity text-center font-medium"
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
