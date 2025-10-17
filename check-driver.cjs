const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDriver() {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: 'cmg6jiicx0029pq28g8d6ldju' },
      select: {
        id: true,
        status: true,
        User: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (driver) {
      console.log('Driver found:', driver);
    } else {
      console.log('Driver not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDriver();