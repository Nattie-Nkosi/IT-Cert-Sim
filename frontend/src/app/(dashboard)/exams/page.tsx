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
  const { user, token } = useAuthStore();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, [token, user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Available Exams</h1>
        <p className="text-muted-foreground">
          Choose an exam to test your knowledge
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
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
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="mb-4">
                <div className="text-xs text-muted-foreground mb-2">
                  {exam.certification.vendor} • {exam.certification.code}
                </div>
                <h2 className="text-xl font-bold mb-2">{exam.name}</h2>
                <Link
                  href={`/certifications/${exam.certification.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {exam.certification.name}
                </Link>
              </div>

              {exam.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {exam.description}
                </p>
              )}

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">{exam._count.questions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{exam.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passing Score:</span>
                  <span className="font-medium">{exam.passingScore}%</span>
                </div>
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
  );
}
