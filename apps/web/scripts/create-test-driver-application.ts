import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestDriverApplication() {
  try {
    console.log('Creating test driver application...');

    // Create a test driver application
    const application = await prisma.driverApplication.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe.test@example.com',
        phone: '+447700900000',
        dateOfBirth: new Date('1990-01-01'),
        addressLine1: '123 Test Street',
        addressLine2: 'Test Area',
        city: 'London',
        postcode: 'SW1A 1AA',
        county: 'Greater London',
        nationalInsuranceNumber: 'AB123456C',
        drivingLicenseNumber: 'TEST123456789',
        drivingLicenseExpiry: new Date('2030-01-01'),
        drivingLicenseFrontImage: null,
        drivingLicenseBackImage: null,
        insuranceProvider: 'Test Insurance',
        insurancePolicyNumber: 'TEST123456',
        insuranceExpiry: new Date('2030-01-01'),
        insuranceDocument: null,
        bankName: 'Test Bank',
        accountHolderName: 'John Doe',
        sortCode: '123456',
        accountNumber: '12345678',
        rightToWorkShareCode: 'TEST123456',
        rightToWorkDocument: null,
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '+447700900001',
        emergencyContactRelationship: 'Spouse',
        agreeToTerms: true,
        agreeToDataProcessing: true,
        agreeToBackgroundCheck: true,
        status: 'pending',
      },
    });

    console.log('Test driver application created successfully:');
    console.log('ID:', application.id);
    console.log('Email:', application.email);
    console.log('Status:', application.status);
    console.log('Created At:', 'N/A'); // createdAt not available

    // Create a test user account for this application
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john.doe.test@example.com',
        password: '$2a$12$test.hash.for.testing.purposes.only',
        role: 'driver',
        isActive: false,
      },
    });

    // Link the application to the user
    await prisma.driverApplication.update({
      where: { id: application.id },
      data: { userId: user.id },
    });

    console.log('Test user created and linked:');
    console.log('User ID:', user.id);
    console.log('User Role:', user.role);
    console.log('User Active:', user.isActive);

    console.log('\nTest driver application setup complete!');
    console.log(
      'You can now test the admin dashboard at /admin/drivers/applications'
    );
  } catch (error) {
    console.error('Error creating test driver application:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDriverApplication();
