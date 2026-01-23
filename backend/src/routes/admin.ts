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
  )

  // Parse PDF and extract questions
  .post(
    '/questions/parse-pdf',
    async ({ body }) => {
      try {
        const pdfParse = require('pdf-parse');
        const buffer = Buffer.from(await body.file.arrayBuffer());
        const data = await pdfParse(buffer);
        const text = data.text;

        const questions = [];
        const questionRegex = /Question:\s*(\d+)\s*([\s\S]*?)(?=Question:\s*\d+|$)/g;

        let match;
        while ((match = questionRegex.exec(text)) !== null) {
          const questionNumber = match[1];
          const questionBlock = match[2].trim();

          const answerMatch = questionBlock.match(/Answer:\s*([A-D])/i);
          const explanationMatch = questionBlock.match(/Explanation:\s*([\s\S]+?)$/i);

          const lines = questionBlock.split('\n').filter(line => line.trim());

          const questionTextLines = [];
          const options: { letter: string; text: string }[] = [];
          let foundOptions = false;

          for (const line of lines) {
            const optionMatch = line.match(/^([A-D])\.\s*(.+)$/);
            if (optionMatch) {
              foundOptions = true;
              options.push({ letter: optionMatch[1], text: optionMatch[2].trim() });
            } else if (!foundOptions && !line.startsWith('Answer:') && !line.startsWith('Explanation:')) {
              questionTextLines.push(line.trim());
            } else if (line.startsWith('Answer:') || line.startsWith('Explanation:')) {
              break;
            }
          }

          if (questionTextLines.length > 0 && options.length >= 2 && answerMatch) {
            const correctAnswer = answerMatch[1].toUpperCase();

            questions.push({
              questionNumber: parseInt(questionNumber),
              questionText: questionTextLines.join(' ').trim(),
              questionType: 'SINGLE_CHOICE',
              explanation: explanationMatch ? explanationMatch[1].trim() : null,
              difficulty: 'MEDIUM',
              answers: options.map(opt => ({
                answerText: opt.text,
                isCorrect: opt.letter === correctAnswer,
              })),
            });
          }
        }

        return { count: questions.length, questions };
      } catch (error: any) {
        throw new Error('Failed to parse PDF: ' + error.message);
      }
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    }
  )

  // Get all questions with optional certification filter
  .get('/questions', async ({ query }) => {
    const where = query.certificationId
      ? { certificationId: query.certificationId }
      : {};

    return await prisma.question.findMany({
      where,
      include: {
        answers: true,
        certification: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  })

  // Update question
  .put(
    '/questions/:id',
    async ({ params, body }) => {
      const { answers, ...questionData } = body;

      await prisma.answer.deleteMany({
        where: { questionId: params.id },
      });

      return await prisma.question.update({
        where: { id: params.id },
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

  // Delete question
  .delete('/questions/:id', async ({ params }) => {
    await prisma.question.delete({
      where: { id: params.id },
    });
    return { success: true };
  });
