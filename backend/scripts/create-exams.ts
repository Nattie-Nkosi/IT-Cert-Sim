import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createExams() {
  // Get all certifications
  const certs = await prisma.certification.findMany({
    include: {
      questions: {
        select: { id: true },
      },
    },
  });

  console.log(`Found ${certs.length} certifications\n`);

  for (const cert of certs) {
    if (cert.questions.length === 0) {
      console.log(`⚠️  Skipping ${cert.name} - no questions found`);
      continue;
    }

    // Create an exam with all questions from this certification
    const exam = await prisma.exam.create({
      data: {
        name: `${cert.name} Practice Exam`,
        description: `Comprehensive practice exam covering all topics in ${cert.name}`,
        duration: 90, // 90 minutes
        passingScore: 70, // 70%
        certificationId: cert.id,
        questions: {
          create: cert.questions.map((q, index) => ({
            questionId: q.id,
            order: index,
          })),
        },
      },
    });

    console.log(`✅ Created exam: ${exam.name}`);
    console.log(`   - Duration: ${exam.duration} minutes`);
    console.log(`   - Questions: ${cert.questions.length}`);
    console.log(`   - Passing Score: ${exam.passingScore}%\n`);
  }

  console.log('✨ All exams created successfully!');
  await prisma.$disconnect();
}

createExams().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
