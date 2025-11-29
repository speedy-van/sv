import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDriver() {
  try {
    console.log('🔍 Checking for driver with email: sami.justeat@gmail.com');
    
    const user = await prisma.user.findUnique({
      where: { email: 'sami.justeat@gmail.com' },
      include: { driver: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
      driver: user.driver ? {
        id: user.driver.id,
        status: user.driver.status,
        onboardingStatus: user.driver.onboardingStatus,
        approvedAt: user.driver.approvedAt
      } : null
    });
    
    // Test password
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.compare('Aa234311Aa@@@', user.password);
    console.log('\n🔐 Password test:', isValidPassword ? '✅ Valid' : '❌ Invalid');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDriver();
