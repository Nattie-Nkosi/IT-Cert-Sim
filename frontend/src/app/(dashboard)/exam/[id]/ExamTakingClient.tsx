'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  imageUrl?: string | null;
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

export default function ExamTakingClient() {
  const router = useRouter();
  const params = useParams();
  const { user, token, hasHydrated } = useAuthStore();

  const [exam, setExam] = useState<Exam | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Anti-cheating state
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const isSubmittingRef = useRef(false);

  // Start exam and create attempt
  const startExam = useCallback(async () => {
    if (!params.id) return;

    try {
      const startResponse = await api.post(`/exams/${params.id}/start`);
      setAttemptId(startResponse.data.attemptId);
      setTabSwitchCount(startResponse.data.tabSwitchCount || 0);

      const examResponse = await api.get(`/exams/${params.id}`);
      setExam(examResponse.data);

      // Calculate remaining time based on server start time
      if (startResponse.data.resuming && startResponse.data.serverStartTime) {
        const serverStart = new Date(startResponse.data.serverStartTime).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - serverStart) / 1000);
        const remaining = Math.max(0, examResponse.data.duration * 60 - elapsedSeconds);
        setTimeRemaining(remaining);
      } else {
        setTimeRemaining(examResponse.data.duration * 60);
      }
    } catch (err: any) {
      setError('Failed to load exam');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token || !user) {
      router.push('/login');
      return;
    }

    startExam();
  }, [token, user, router, hasHydrated, startExam]);

  // Tab switch detection
  useEffect(() => {
    if (!attemptId || isSubmittingRef.current) return;

    const handleVisibilityChange = async () => {
      if (document.hidden && attemptId) {
        try {
          const response = await api.post(`/exams/attempts/${attemptId}/tab-switch`);
          setTabSwitchCount(response.data.tabSwitchCount);
          if (response.data.warning) {
            setShowTabWarning(true);
            setTimeout(() => setShowTabWarning(false), 5000);
          }
        } catch (err) {
          console.error('Failed to track tab switch:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [attemptId]);

  // Prevent copy/paste and right-click
  useEffect(() => {
    const preventCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
      }
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeyboardShortcuts);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, []);

  // Timer
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
    if (!exam || submitting || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      const response = await api.post(`/exams/${exam.id}/submit`, {
        answers: userAnswers,
      });

      router.push(`/exam/${exam.id}/results?attemptId=${response.data.attemptId}`);
    } catch (err: any) {
      setError('Failed to submit exam: ' + (err.response?.data?.message || err.message));
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground mt-4">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30 mb-4">
          {error || 'Exam not found'}
        </div>
      </div>
    );
  }

  if (exam.questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-yellow-500/10 dark:bg-yellow-500/20 border-2 border-yellow-500/30 p-8">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-300 mb-2">No Questions Available</h2>
            <p className="text-yellow-700 dark:text-yellow-400 mb-4">
              This exam doesn&apos;t have any questions yet. Please contact the administrator.
            </p>
            <button
              onClick={() => router.push('/exams')}
              className="px-6 py-3 bg-yellow-600 text-white hover:bg-yellow-700 font-semibold transition-all"
            >
              Back to Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex]?.question;
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="min-h-screen bg-background select-none">
      {/* Tab Switch Warning */}
      {showTabWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-pulse">
          <div className="bg-red-600 text-white px-6 py-3 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold">Warning: Tab Switch Detected!</p>
              <p className="text-sm">Switching tabs during the exam is being monitored.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switch Counter */}
      {tabSwitchCount > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-3 py-2 text-sm font-semibold ${
            tabSwitchCount >= 3 ? 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30' : 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
          }`}>
            Tab Switches: {tabSwitchCount}
          </div>
        </div>
      )}

      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {exam.name}
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                {exam.certification.name}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 ${
                timeRemaining < 300
                  ? 'bg-red-500/10 dark:bg-red-500/20 border-2 border-red-500'
                  : 'bg-primary/10 border-2 border-primary/20'
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

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2 font-semibold">
              <span className="text-primary">
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-muted h-2 shadow-inner">
              <div
                className="bg-primary h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {currentQuestion && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-card p-8 border mb-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-semibold px-4 py-2 bg-primary/10 text-primary border border-primary/20">
                  {currentQuestion.questionType.replace('_', ' ')}
                </span>
                <span className={`text-sm font-semibold px-4 py-2 border ${
                  currentQuestion.difficulty === 'EASY'
                    ? 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
                    : currentQuestion.difficulty === 'MEDIUM'
                    ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30'
                    : 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-8 text-foreground">
                {currentQuestion.questionText}
              </h2>

              {currentQuestion.imageUrl && (
                <div className="mb-6 flex justify-center">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question image"
                    className="max-h-64 border object-contain"
                    draggable={false}
                  />
                </div>
              )}

              <div className="space-y-3">
                {currentQuestion.answers.map((answer) => {
                  const isSelected = currentQuestion.questionType === 'MULTIPLE_CHOICE'
                    ? (userAnswers[currentQuestion.id] as string[] || []).includes(answer.id)
                    : userAnswers[currentQuestion.id] === answer.id;

                  return (
                    <label
                      key={answer.id}
                      className={`flex items-start p-5 border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm'
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
                      <span className="flex-1 font-medium whitespace-pre-wrap">{answer.answerText}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-8 py-3 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
              >
                ← Previous
              </button>

              {currentQuestionIndex === exam.questions.length - 1 ? (
                <button
                  onClick={handleSubmitExam}
                  disabled={submitting}
                  className="px-8 py-3 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-semibold transition-colors"
                >
                  {submitting ? '⏳ Submitting...' : '✓ Submit Exam'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(exam.questions.length - 1, prev + 1))}
                  className="px-8 py-3 bg-primary text-primary-foreground font-semibold hover:bg-sky-600 transition-colors"
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
