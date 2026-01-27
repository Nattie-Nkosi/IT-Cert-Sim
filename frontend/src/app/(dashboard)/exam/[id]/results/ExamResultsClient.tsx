'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface ExamAttempt {
  id: string;
  score: number;
  passed: boolean;
  startedAt: string;
  completedAt: string;
  answers: Record<string, string | string[]>;
  exam: {
    id: string;
    name: string;
    passingScore: number;
    certification: {
      name: string;
      code: string;
    };
    questions: Array<{
      question: {
        id: string;
        questionText: string;
        questionType: string;
        explanation: string | null;
        answers: Array<{
          id: string;
          answerText: string;
          isCorrect: boolean;
        }>;
      };
    }>;
  };
}

export default function ExamResultsClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, token, hasHydrated } = useAuthStore();

  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !user) {
      router.push('/login');
      return;
    }

    const attemptId = searchParams.get('attemptId');
    if (!attemptId) {
      setError('No attempt ID provided');
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      try {
        const response = await api.get(`/exams/attempts/${attemptId}`);
        setAttempt(response.data);
      } catch (err: any) {
        setError('Failed to load results');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [token, user, router, searchParams, hasHydrated]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 mb-4">
          {error || 'Results not found'}
        </div>
        <Link href="/dashboard" className="text-primary hover:underline font-semibold">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const correctAnswersCount = attempt.exam.questions.filter((q) => {
    const userAnswer = attempt.answers[q.question.id];
    const correctAnswers = q.question.answers.filter((a) => a.isCorrect).map((a) => a.id);

    if (Array.isArray(userAnswer)) {
      return (
        userAnswer.length === correctAnswers.length &&
        userAnswer.every((id) => correctAnswers.includes(id))
      );
    }
    return correctAnswers.includes(userAnswer as string);
  }).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-primary/5 to-sky-500/5 p-8 rounded-xl shadow-sm border border-primary/10 mb-8">
          <div className="text-center mb-6">
            <div
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                attempt.passed
                  ? 'bg-gradient-to-br from-green-400/20 to-green-600/20 border-2 border-green-500'
                  : 'bg-gradient-to-br from-red-400/20 to-red-600/20 border-2 border-red-500'
              }`}
            >
              <span className={`text-5xl ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                {attempt.passed ? '✓' : '✗'}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-sky-600 bg-clip-text text-transparent">
              {attempt.passed ? 'Congratulations!' : 'Keep Practicing!'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {attempt.passed
                ? 'You passed the exam!'
                : "Don't give up, try again to improve your score"}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-5 bg-card/80 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">📊</span>
              </div>
              <div className="text-3xl font-bold text-primary">{Math.round(attempt.score)}%</div>
              <div className="text-sm text-muted-foreground mt-1 font-medium">Your Score</div>
            </div>

            <div className="text-center p-5 bg-card/80 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">🎯</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">{attempt.exam.passingScore}%</div>
              <div className="text-sm text-muted-foreground mt-1 font-medium">Passing Score</div>
            </div>

            <div className="text-center p-5 bg-card/80 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">✅</span>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {correctAnswersCount}/{attempt.exam.questions.length}
              </div>
              <div className="text-sm text-muted-foreground mt-1 font-medium">Correct</div>
            </div>

            <div className="text-center p-5 bg-card/80 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">📅</span>
              </div>
              <div className="text-2xl font-bold text-sky-600">
                {new Date(attempt.completedAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1 font-medium">Date</div>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-sm border mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-sky-600 bg-clip-text text-transparent">
                {attempt.exam.name}
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                {attempt.exam.certification.name} ({attempt.exam.certification.code})
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-sky-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎓</span>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-sm border mb-6">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="w-full flex items-center justify-between text-left font-bold text-lg hover:text-primary transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">📝</span>
              Review Answers
            </span>
            <span className="text-primary">{showAnswers ? '▼' : '▶'}</span>
          </button>

          {showAnswers && (
            <div className="mt-6 space-y-6">
              {attempt.exam.questions.map((q, index) => {
                const userAnswer = attempt.answers[q.question.id];
                const correctAnswerIds = q.question.answers
                  .filter((a) => a.isCorrect)
                  .map((a) => a.id);

                const isCorrect = Array.isArray(userAnswer)
                  ? userAnswer.length === correctAnswerIds.length &&
                    userAnswer.every((id) => correctAnswerIds.includes(id))
                  : correctAnswerIds.includes(userAnswer as string);

                return (
                  <div key={q.question.id} className="border-t pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium flex-1">
                        {index + 1}. {q.question.questionText}
                      </h3>
                      <span
                        className={`ml-4 px-2 py-1 text-xs font-medium rounded ${
                          isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      {q.question.answers.map((answer) => {
                        const isUserAnswer = Array.isArray(userAnswer)
                          ? userAnswer.includes(answer.id)
                          : userAnswer === answer.id;
                        const isCorrectAnswer = answer.isCorrect;

                        return (
                          <div
                            key={answer.id}
                            className={`p-3 rounded border-2 ${
                              isCorrectAnswer
                                ? 'border-green-500 bg-green-50'
                                : isUserAnswer
                                ? 'border-red-500 bg-red-50'
                                : 'border-border'
                            }`}
                          >
                            <div className="flex items-center">
                              {isUserAnswer && (
                                <span className="mr-2 font-bold">
                                  {isCorrectAnswer ? '✓' : '✗'}
                                </span>
                              )}
                              {!isUserAnswer && isCorrectAnswer && (
                                <span className="mr-2 font-bold text-green-600">✓</span>
                              )}
                              <span>{answer.answerText}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {q.question.explanation && (
                      <div className="p-3 bg-blue-50 border-l-4 border-blue-500 text-sm">
                        <strong>Explanation:</strong> {q.question.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-4 flex-col sm:flex-row">
          <Link
            href={`/exam/${attempt.exam.id}`}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-primary to-sky-600 text-white rounded-lg hover:opacity-90 transition-all hover:scale-105 text-center font-semibold shadow-md"
          >
            Retake Exam
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 px-6 py-4 border-2 border-primary/20 rounded-lg hover:border-primary hover:bg-primary/5 text-center font-semibold transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
