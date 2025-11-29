import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUserQuery() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'sami.justeat@gmail.com' },
      include: { driver: true }
    });
    
    console.log('✅ User query successful!');
    console.log(JSON.stringify({ email: user?.email, role: user?.role, hasDriver: !!user?.driver }, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUserQuery();
