const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCompanies() {
  try {
    console.log('Testing company query...');
    const companies = await prisma.company.findMany({
      take: 5,
      include: {
        _count: {
          select: {
            users: true,
            bookings: true,
          },
        },
      },
    });
    console.log(`Found ${companies.length} companies`);
    companies.forEach(c => console.log(`- ${c.name}: ${c._count.users} users, ${c._count.bookings} bookings`));
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testCompanies();
