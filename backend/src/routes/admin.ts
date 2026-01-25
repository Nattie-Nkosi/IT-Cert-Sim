import { Elysia, t } from 'elysia';
import { adminMiddleware } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const adminRoutes = new Elysia({ prefix: '/api/admin' })
  .onError(({ code, error, set }) => {
    console.error('Admin route error:', code, error);
    set.status = code === 'VALIDATION' ? 400 : 500;
    return {
      error: error instanceof Error ? error.message : String(error),
      code: code,
    };
  })
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
    async ({ body, set }) => {
      try {
        const { answers, ...questionData } = body;

        const question = await prisma.question.create({
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

        // Auto-add question to all existing exams for this certification
        const exams = await prisma.exam.findMany({
          where: { certificationId: questionData.certificationId },
          include: { questions: { orderBy: { order: 'desc' }, take: 1 } },
        });

        if (exams.length > 0) {
          await prisma.examQuestion.createMany({
            data: exams.map((exam) => ({
              examId: exam.id,
              questionId: question.id,
              order: (exam.questions[0]?.order ?? -1) + 1,
            })),
          });
        }

        return question;
      } catch (error: any) {
        console.error('Error creating question:', error);
        set.status = 500;
        return { error: error.message, details: error };
      }
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
      const certificationIds = new Set<string>();

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
        certificationIds.add(question.certificationId);
      }

      // Auto-add all new questions to existing exams for their certifications
      for (const certificationId of certificationIds) {
        const exams = await prisma.exam.findMany({
          where: { certificationId },
          include: { questions: { orderBy: { order: 'desc' }, take: 1 } },
        });

        const questionsForCert = results.filter(
          (q) => q.certificationId === certificationId
        );

        for (const exam of exams) {
          let nextOrder = (exam.questions[0]?.order ?? -1) + 1;
          await prisma.examQuestion.createMany({
            data: questionsForCert.map((q) => ({
              examId: exam.id,
              questionId: q.id,
              order: nextOrder++,
            })),
          });
        }
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
    async ({ body, set }) => {
      try {
        const pdfParse = require('pdf-parse');

        // Get the file from the body
        const file = body.file;

        if (!file) {
          set.status = 400;
          return { error: 'No file provided' };
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse PDF
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
        set.status = 500;
        return { error: 'Failed to parse PDF: ' + error.message };
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
  })

  // Get exam details for editing
  .get('/exams/:id', async ({ params }) => {
    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: {
        certification: true,
        questions: {
          include: {
            question: true,
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

    return exam as typeof exam & {
      questions: Array<{
        id: string;
        questionId: string;
        question: any;
      }>;
    };
  })

  // Update exam questions
  .put(
    '/exams/:id/questions',
    async ({ params, body }) => {
      // Delete all existing exam questions
      await prisma.examQuestion.deleteMany({
        where: { examId: params.id },
      });

      // Create new exam questions
      await prisma.examQuestion.createMany({
        data: body.questionIds.map((questionId: string, index: number) => ({
          examId: params.id,
          questionId,
          order: index,
        })),
      });

      return { success: true };
    },
    {
      body: t.Object({
        questionIds: t.Array(t.String()),
      }),
    }
  )

  // Get all exams (for admin)
  .get('/exams', async () => {
    return await prisma.exam.findMany({
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
  });
