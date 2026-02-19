export enum AttemptMode {
  EXAM = 'EXAM',
  PRACTICE = 'PRACTICE',
}

export interface Answer {
  id: string;
  answerText: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  explanation?: string;
  imageUrl?: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  answers: Answer[];
}

export interface ExamQuestion {
  id: string;
  questionId: string;
  order: number;
  question: Question;
}

export interface Exam {
  id: string;
  name: string;
  description?: string;
  duration: number;
  passingScore: number;
  isActive: boolean;
  questions: ExamQuestion[];
  certification: {
    id: string;
    name: string;
    code: string;
  };
}

export interface ExamAttempt {
  id: string;
  userId: string;
  examId: string;
  score: number;
  passed: boolean;
  startedAt: string;
  completedAt?: string;
  answers: Record<string, string | string[]>;
  mode: AttemptMode;
  questionFeedback?: Record<string, QuestionFeedback>;
  tabSwitchCount: number;
  flagged: boolean;
  flagReason?: string;
  exam: Exam;
}

export interface QuestionFeedback {
  correct: boolean;
  userAnswer: string | string[];
  correctAnswerIds: string[];
  explanation?: string;
}

export interface StartAttemptResponse {
  attemptId: string;
  resuming: boolean;
  serverStartTime: string;
  tabSwitchCount: number;
  mode: AttemptMode;
}

export interface CheckAnswerResponse {
  correct: boolean;
  correctAnswerIds: string[];
  explanation?: string;
}

export interface SubmitAttemptResponse {
  attemptId: string;
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  passingScore: number;
  flagged: boolean;
}
