import { Elysia } from 'elysia';
import { prisma } from '../lib/prisma';

export const questionRoutes = new Elysia({ prefix: '/api/questions' })
  .get('/certification/:certificationId', async ({ params }) => {
    return await prisma.question.findMany({
      where: {
        certificationId: params.certificationId,
      },
      include: {
        answers: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  })

  .get('/:id', async ({ params }) => {
    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        answers: true,
        certification: true,
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    return question;
  });
