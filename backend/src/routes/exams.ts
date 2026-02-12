import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { prisma } from '../lib/prisma';
import { logAudit, getClientInfo } from '../lib/auditLog';

export const examRoutes = new Elysia({ prefix: '/api/exams' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    })
  )
  // Get all active exams
  .get('/', async () => {
    return await prisma.exam.findMany({
      where: { isActive: true },
      include: {
        certification: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  })

  // Get exam by ID (with questions for taking the exam)
  .get('/:id', async ({ params }) => {
    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: {
        certification: true,
        questions: {
          include: {
            question: {
              include: {
                answers: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    // Filter out any exam questions where the question was deleted
    const validQuestions = exam.questions.filter((eq: any) => eq.question !== null);

    // Shuffle questions for each attempt
    const shuffledQuestions = validQuestions
      .map((q: any) => ({ ...q, sort: Math.random() }))
      .sort((a: any, b: any) => a.sort - b.sort)
      .map(({ sort, ...q }: any) => ({
        ...q,
        question: {
          ...q.question,
          // Also shuffle the answers
          answers: q.question.answers
            .map((a: any) => ({ ...a, sort: Math.random() }))
            .sort((a: any, b: any) => a.sort - b.sort)
            .map(({ sort, ...a }: any) => a),
        },
      }));

    return {
      ...exam,
      questions: shuffledQuestions,
    };
  })

  // Start exam - creates an in-progress attempt
  .post(
    '/:id/start',
    async (context: any) => {
      const { params, headers, jwt, query } = context;
      const auth = headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        throw new Error('Unauthorized');
      }

      const token = auth.slice(7);
      const payload = await jwt.verify(token);
      if (!payload) {
        throw new Error('Invalid token');
      }

      const user = payload as { id: string; email: string; role: string };
      const clientInfo = getClientInfo(headers as Record<string, string>);
      const mode = query?.mode === 'PRACTICE' ? 'PRACTICE' : 'EXAM';

      // Check for existing in-progress attempt with same mode
      const existingAttempt = await prisma.examAttempt.findFirst({
        where: {
          userId: user.id,
          examId: params.id,
          completedAt: null,
          mode: mode,
        },
      });

      if (existingAttempt) {
        return {
          attemptId: existingAttempt.id,
          resuming: true,
          serverStartTime: existingAttempt.serverStartTime,
          tabSwitchCount: existingAttempt.tabSwitchCount,
          mode: existingAttempt.mode,
        };
      }

      const exam = await prisma.exam.findUnique({
        where: { id: params.id },
      });

      if (!exam) {
        throw new Error('Exam not found');
      }

      // Create new in-progress attempt
      const attempt = await prisma.examAttempt.create({
        data: {
          userId: user.id,
          examId: params.id,
          score: 0,
          passed: false,
          answers: {},
          mode: mode,
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
          serverStartTime: new Date(),
        },
      });

      await logAudit({
        userId: user.id,
        action: mode === 'PRACTICE' ? 'PRACTICE_START' : 'EXAM_START',
        entity: 'exam',
        entityId: params.id,
        details: { attemptId: attempt.id, examName: exam.name, mode },
        ...clientInfo,
      });

      return {
        attemptId: attempt.id,
        resuming: false,
        serverStartTime: attempt.serverStartTime,
        tabSwitchCount: 0,
        mode: attempt.mode,
      };
    }
  )

  // Track tab switch
  .post(
    '/attempts/:id/tab-switch',
    async (context: any) => {
      const { params, headers, jwt } = context;
      const auth = headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        throw new Error('Unauthorized');
      }

      const token = auth.slice(7);
      const payload = await jwt.verify(token);
      if (!payload) {
        throw new Error('Invalid token');
      }

      const user = payload as { id: string; email: string; role: string };
      const clientInfo = getClientInfo(headers as Record<string, string>);

      const attempt = await prisma.examAttempt.findUnique({
        where: { id: params.id },
      });

      if (!attempt || attempt.userId !== user.id) {
        throw new Error('Attempt not found');
      }

      if (attempt.completedAt) {
        throw new Error('Attempt already completed');
      }

      // Skip tracking for practice mode
      if (attempt.mode === 'PRACTICE') {
        return { tabSwitchCount: 0, warning: false };
      }

      const newCount = attempt.tabSwitchCount + 1;
      const shouldFlag = newCount >= 3;

      await prisma.examAttempt.update({
        where: { id: params.id },
        data: {
          tabSwitchCount: newCount,
          flagged: shouldFlag,
          flagReason: shouldFlag ? `Excessive tab switches: ${newCount}` : attempt.flagReason,
        },
      });

      await logAudit({
        userId: user.id,
        action: 'EXAM_TAB_SWITCH',
        entity: 'examAttempt',
        entityId: params.id,
        details: { tabSwitchCount: newCount, flagged: shouldFlag },
        ...clientInfo,
      });

      return { tabSwitchCount: newCount, warning: newCount >= 2 };
    }
  )

  // Check answer for practice mode (immediate feedback)
  .post(
    '/attempts/:id/check-answer',
    async (context: any) => {
      const { params, body, headers, jwt } = context;
      const auth = headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        throw new Error('Unauthorized');
      }

      const token = auth.slice(7);
      const payload = await jwt.verify(token);
      if (!payload) {
        throw new Error('Invalid token');
      }

      const user = payload as { id: string; email: string; role: string };

      const attempt = await prisma.examAttempt.findUnique({
        where: { id: params.id },
      });

      if (!attempt || attempt.userId !== user.id) {
        throw new Error('Attempt not found');
      }

      if (attempt.mode !== 'PRACTICE') {
        throw new Error('Answer checking only available in practice mode');
      }

      const question = await prisma.question.findUnique({
        where: { id: body.questionId },
        include: {
          answers: true,
        },
      });

      if (!question) {
        throw new Error('Question not found');
      }

      const correctAnswerIds = question.answers
        .filter((a) => a.isCorrect)
        .map((a) => a.id);

      let isCorrect = false;
      if (Array.isArray(body.answer)) {
        isCorrect =
          body.answer.length === correctAnswerIds.length &&
          body.answer.every((id: string) => correctAnswerIds.includes(id));
      } else {
        isCorrect = correctAnswerIds.includes(body.answer);
      }

      return {
        correct: isCorrect,
        correctAnswerIds,
        explanation: question.explanation,
      };
    },
    {
      body: t.Object({
        questionId: t.String(),
        answer: t.Union([t.String(), t.Array(t.String())]),
      }),
    }
  )

  // Submit exam attempt (protected)
  .post(
    '/:id/submit',
    async (context: any) => {
      const { params, body, headers, jwt } = context;
      const auth = headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        throw new Error('Unauthorized');
      }

      const token = auth.slice(7);
      const payload = await jwt.verify(token);
      if (!payload) {
        throw new Error('Invalid token');
      }

      const user = payload as { id: string; email: string; role: string };
      const clientInfo = getClientInfo(headers as Record<string, string>);

      const exam = await prisma.exam.findUnique({
        where: { id: params.id },
        include: {
          questions: {
            include: {
              question: {
                include: {
                  answers: true,
                },
              },
            },
          },
        },
      });

      if (!exam) {
        throw new Error('Exam not found');
      }

      // Find in-progress attempt
      let attempt = await prisma.examAttempt.findFirst({
        where: {
          userId: user.id,
          examId: params.id,
          completedAt: null,
        },
      });

      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = exam.questions.length;

      exam.questions.forEach((examQuestion) => {
        const userAnswer = body.answers[examQuestion.questionId];
        const correctAnswerIds = examQuestion.question.answers
          .filter((a) => a.isCorrect)
          .map((a) => a.id);

        if (Array.isArray(userAnswer)) {
          const isCorrect =
            userAnswer.length === correctAnswerIds.length &&
            userAnswer.every((id) => correctAnswerIds.includes(id));
          if (isCorrect) correctAnswers++;
        } else {
          if (correctAnswerIds.includes(userAnswer)) correctAnswers++;
        }
      });

      const score = (correctAnswers / totalQuestions) * 100;
      const passed = score >= exam.passingScore;
      const now = new Date();

      // Check for time manipulation if we have a start time (skip for practice mode)
      let timeViolation = false;
      if (attempt?.serverStartTime && attempt.mode !== 'PRACTICE') {
        const elapsedMinutes = (now.getTime() - attempt.serverStartTime.getTime()) / 60000;
        const allowedMinutes = exam.duration + 1; // 1 minute grace period
        if (elapsedMinutes > allowedMinutes) {
          timeViolation = true;
        }
      }

      if (attempt) {
        // Update existing attempt
        attempt = await prisma.examAttempt.update({
          where: { id: attempt.id },
          data: {
            score,
            passed,
            answers: body.answers,
            completedAt: now,
            flagged: attempt.flagged || timeViolation,
            flagReason: timeViolation
              ? `${attempt.flagReason || ''} Time exceeded`.trim()
              : attempt.flagReason,
          },
        });
      } else {
        // Create new attempt (fallback for old flow)
        attempt = await prisma.examAttempt.create({
          data: {
            userId: user.id,
            examId: exam.id,
            score,
            passed,
            answers: body.answers,
            completedAt: now,
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent,
          },
        });
      }

      await logAudit({
        userId: user.id,
        action: 'EXAM_SUBMIT',
        entity: 'examAttempt',
        entityId: attempt.id,
        details: {
          examId: exam.id,
          examName: exam.name,
          score,
          passed,
          tabSwitchCount: attempt.tabSwitchCount,
          flagged: attempt.flagged,
        },
        ...clientInfo,
      });

      return {
        attemptId: attempt.id,
        score,
        passed,
        correctAnswers,
        totalQuestions,
        passingScore: exam.passingScore,
        flagged: attempt.flagged,
      };
    },
    {
      body: t.Object({
        answers: t.Record(t.String(), t.Any()),
      }),
    }
  )

  // Get user's exam attempts
  .get('/attempts/my', async (context: any) => {
    const { headers, jwt, query } = context;
    // Manual auth check
    const auth = headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = auth.slice(7);
    const payload = await jwt.verify(token);

    if (!payload) {
      throw new Error('Invalid token');
    }

    const user = payload as { id: string; email: string; role: string };

    const whereClause: any = { userId: user.id };
    if (query?.mode && (query.mode === 'EXAM' || query.mode === 'PRACTICE')) {
      whereClause.mode = query.mode;
    }

    return await prisma.examAttempt.findMany({
      where: whereClause,
      include: {
        exam: {
          include: {
            certification: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  })

  // Get specific attempt details
  .get('/attempts/:id', async (context: any) => {
    const { params, headers, jwt } = context;
    // Manual auth check
    const auth = headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = auth.slice(7);
    const payload = await jwt.verify(token);

    if (!payload) {
      throw new Error('Invalid token');
    }

    const user = payload as { id: string; email: string; role: string };

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: params.id },
      include: {
        exam: {
          include: {
            certification: true,
            questions: {
              include: {
                question: {
                  include: {
                    answers: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new Error('Attempt not found');
    }

    if (attempt.userId !== user.id) {
      throw new Error('Unauthorized');
    }

    return attempt;
  })

  // Delete exam attempt
  .delete('/attempts/:id', async (context: any) => {
    const { params, headers, jwt } = context;
    const auth = headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = auth.slice(7);
    const payload = await jwt.verify(token);

    if (!payload) {
      throw new Error('Invalid token');
    }

    const user = payload as { id: string; email: string; role: string };

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: params.id },
    });

    if (!attempt) {
      throw new Error('Attempt not found');
    }

    if (attempt.userId !== user.id) {
      throw new Error('Unauthorized');
    }

    await prisma.examAttempt.delete({
      where: { id: params.id },
    });

    return { success: true, message: 'Exam attempt deleted' };
  });
