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

export default function ExamResultsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();

  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
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
  }, [token, user, router, searchParams]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-100 text-red-700 rounded-md mb-4">
          {error || 'Results not found'}
        </div>
        <Link href="/dashboard" className="text-primary hover:underline">
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
        {/* Results Header */}
        <div className="bg-white p-8 rounded-lg shadow-sm border mb-8">
          <div className="text-center mb-6">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                attempt.passed ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <span className={`text-4xl ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                {attempt.passed ? '✓' : '✗'}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {attempt.passed ? 'Congratulations!' : 'Keep Practicing!'}
            </h1>
            <p className="text-muted-foreground">
              {attempt.passed
                ? 'You passed the exam!'
                : "Don't give up, try again to improve your score"}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold">{Math.round(attempt.score)}%</div>
              <div className="text-sm text-muted-foreground mt-1">Your Score</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold">{attempt.exam.passingScore}%</div>
              <div className="text-sm text-muted-foreground mt-1">Passing Score</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold">
                {correctAnswersCount}/{attempt.exam.questions.length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Correct</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold">
                {new Date(attempt.completedAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Date</div>
            </div>
          </div>
        </div>

        {/* Exam Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <h2 className="text-xl font-bold mb-2">{attempt.exam.name}</h2>
          <p className="text-sm text-muted-foreground">
            {attempt.exam.certification.name} ({attempt.exam.certification.code})
          </p>
        </div>

        {/* Review Answers */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="w-full flex items-center justify-between text-left font-medium"
          >
            <span>Review Answers</span>
            <span>{showAnswers ? '▼' : '▶'}</span>
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
                                : 'border-gray-200'
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

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href={`/exam/${attempt.exam.id}`}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-center font-medium"
          >
            Retake Exam
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 px-6 py-3 border border-border rounded-md hover:bg-accent text-center font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
