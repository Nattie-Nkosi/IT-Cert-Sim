import { Elysia, t } from 'elysia';
import { adminMiddleware } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const adminRoutes = new Elysia({ prefix: '/api/admin' })
  .use(adminMiddleware)

  // Create certification
  .post(
    '/certifications',
    async ({ body }) => {
      return await prisma.certification.create({
        data: body,
      });
    },
    {
      body: t.Object({
        name: t.String(),
        code: t.String(),
        description: t.Optional(t.String()),
        vendor: t.String(),
      }),
    }
  )

  // Create question with answers
  .post(
    '/questions',
    async ({ body }) => {
      const { answers, ...questionData } = body;

      return await prisma.question.create({
        data: {
          ...questionData,
          answers: {
            create: answers,
          },
        },
        include: {
          answers: true,
        },
      });
    },
    {
      body: t.Object({
        questionText: t.String(),
        questionType: t.Union([
          t.Literal('SINGLE_CHOICE'),
          t.Literal('MULTIPLE_CHOICE'),
          t.Literal('TRUE_FALSE'),
        ]),
        explanation: t.Optional(t.String()),
        certificationId: t.String(),
        difficulty: t.Optional(
          t.Union([
            t.Literal('EASY'),
            t.Literal('MEDIUM'),
            t.Literal('HARD'),
          ])
        ),
        answers: t.Array(
          t.Object({
            answerText: t.String(),
            isCorrect: t.Boolean(),
          })
        ),
      }),
    }
  )

  // Bulk upload questions
  .post(
    '/questions/bulk',
    async ({ body }) => {
      const results = [];

      for (const questionData of body.questions) {
        const { answers, ...question } = questionData;

        const created = await prisma.question.create({
          data: {
            ...question,
            answers: {
              create: answers,
            },
          },
          include: {
            answers: true,
          },
        });

        results.push(created);
      }

      return { count: results.length, questions: results };
    },
    {
      body: t.Object({
        questions: t.Array(
          t.Object({
            questionText: t.String(),
            questionType: t.Union([
              t.Literal('SINGLE_CHOICE'),
              t.Literal('MULTIPLE_CHOICE'),
              t.Literal('TRUE_FALSE'),
            ]),
            explanation: t.Optional(t.String()),
            certificationId: t.String(),
            difficulty: t.Optional(
              t.Union([
                t.Literal('EASY'),
                t.Literal('MEDIUM'),
                t.Literal('HARD'),
              ])
            ),
            answers: t.Array(
              t.Object({
                answerText: t.String(),
                isCorrect: t.Boolean(),
              })
            ),
          })
        ),
      }),
    }
  )

  // Create exam
  .post(
    '/exams',
    async ({ body }) => {
      const { questionIds, ...examData } = body;

      const exam = await prisma.exam.create({
        data: {
          ...examData,
          questions: {
            create: questionIds.map((questionId: string, index: number) => ({
              questionId,
              order: index,
            })),
          },
        },
        include: {
          questions: {
            include: {
              question: true,
            },
          },
        },
      });

      return exam;
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        duration: t.Number(),
        passingScore: t.Number(),
        certificationId: t.String(),
        questionIds: t.Array(t.String()),
      }),
    }
  );
