'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Answer {
  id: string;
  answerText: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  explanation: string | null;
  difficulty: string;
  answers: Answer[];
}

interface ExamQuestion {
  id: string;
  order: number;
  question: Question;
}

interface Exam {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  passingScore: number;
  certification: {
    id: string;
    name: string;
    code: string;
  };
  questions: ExamQuestion[];
}

export default function ExamTakingPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token } = useAuthStore();

  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }

    const fetchExam = async () => {
      try {
        const response = await api.get(`/exams/${params.id}`);
        setExam(response.data);
        setTimeRemaining(response.data.duration * 60); // Convert to seconds
      } catch (err: any) {
        setError('Failed to load exam');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchExam();
    }
  }, [token, user, router, params.id]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 || !exam) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, exam]);

  const handleAnswerChange = (questionId: string, answerId: string | string[]) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleSubmitExam = async () => {
    if (!exam || submitting) return;

    setSubmitting(true);

    try {
      const response = await api.post(`/exams/${exam.id}/submit`, {
        answers: userAnswers,
      });

      router.push(`/exam/${exam.id}/results?attemptId=${response.data.attemptId}`);
    } catch (err: any) {
      setError('Failed to submit exam: ' + (err.response?.data?.message || err.message));
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 mb-4">
          {error || 'Exam not found'}
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex]?.question;
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header with timer */}
      <div className="bg-white/95 backdrop-blur-lg border-b shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-sky-600 bg-clip-text text-transparent">
                {exam.name}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                {exam.certification.name}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeRemaining < 300
                  ? 'bg-red-50 border-2 border-red-500'
                  : 'bg-gradient-to-br from-primary/10 to-sky-500/10 border-2 border-primary/20'
              }`}>
                <span className="text-xl">{timeRemaining < 300 ? '⚠️' : '⏰'}</span>
                <div>
                  <div className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-primary'}`}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Time Remaining</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2 font-semibold">
              <span className="text-primary">
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-primary to-sky-600 h-3 rounded-full transition-all duration-300 shadow-md"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question content */}
      <div className="container mx-auto px-4 py-8">
        {currentQuestion && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border mb-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-semibold px-4 py-2 bg-gradient-to-r from-primary/10 to-sky-500/10 text-primary rounded-full border border-primary/20">
                  {currentQuestion.questionType.replace('_', ' ')}
                </span>
                <span className={`text-sm font-semibold px-4 py-2 rounded-full border ${
                  currentQuestion.difficulty === 'EASY'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : currentQuestion.difficulty === 'MEDIUM'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-8 text-gray-800">
                {currentQuestion.questionText}
              </h2>

              <div className="space-y-3">
                {currentQuestion.answers.map((answer) => {
                  const isSelected = currentQuestion.questionType === 'MULTIPLE_CHOICE'
                    ? (userAnswers[currentQuestion.id] as string[] || []).includes(answer.id)
                    : userAnswers[currentQuestion.id] === answer.id;

                  return (
                    <label
                      key={answer.id}
                      className={`flex items-start p-5 border-2 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-gradient-to-r from-primary/10 to-sky-500/10 shadow-md scale-[1.02]'
                          : 'border-gray-200 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm'
                      }`}
                    >
                      <input
                        type={currentQuestion.questionType === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                        name={currentQuestion.id}
                        value={answer.id}
                        checked={isSelected}
                        onChange={(e) => {
                          if (currentQuestion.questionType === 'MULTIPLE_CHOICE') {
                            const current = (userAnswers[currentQuestion.id] as string[]) || [];
                            const updated = e.target.checked
                              ? [...current, answer.id]
                              : current.filter((id) => id !== answer.id);
                            handleAnswerChange(currentQuestion.id, updated);
                          } else {
                            handleAnswerChange(currentQuestion.id, answer.id);
                          }
                        }}
                        className="mt-1 mr-4 w-5 h-5 accent-primary"
                      />
                      <span className="flex-1 font-medium">{answer.answerText}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-8 py-3 border-2 border-primary/20 rounded-lg hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
              >
                ← Previous
              </button>

              {currentQuestionIndex === exam.questions.length - 1 ? (
                <button
                  onClick={handleSubmitExam}
                  disabled={submitting}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold shadow-lg transition-all hover:scale-105"
                >
                  {submitting ? '⏳ Submitting...' : '✓ Submit Exam'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(exam.questions.length - 1, prev + 1))}
                  className="px-8 py-3 bg-gradient-to-r from-primary to-sky-600 text-white rounded-lg hover:opacity-90 font-semibold shadow-lg transition-all hover:scale-105"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
