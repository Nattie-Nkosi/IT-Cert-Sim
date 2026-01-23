import { Elysia } from 'elysia';
import { prisma } from '../lib/prisma';

export const certificationRoutes = new Elysia({ prefix: '/api/certifications' })
  // Get all certifications
  .get('/', async () => {
    return await prisma.certification.findMany({
      include: {
        _count: {
          select: {
            questions: true,
            exams: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  })

  // Get single certification
  .get('/:id', async ({ params }) => {
    const certification = await prisma.certification.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
        exams: true,
      },
    });

    if (!certification) {
      throw new Error('Certification not found');
    }

    return certification;
  });
