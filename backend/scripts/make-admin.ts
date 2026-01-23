import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  const email = process.argv[2] || 'admin@test.com';

  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });

  console.log(`✅ User ${user.email} is now an ADMIN`);
  await prisma.$disconnect();
}

makeAdmin().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
