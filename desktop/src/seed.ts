import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding desktop database...');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('Created admin user:', admin.email);

  const comptiaAPlus = await prisma.certification.upsert({
    where: { code: 'A+' },
    update: {},
    create: {
      name: 'CompTIA A+',
      code: 'A+',
      description: 'Entry-level IT certification covering hardware, software, and troubleshooting.',
      vendor: 'CompTIA',
    },
  });

  const comptiaNetworkPlus = await prisma.certification.upsert({
    where: { code: 'Network+' },
    update: {},
    create: {
      name: 'CompTIA Network+',
      code: 'Network+',
      description: 'Networking certification covering design, configuration, and troubleshooting.',
      vendor: 'CompTIA',
    },
  });

  const comptiaSecurityPlus = await prisma.certification.upsert({
    where: { code: 'Security+' },
    update: {},
    create: {
      name: 'CompTIA Security+',
      code: 'Security+',
      description: 'Security certification covering cybersecurity concepts and best practices.',
      vendor: 'CompTIA',
    },
  });

  console.log('Created certifications:', comptiaAPlus.name, comptiaNetworkPlus.name, comptiaSecurityPlus.name);

  const sampleQuestions = [
    {
      questionText: 'Which of the following is used to connect a computer to a wired network?',
      questionType: 'SINGLE_CHOICE' as const,
      explanation: 'An Ethernet cable (RJ-45) is used to connect devices to a wired network.',
      certificationId: comptiaAPlus.id,
      difficulty: 'EASY' as const,
      answers: [
        { answerText: 'USB cable', isCorrect: false },
        { answerText: 'Ethernet cable', isCorrect: true },
        { answerText: 'HDMI cable', isCorrect: false },
        { answerText: 'Power cable', isCorrect: false },
      ],
    },
    {
      questionText: 'What is the purpose of RAM in a computer system?',
      questionType: 'SINGLE_CHOICE' as const,
      explanation: 'RAM (Random Access Memory) provides temporary storage for running programs and data.',
      certificationId: comptiaAPlus.id,
      difficulty: 'EASY' as const,
      answers: [
        { answerText: 'Long-term data storage', isCorrect: false },
        { answerText: 'Temporary storage for active programs', isCorrect: true },
        { answerText: 'Processing calculations', isCorrect: false },
        { answerText: 'Providing power to components', isCorrect: false },
      ],
    },
    {
      questionText: 'Which protocol is used to securely transfer files over a network?',
      questionType: 'SINGLE_CHOICE' as const,
      explanation: 'SFTP (SSH File Transfer Protocol) provides encrypted file transfers.',
      certificationId: comptiaNetworkPlus.id,
      difficulty: 'MEDIUM' as const,
      answers: [
        { answerText: 'FTP', isCorrect: false },
        { answerText: 'HTTP', isCorrect: false },
        { answerText: 'SFTP', isCorrect: true },
        { answerText: 'Telnet', isCorrect: false },
      ],
    },
    {
      questionText: 'What is the default port for HTTPS?',
      questionType: 'SINGLE_CHOICE' as const,
      explanation: 'HTTPS uses port 443 by default for encrypted web traffic.',
      certificationId: comptiaNetworkPlus.id,
      difficulty: 'EASY' as const,
      answers: [
        { answerText: '80', isCorrect: false },
        { answerText: '443', isCorrect: true },
        { answerText: '22', isCorrect: false },
        { answerText: '21', isCorrect: false },
      ],
    },
    {
      questionText: 'Which type of attack involves intercepting communication between two parties?',
      questionType: 'SINGLE_CHOICE' as const,
      explanation: 'A Man-in-the-Middle (MITM) attack intercepts communication between two parties.',
      certificationId: comptiaSecurityPlus.id,
      difficulty: 'MEDIUM' as const,
      answers: [
        { answerText: 'Phishing', isCorrect: false },
        { answerText: 'Man-in-the-Middle', isCorrect: true },
        { answerText: 'Denial of Service', isCorrect: false },
        { answerText: 'SQL Injection', isCorrect: false },
      ],
    },
  ];

  for (const q of sampleQuestions) {
    const { answers, ...questionData } = q;
    await prisma.question.create({
      data: {
        ...questionData,
        answers: {
          create: answers,
        },
      },
    });
  }
  console.log('Created sample questions');

  const aPlusQuestions = await prisma.question.findMany({
    where: { certificationId: comptiaAPlus.id },
  });

  const networkPlusQuestions = await prisma.question.findMany({
    where: { certificationId: comptiaNetworkPlus.id },
  });

  const securityPlusQuestions = await prisma.question.findMany({
    where: { certificationId: comptiaSecurityPlus.id },
  });

  if (aPlusQuestions.length > 0) {
    await prisma.exam.create({
      data: {
        name: 'CompTIA A+ Practice Exam',
        description: 'Practice exam for CompTIA A+ certification',
        duration: 30,
        passingScore: 70,
        certificationId: comptiaAPlus.id,
        questions: {
          create: aPlusQuestions.map((q, i) => ({
            questionId: q.id,
            order: i,
          })),
        },
      },
    });
  }

  if (networkPlusQuestions.length > 0) {
    await prisma.exam.create({
      data: {
        name: 'CompTIA Network+ Practice Exam',
        description: 'Practice exam for CompTIA Network+ certification',
        duration: 30,
        passingScore: 70,
        certificationId: comptiaNetworkPlus.id,
        questions: {
          create: networkPlusQuestions.map((q, i) => ({
            questionId: q.id,
            order: i,
          })),
        },
      },
    });
  }

  if (securityPlusQuestions.length > 0) {
    await prisma.exam.create({
      data: {
        name: 'CompTIA Security+ Practice Exam',
        description: 'Practice exam for CompTIA Security+ certification',
        duration: 30,
        passingScore: 70,
        certificationId: comptiaSecurityPlus.id,
        questions: {
          create: securityPlusQuestions.map((q, i) => ({
            questionId: q.id,
            order: i,
          })),
        },
      },
    });
  }

  console.log('Created sample exams');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
