import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function testAuthFeatures() {
  console.log('🧪 Testing authentication features...\n');

  try {
    // Test 1: Password Reset Flow
    console.log('📋 Test 1: Password Reset Flow');
    console.log('================================');

    // Create test user for password reset
    const resetTestEmail = 'test-reset@example.com';
    const resetTestPassword = 'TestPassword123';
    const hashedPassword = await bcrypt.hash(resetTestPassword, 12);

    // Clean up existing test user
    await prisma.user.deleteMany({
      where: { email: resetTestEmail },
    });

    const resetUser = await prisma.user.create({
      data: {
        email: resetTestEmail,
        name: 'Reset Test User',
        password: hashedPassword,
        role: 'customer',
      },
    });

    console.log(`✅ Created test user: ${resetUser.email}`);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: resetUser.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    console.log(`✅ Generated reset token: ${resetToken.substring(0, 16)}...`);

    // Test password reset
    const newPassword = 'NewPassword123';
    const newHashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: {
        id: resetUser.id,
        resetToken: resetToken,
        resetTokenExpiry: { gt: new Date() },
      },
      data: {
        password: newHashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log('✅ Password reset successful');

    // Verify password change
    const updatedResetUser = await prisma.user.findUnique({
      where: { id: resetUser.id },
    });

    if (!updatedResetUser) throw new Error('User not found after reset');

    const oldPasswordValid = await bcrypt.compare(
      resetTestPassword,
      updatedResetUser.password
    );
    const newPasswordValid = await bcrypt.compare(
      newPassword,
      updatedResetUser.password
    );

    if (oldPasswordValid) throw new Error('Old password still works');
    if (!newPasswordValid) throw new Error('New password does not work');
    if (updatedResetUser.resetToken || updatedResetUser.resetTokenExpiry) {
      throw new Error('Reset token not cleared');
    }

    console.log('✅ Password verification successful\n');

    // Test 2: Email Verification Flow
    console.log('📋 Test 2: Email Verification Flow');
    console.log('==================================');

    // Create test user for email verification
    const verifyTestEmail = 'test-verify@example.com';

    // Clean up existing test user
    await prisma.user.deleteMany({
      where: { email: verifyTestEmail },
    });

    const verifyUser = await prisma.user.create({
      data: {
        email: verifyTestEmail,
        name: 'Verify Test User',
        password: await bcrypt.hash('TestPassword123', 12),
        role: 'customer',
        emailVerified: false,
      },
    });

    console.log(`✅ Created test user: ${verifyUser.email} (unverified)`);

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: verifyUser.id },
      data: {
        emailVerificationToken: verifyToken,
        emailVerificationExpiry: verifyTokenExpiry,
      },
    });

    console.log(
      `✅ Generated verification token: ${verifyToken.substring(0, 16)}...`
    );

    // Test email verification
    await prisma.user.update({
      where: {
        id: verifyUser.id,
        emailVerificationToken: verifyToken,
        emailVerificationExpiry: { gt: new Date() },
      },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    console.log('✅ Email verification successful');

    // Verify email verification
    const updatedVerifyUser = await prisma.user.findUnique({
      where: { id: verifyUser.id },
    });

    if (!updatedVerifyUser)
      throw new Error('User not found after verification');

    if (!updatedVerifyUser.emailVerified)
      throw new Error('Email not marked as verified');
    if (
      updatedVerifyUser.emailVerificationToken ||
      updatedVerifyUser.emailVerificationExpiry
    ) {
      throw new Error('Verification token not cleared');
    }

    console.log('✅ Email verification verification successful\n');

    // Test 3: Expired Token Handling
    console.log('📋 Test 3: Expired Token Handling');
    console.log('=================================');

    // Test expired reset token
    const expiredResetToken = crypto.randomBytes(32).toString('hex');
    const expiredResetExpiry = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    await prisma.user.update({
      where: { id: resetUser.id },
      data: {
        resetToken: expiredResetToken,
        resetTokenExpiry: expiredResetExpiry,
      },
    });

    const expiredResetUser = await prisma.user.findFirst({
      where: {
        resetToken: expiredResetToken,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (expiredResetUser)
      throw new Error('Expired reset token should not be found');
    console.log('✅ Expired reset token handling successful');

    // Test expired verification token
    const expiredVerifyToken = crypto.randomBytes(32).toString('hex');
    const expiredVerifyExpiry = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    await prisma.user.update({
      where: { id: verifyUser.id },
      data: {
        emailVerificationToken: expiredVerifyToken,
        emailVerificationExpiry: expiredVerifyExpiry,
      },
    });

    const expiredVerifyUser = await prisma.user.findFirst({
      where: {
        emailVerificationToken: expiredVerifyToken,
        emailVerificationExpiry: { gt: new Date() },
      },
    });

    if (expiredVerifyUser)
      throw new Error('Expired verification token should not be found');
    console.log('✅ Expired verification token handling successful\n');

    // Test 4: Security Tests
    console.log('📋 Test 4: Security Tests');
    console.log('==========================');

    // Test invalid token
    const invalidToken = 'invalid-token';
    const invalidUser = await prisma.user.findFirst({
      where: {
        resetToken: invalidToken,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (invalidUser) throw new Error('Invalid token should not be found');
    console.log('✅ Invalid token handling successful');

    // Test case sensitivity
    const caseSensitiveUser = await prisma.user.findFirst({
      where: {
        resetToken: resetToken.toUpperCase(),
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (caseSensitiveUser)
      throw new Error('Case-sensitive token should not be found');
    console.log('✅ Token case sensitivity handling successful\n');

    // Clean up
    console.log('🧹 Cleaning up test data...');
    await prisma.user.deleteMany({
      where: {
        email: { in: [resetTestEmail, verifyTestEmail] },
      },
    });
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 All authentication feature tests passed!');
    console.log('\n📋 Test Summary:');
    console.log(
      '- ✅ Password reset flow (token generation, password change, token cleanup)'
    );
    console.log(
      '- ✅ Email verification flow (token generation, verification, token cleanup)'
    );
    console.log('- ✅ Expired token handling (reset and verification tokens)');
    console.log('- ✅ Security tests (invalid tokens, case sensitivity)');
    console.log('- ✅ Database cleanup');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuthFeatures();
