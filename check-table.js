import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkTable() {
  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'AILearningPattern'
      );
    `;
    console.log('AILearningPattern table exists:', result[0].exists);
    
    if (!result[0].exists) {
      console.log('\nCreating AILearningPattern table...');
      
      await prisma.$executeRaw`
        CREATE TABLE "AILearningPattern" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "pattern" TEXT NOT NULL,
          "action" TEXT NOT NULL,
          "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "occurrences" INTEGER NOT NULL DEFAULT 1,
          "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `;
      
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX "AILearningPattern_pattern_action_key" ON "AILearningPattern"("pattern", "action")
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX "AILearningPattern_lastSeen_idx" ON "AILearningPattern"("lastSeen")
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX "AILearningPattern_successRate_idx" ON "AILearningPattern"("successRate")
      `;
      
      console.log('✅ AILearningPattern table created successfully!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTable();
