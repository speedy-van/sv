const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSystemUser() {
  try {
    // Check if system user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: 'system@speedy-van.co.uk',
      },
    });

    if (existingUser) {
      console.log('System user already exists');
      return existingUser;
    }

    // Create a secure password hash
    const passwordHash = await bcrypt.hash(
      'system_user_secure_password_2024',
      12
    );

    // Create the system user
    const systemUser = await prisma.user.create({
      data: {
        email: 'system@speedy-van.co.uk',
        name: 'System',
        password: passwordHash,
        role: 'admin',
        isActive: true,
        emailVerified: true,
      },
    });

    console.log('System user created successfully:', systemUser.id);
    return systemUser;
  } catch (error) {
    console.error('Error creating system user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSystemUser()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
