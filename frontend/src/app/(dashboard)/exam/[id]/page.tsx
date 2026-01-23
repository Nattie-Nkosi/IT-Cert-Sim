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
        <p className="text-center text-muted-foreground">Loading exam...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-100 text-red-700 rounded-md mb-4">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header with timer */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{exam.name}</h1>
              <p className="text-sm text-muted-foreground">
                {exam.certification.name}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600' : ''}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <p className="text-sm text-muted-foreground">Time Remaining</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
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
            <div className="bg-white p-8 rounded-lg shadow-sm border mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded">
                  {currentQuestion.questionType.replace('_', ' ')}
                </span>
                <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded">
                  {currentQuestion.difficulty}
                </span>
              </div>

              <h2 className="text-xl font-medium mb-6">
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
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
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
                        className="mt-1 mr-3"
                      />
                      <span className="flex-1">{answer.answerText}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentQuestionIndex === exam.questions.length - 1 ? (
                <button
                  onClick={handleSubmitExam}
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Exam'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(exam.questions.length - 1, prev + 1))}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
