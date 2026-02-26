'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Exam, CheckAnswerResponse, AttemptMode } from '@/types/exam';

interface PracticeModeClientProps {
  examId: string;
}

export function PracticeModeClient({ examId }: PracticeModeClientProps) {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attemptId, setAttemptId] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [feedback, setFeedback] = useState<Record<string, CheckAnswerResponse>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      const [examResponse, attemptResponse] = await Promise.all([
        api.get(`/exams/${examId}`),
        api.post(`/exams/${examId}/start?mode=PRACTICE`),
      ]);

      setExam(examResponse.data);
      setAttemptId(attemptResponse.data.attemptId);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load exam:', error);
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = exam?.questions[currentQuestionIndex]?.question;
  const currentQuestionId = currentQuestion?.id || '';
  const currentFeedback = feedback[currentQuestionId];
  const userAnswer = answers[currentQuestionId];

  const handleAnswerChange = (value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionId]: value,
    }));
  };

  const handleCheckAnswer = async () => {
    if (!userAnswer) return;

    try {
      const response = await api.post(`/exams/attempts/${attemptId}/check-answer`, {
        questionId: currentQuestionId,
        answer: userAnswer,
      });

      setFeedback((prev) => ({
        ...prev,
        [currentQuestionId]: response.data,
      }));
    } catch (error) {
      console.error('Failed to check answer:', error);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < (exam?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleEndPractice = () => {
    setShowEndDialog(true);
  };

  const confirmEndPractice = async () => {
    setShowEndDialog(false);
    setSubmitting(true);
    try {
      const response = await api.post(`/exams/${examId}/submit`, {
        answers,
      });

      router.push(`/exam/${examId}/results?attemptId=${response.data.attemptId}`);
    } catch (error) {
      console.error('Failed to submit practice:', error);
      toast.error('Failed to end practice session');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading practice session...</div>
      </div>
    );
  }

  if (!exam || !currentQuestion) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Failed to load practice session</div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{exam.name}</h1>
          <p className="text-muted-foreground">Practice Mode - No time pressure</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </div>
          <Button onClick={handleEndPractice} disabled={submitting} variant="outline">
            End Practice
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {exam.questions.length}
        </div>
        <div className="w-full bg-secondary h-2 mt-2">
          <div
            className="bg-primary h-2 transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / exam.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-start justify-between">
              <div className="flex-1">{currentQuestion.questionText}</div>
              <div className="ml-4">
                <span className="text-xs px-2 py-1 bg-secondary rounded">
                  {currentQuestion.questionType.replace('_', ' ')}
                </span>
              </div>
            </div>
          </CardTitle>
          {currentQuestion.imageUrl && (
            <div className="mt-4 flex justify-center">
              <img
                src={currentQuestion.imageUrl}
                alt="Question image"
                className="max-h-64 border object-contain"
              />
            </div>
          )}
          {currentQuestion.questionType === 'MULTIPLE_CHOICE' && (
            <CardDescription>Select all correct answers</CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {currentQuestion.questionType === 'MULTIPLE_CHOICE' ? (
            <div className="space-y-3">
              {currentQuestion.answers.map((answer) => {
                const isSelected = Array.isArray(userAnswer) && userAnswer.includes(answer.id);
                const isCorrect = currentFeedback?.correctAnswerIds.includes(answer.id);
                const showFeedback = currentFeedback && isSelected;

                return (
                  <div
                    key={answer.id}
                    className={`flex items-start space-x-3 p-4 border-2 transition-colors ${
                      currentFeedback
                        ? isCorrect
                          ? 'border-green-500 bg-green-500/10 dark:bg-green-500/20'
                          : isSelected
                            ? 'border-red-500 bg-red-500/10 dark:bg-red-500/20'
                            : 'border-border'
                        : isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border/80'
                    }`}
                  >
                    <Checkbox
                      id={answer.id}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (!currentFeedback) {
                          const newAnswer = Array.isArray(userAnswer) ? [...userAnswer] : [];
                          if (checked) {
                            newAnswer.push(answer.id);
                          } else {
                            const index = newAnswer.indexOf(answer.id);
                            if (index > -1) newAnswer.splice(index, 1);
                          }
                          handleAnswerChange(newAnswer);
                        }
                      }}
                      disabled={!!currentFeedback}
                    />
                    <Label htmlFor={answer.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="whitespace-pre-wrap">{answer.answerText}</span>
                        {currentFeedback && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 ml-2 shrink-0" />
                        )}
                        {showFeedback && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 ml-2 shrink-0" />
                        )}
                      </div>
                    </Label>
                  </div>
                );
              })}
            </div>
          ) : (
            <RadioGroup
              value={typeof userAnswer === 'string' ? userAnswer : ''}
              onValueChange={handleAnswerChange}
              disabled={!!currentFeedback}
            >
              {currentQuestion.answers.map((answer) => {
                const isSelected = userAnswer === answer.id;
                const isCorrect = currentFeedback?.correctAnswerIds.includes(answer.id);
                const showFeedback = currentFeedback;

                return (
                  <div
                    key={answer.id}
                    className={`flex items-start space-x-3 p-4 border-2 transition-colors ${
                      showFeedback
                        ? isCorrect
                          ? 'border-green-500 bg-green-500/10 dark:bg-green-500/20'
                          : isSelected
                            ? 'border-red-500 bg-red-500/10 dark:bg-red-500/20'
                            : 'border-border'
                        : isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border/80'
                    }`}
                  >
                    <RadioGroupItem value={answer.id} id={answer.id} />
                    <Label htmlFor={answer.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="whitespace-pre-wrap">{answer.answerText}</span>
                        {showFeedback && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 ml-2 shrink-0" />
                        )}
                        {showFeedback && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 ml-2 shrink-0" />
                        )}
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          )}

          {!currentFeedback && userAnswer && (
            <Button onClick={handleCheckAnswer} className="w-full">
              Check Answer
            </Button>
          )}

          {currentFeedback && (
            <Alert className={currentFeedback.correct ? 'border-green-500 bg-green-500/10 dark:bg-green-500/20' : 'border-red-500 bg-red-500/10 dark:bg-red-500/20'}>
              <div className="flex items-start gap-2">
                {currentFeedback.correct ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold mb-1">
                    {currentFeedback.correct ? 'Correct!' : 'Incorrect'}
                  </div>
                  {currentFeedback.explanation && (
                    <AlertDescription>{currentFeedback.explanation}</AlertDescription>
                  )}
                </div>
              </div>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentQuestionIndex < exam.questions.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleEndPractice} disabled={submitting}>
              End Practice
            </Button>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Practice Session?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {Object.keys(feedback).length} of {exam?.questions.length || 0} questions.
              Your results will be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Practicing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndPractice}>
              End Practice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
