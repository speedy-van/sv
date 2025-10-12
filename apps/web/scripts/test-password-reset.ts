import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function testPasswordReset() {
  console.log('🧪 Testing password reset functionality...\n');

  try {
    // 1. Create a test user
    console.log('1. Creating test user...');
    const testEmail = 'test-password-reset@example.com';
    const testPassword = 'TestPassword123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Delete existing test user if exists
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test User',
        password: hashedPassword,
        role: 'customer',
      },
    });

    console.log(`✅ Test user created: ${user.email} (ID: ${user.id})\n`);

    // 2. Test forgot password (generate reset token)
    console.log('2. Testing forgot password...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    console.log(
      `✅ Reset token generated: ${resetToken.substring(0, 16)}...\n`
    );

    // 3. Test reset password
    console.log('3. Testing password reset...');
    const newPassword = 'NewPassword123';
    const newHashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: {
        id: user.id,
        resetToken: resetToken,
        resetTokenExpiry: { gt: new Date() },
      },
      data: {
        password: newHashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log('✅ Password reset successful\n');

    // 4. Verify the password was changed
    console.log('4. Verifying password change...');
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!updatedUser) {
      throw new Error('User not found after password reset');
    }

    const oldPasswordValid = await bcrypt.compare(
      testPassword,
      updatedUser.password
    );
    const newPasswordValid = await bcrypt.compare(
      newPassword,
      updatedUser.password
    );

    if (oldPasswordValid) {
      throw new Error('Old password still works after reset');
    }

    if (!newPasswordValid) {
      throw new Error('New password does not work after reset');
    }

    if (updatedUser.resetToken || updatedUser.resetTokenExpiry) {
      throw new Error('Reset token was not cleared after reset');
    }

    console.log('✅ Password verification successful\n');

    // 5. Test expired token
    console.log('5. Testing expired token...');
    const expiredToken = crypto.randomBytes(32).toString('hex');
    const expiredTokenExpiry = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: expiredToken,
        resetTokenExpiry: expiredTokenExpiry,
      },
    });

    const expiredUser = await prisma.user.findFirst({
      where: {
        resetToken: expiredToken,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (expiredUser) {
      throw new Error('Expired token should not be found');
    }

    console.log('✅ Expired token test successful\n');

    // 6. Clean up
    console.log('6. Cleaning up...');
    await prisma.user.delete({
      where: { id: user.id },
    });

    console.log('✅ Test user deleted\n');

    console.log('🎉 All password reset tests passed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ User creation with hashed password');
    console.log('- ✅ Reset token generation and storage');
    console.log('- ✅ Password reset with token validation');
    console.log('- ✅ Password verification after reset');
    console.log('- ✅ Reset token cleanup after reset');
    console.log('- ✅ Expired token handling');
    console.log('- ✅ Database cleanup');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPasswordReset();
