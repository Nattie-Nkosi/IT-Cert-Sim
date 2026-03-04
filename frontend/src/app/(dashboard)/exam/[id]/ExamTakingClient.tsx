'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { toast } from 'sonner';

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

  // Security state
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [copyAttempts, setCopyAttempts] = useState(0);

  const isSubmittingRef = useRef(false);
  const attemptIdRef = useRef<string | null>(null);
  const hasBeenFullscreenRef = useRef(false);

  const reportSecurityEvent = useCallback(
    (type: 'FULLSCREEN_EXIT' | 'COPY_ATTEMPT' | 'PASTE_ATTEMPT' | 'WINDOW_BLUR') => {
      if (!attemptIdRef.current || isSubmittingRef.current) return;
      api
        .post(`/exams/attempts/${attemptIdRef.current}/security-event`, { type })
        .catch(() => {});
    },
    []
  );

  const startExam = useCallback(async () => {
    if (!params.id) return;

    try {
      const startResponse = await api.post(`/exams/${params.id}/start`);
      const id = startResponse.data.attemptId;
      setAttemptId(id);
      attemptIdRef.current = id;
      setTabSwitchCount(startResponse.data.tabSwitchCount || 0);

      const examResponse = await api.get(`/exams/${params.id}`);
      setExam(examResponse.data);

      if (startResponse.data.resuming && startResponse.data.serverStartTime) {
        const elapsed = Math.floor(
          (Date.now() - new Date(startResponse.data.serverStartTime).getTime()) / 1000
        );
        setTimeRemaining(Math.max(0, examResponse.data.duration * 60 - elapsed));
      } else {
        setTimeRemaining(examResponse.data.duration * 60);
      }

      // Request fullscreen — needs a prior user gesture, so we attempt it and fall back silently
      document.documentElement.requestFullscreen().catch(() => {});
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

  // Fullscreen tracking
  useEffect(() => {
    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);

      if (inFullscreen) {
        hasBeenFullscreenRef.current = true;
        setShowFullscreenWarning(false);
      } else if (hasBeenFullscreenRef.current && !isSubmittingRef.current) {
        setFullscreenExits((prev) => prev + 1);
        setShowFullscreenWarning(true);
        reportSecurityEvent('FULLSCREEN_EXIT');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [reportSecurityEvent]);

  // Copy, paste, right-click, and keyboard shortcut prevention + reporting
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyAttempts((prev) => prev + 1);
      reportSecurityEvent('COPY_ATTEMPT');
      toast.warning('Copying is not allowed during this exam');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      reportSecurityEvent('PASTE_ATTEMPT');
      toast.error('Pasting is not allowed during this exam');
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (['c', 'C'].includes(e.key)) {
          e.preventDefault();
          setCopyAttempts((prev) => prev + 1);
          reportSecurityEvent('COPY_ATTEMPT');
        } else if (['v', 'V'].includes(e.key)) {
          e.preventDefault();
          reportSecurityEvent('PASTE_ATTEMPT');
        } else if (['p', 'P', 'u', 'U', 's', 'S'].includes(e.key)) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [reportSecurityEvent]);

  // Window blur tracking (debounced to avoid double-firing with visibilitychange)
  useEffect(() => {
    if (!attemptId) return;

    let lastBlur = 0;
    const DEBOUNCE_MS = 2000;

    const handleBlur = () => {
      if (isSubmittingRef.current) return;
      const now = Date.now();
      if (now - lastBlur < DEBOUNCE_MS) return;
      lastBlur = now;
      reportSecurityEvent('WINDOW_BLUR');
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [attemptId, reportSecurityEvent]);

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
    setUserAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmitExam = async () => {
    if (!exam || submitting || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setSubmitting(true);

    // Exit fullscreen on submit
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    try {
      const response = await api.post(`/exams/${exam.id}/submit`, { answers: userAnswers });
      router.push(`/exam/${exam.id}/results?attemptId=${response.data.attemptId}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setError('Failed to submit exam: ' + msg);
      toast.error('Failed to submit exam', { description: msg });
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().catch(() => {
      toast.error('Could not enter fullscreen. Please use F11.');
    });
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-8 w-8 border-2 border-primary border-t-transparent" />
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

  const totalViolations = tabSwitchCount + fullscreenExits + copyAttempts;

  return (
    <div className="min-h-screen bg-background select-none">
      {/* Fullscreen exit warning overlay */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-card border-2 border-red-500 p-8 max-w-md w-full mx-4 text-center">
            <div className="text-5xl mb-4">⛶</div>
            <h2 className="text-xl font-bold mb-2">Fullscreen Required</h2>
            <p className="text-muted-foreground mb-1">Exiting fullscreen has been recorded.</p>
            <p className="text-sm text-red-600 mb-6">
              Exit count: <strong>{fullscreenExits}</strong>
              {fullscreenExits >= 2 && ' — This attempt has been flagged.'}
            </p>
            <button
              onClick={enterFullscreen}
              className="px-6 py-3 bg-primary text-primary-foreground font-semibold w-full"
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Tab switch warning */}
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

      {/* Security status badge */}
      {totalViolations > 0 && (
        <div className="fixed top-4 right-4 z-40 space-y-1.5">
          {tabSwitchCount > 0 && (
            <div className={`px-3 py-1.5 text-xs font-semibold text-right ${
              tabSwitchCount >= 3
                ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30'
                : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
            }`}>
              Tab Switches: {tabSwitchCount}
            </div>
          )}
          {fullscreenExits > 0 && (
            <div className={`px-3 py-1.5 text-xs font-semibold text-right ${
              fullscreenExits >= 2
                ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30'
                : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
            }`}>
              Fullscreen Exits: {fullscreenExits}
            </div>
          )}
          {copyAttempts > 0 && (
            <div className={`px-3 py-1.5 text-xs font-semibold text-right ${
              copyAttempts >= 3
                ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30'
                : 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30'
            }`}>
              Copy Attempts: {copyAttempts}
            </div>
          )}
        </div>
      )}

      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">{exam.name}</h1>
              <p className="text-sm text-muted-foreground font-medium">{exam.certification.name}</p>
            </div>
            <div className="flex items-center gap-3">
              {!isFullscreen && (
                <button
                  onClick={enterFullscreen}
                  className="px-3 py-1.5 text-xs font-semibold border border-yellow-500/50 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                >
                  ⛶ Enter Fullscreen
                </button>
              )}
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
                  const isSelected =
                    currentQuestion.questionType === 'MULTIPLE_CHOICE'
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
