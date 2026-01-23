import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { prisma } from '../lib/prisma';

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
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    // Filter out any exam questions where the question was deleted
    const validQuestions = exam.questions.filter((eq: any) => eq.question !== null);

    return {
      ...exam,
      questions: validQuestions,
    };
  })

  // Submit exam attempt (protected)
  .post(
    '/:id/submit',
    async (context: any) => {
      const { params, body, headers, jwt } = context;
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

      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = exam.questions.length;

      exam.questions.forEach((examQuestion) => {
        const userAnswer = body.answers[examQuestion.questionId];
        const correctAnswerIds = examQuestion.question.answers
          .filter((a) => a.isCorrect)
          .map((a) => a.id);

        // Check if user answer matches correct answers
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

      // Create exam attempt
      const attempt = await prisma.examAttempt.create({
        data: {
          userId: user.id,
          examId: exam.id,
          score,
          passed,
          answers: body.answers,
          completedAt: new Date(),
        },
      });

      return {
        attemptId: attempt.id,
        score,
        passed,
        correctAnswers,
        totalQuestions,
        passingScore: exam.passingScore,
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
    const { headers, jwt } = context;
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

    return await prisma.examAttempt.findMany({
      where: { userId: user.id },
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
  });
