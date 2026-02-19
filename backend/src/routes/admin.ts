import { Elysia, t } from 'elysia';
import { adminMiddleware } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { uploadImageToCloudinary } from '../lib/cloudinary';

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

  // Delete certification
  .delete('/certifications/:id', async ({ params, set }) => {
    try {
      await prisma.certification.delete({
        where: { id: params.id },
      });
      return { success: true };
    } catch (error: any) {
      set.status = 400;
      return { error: 'Failed to delete certification. It may have associated data.' };
    }
  })

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

        console.log('Auto-adding question to', exams.length, 'existing exams');

        if (exams.length > 0) {
          const result = await prisma.examQuestion.createMany({
            data: exams.map((exam) => ({
              examId: exam.id,
              questionId: question.id,
              order: (exam.questions[0]?.order ?? -1) + 1,
            })),
          });
          console.log('Added question to', result.count, 'exams');
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
        imageUrl: t.Optional(t.String()),
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

  // Upload image for a question
  .post(
    '/questions/upload-image',
    async ({ body, set }) => {
      try {
        const arrayBuffer = await body.image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const imageUrl = await uploadImageToCloudinary(buffer);
        return { imageUrl };
      } catch (error: any) {
        set.status = 500;
        return { error: 'Failed to upload image: ' + error.message };
      }
    },
    {
      body: t.Object({
        image: t.File(),
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
    async ({ body, set }) => {
      const { questionIds, ...examData } = body;

      console.log('Creating exam with data:', examData);
      console.log('Question IDs to add:', questionIds);

      try {
        // Verify all question IDs exist
        const existingQuestions = await prisma.question.findMany({
          where: { id: { in: questionIds } },
          select: { id: true },
        });

        console.log('Found', existingQuestions.length, 'valid questions out of', questionIds.length);

        if (existingQuestions.length !== questionIds.length) {
          const foundIds = existingQuestions.map(q => q.id);
          const missingIds = questionIds.filter((id: string) => !foundIds.includes(id));
          console.error('Missing question IDs:', missingIds);
          set.status = 400;
          return { error: 'Some question IDs are invalid', missingIds };
        }

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
            certification: true,
            questions: {
              include: {
                question: true,
              },
            },
            _count: {
              select: { questions: true },
            },
          },
        });

        console.log('Created exam:', exam.id, 'with', exam.questions.length, 'questions');
        console.log('Exam _count.questions:', exam._count.questions);

        return exam;
      } catch (error: any) {
        console.error('Error creating exam:', error);
        set.status = 500;
        return { error: error.message };
      }
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
        imageUrl: t.Optional(t.String()),
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
      console.log('Updating exam questions for exam:', params.id);
      console.log('New question IDs:', body.questionIds);

      // Delete all existing exam questions
      const deleted = await prisma.examQuestion.deleteMany({
        where: { examId: params.id },
      });
      console.log('Deleted', deleted.count, 'existing exam questions');

      // Create new exam questions
      const created = await prisma.examQuestion.createMany({
        data: body.questionIds.map((questionId: string, index: number) => ({
          examId: params.id,
          questionId,
          order: index,
        })),
      });
      console.log('Created', created.count, 'new exam questions');

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
  })

  // Get audit logs
  .get('/audit-logs', async ({ query }) => {
    const page = parseInt(query.page || '1');
    const limit = Math.min(parseInt(query.limit || '50'), 100);
    const action = query.action;

    const where = action ? { action } : {};

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  })

  // Get flagged exam attempts
  .get('/flagged-attempts', async () => {
    return await prisma.examAttempt.findMany({
      where: { flagged: true },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        exam: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  })

  // Sync all certification questions to exam
  .post('/exams/:id/sync-questions', async ({ params }) => {
    const exam = await prisma.exam.findUnique({
      where: { id: params.id },
      include: { questions: true },
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    // Get all questions for this certification
    const allQuestions = await prisma.question.findMany({
      where: { certificationId: exam.certificationId },
      select: { id: true },
    });

    // Get existing question IDs in exam
    const existingQuestionIds = new Set(exam.questions.map(eq => eq.questionId));

    // Find questions not yet in exam
    const newQuestions = allQuestions.filter(q => !existingQuestionIds.has(q.id));

    if (newQuestions.length === 0) {
      return { message: 'All questions already in exam', added: 0 };
    }

    // Get highest order
    const maxOrder = exam.questions.reduce((max, eq) => Math.max(max, eq.order), -1);

    // Add missing questions
    await prisma.examQuestion.createMany({
      data: newQuestions.map((q, index) => ({
        examId: exam.id,
        questionId: q.id,
        order: maxOrder + 1 + index,
      })),
    });

    return { message: `Added ${newQuestions.length} questions to exam`, added: newQuestions.length };
  });
