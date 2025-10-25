import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { withApiHandler, requireRole, httpJson } from '@/lib/api/guard';
import { parseJson, parseQueryParams } from '@/lib/validation/helpers';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';
import {
  driverApplicationCreate,
  paginationQuery,
  searchQuery,
} from '@/lib/validation/schemas';
import { prisma } from '@/lib/prisma';

// Function to send admin notification for new driver application
async function sendDriverApplicationNotification(
  application: any,
  files: { [key: string]: string }
) {
  try {
    // Create comprehensive admin notification
    const notification = await prisma.adminNotification.create({
      data: {
        type: 'new_driver_application',
        title: `New Driver Application: ${application.firstName} ${application.lastName}`,
        message: `A new driver application has been submitted with email ${application.email}`,
        priority: 'high',
        data: {
          applicationId: application.id,
          driverName: `${application.firstName} ${application.lastName}`,
          email: application.email,
          phone: application.phone,
          address: `${application.addressLine1}${application.addressLine2 ? ', ' + application.addressLine2 : ''}, ${application.city}, ${application.postcode}`,
          postcode: application.postcode,
          drivingLicenseFrontImage: application.drivingLicenseFrontImage,
          drivingLicenseBackImage: application.drivingLicenseBackImage,
          insuranceDocument: application.insuranceDocument,
          rightToWorkDocument: application.rightToWorkDocument,
          bankName: application.bankName,
          accountHolderName: application.accountHolderName,
          sortCode: application.sortCode,
          accountNumber: application.accountNumber,
          nationalInsuranceNumber: application.nationalInsuranceNumber,
          drivingLicenseNumber: application.drivingLicenseNumber,

          // Application metadata
          applicationDate: application.applicationDate,
          status: application.status,
        },
        actionUrl: `/admin/drivers/applications/${application.id}`,
        actorId: application.userId,
        actorRole: 'driver_applicant',
        isRead: false,
        createdAt: new Date(),
      },
    });

    console.log(
      '✅ Admin notification created for driver application:',
      notification.id
    );

    // Send email notification to admin
    try {
      const emailResponse = await fetch(
        `${process.env.APP_URL || 'http://localhost:3000'}/api/email/driver-application-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicationData: {
              applicationId: application.id,
              userId: application.userId,
              driverName: `${application.firstName} ${application.lastName}`,
              driverEmail: application.email, // Changed from 'email' to 'driverEmail'
              email: application.email, // Keep for backward compatibility
              phone: application.phone,
              address: `${application.addressLine1}${application.addressLine2 ? ', ' + application.addressLine2 : ''}, ${application.city}, ${application.postcode}`,
              postcode: application.postcode,
              drivingLicenseFrontImage: application.drivingLicenseFrontImage,
              drivingLicenseBackImage: application.drivingLicenseBackImage,
              insuranceDocument: application.insuranceDocument,
              rightToWorkDocument: application.rightToWorkDocument,
              bankName: application.bankName,
              accountHolderName: application.accountHolderName,
              sortCode: application.sortCode,
              accountNumber: application.accountNumber,
              nationalInsuranceNumber: application.nationalInsuranceNumber,
              drivingLicenseNumber: application.drivingLicenseNumber,
              applicationDate: application.applicationDate,
              status: application.status,
            },
          }),
        }
      );

      if (emailResponse.ok) {
        console.log('✅ Email notification sent for driver application');
      } else {
        console.warn(
          '⚠️ Failed to send email notification:',
          await emailResponse.text()
        );
      }
    } catch (emailError) {
      console.warn('⚠️ Error sending email notification:', emailError);
      // Don't fail the application submission if email fails
    }

    return notification;
  } catch (error) {
    console.error('❌ Error creating admin notification:', error);
    // Don't throw error - notification failure shouldn't break the application submission
  }
}

// POST /api/driver/applications - Submit driver application
export const POST = withApiHandler(async (request: NextRequest) => {
  try {
    console.log('🚀 Starting driver application submission...');
    
    // No auth required for public driver applications
    const formData = await request.formData();
    
    console.log('📝 Form data received, extracting fields...');

    // Extract form data with proper validation
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const phone = formData.get('phone') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string;
    const nationalInsuranceNumber = formData.get(
      'nationalInsuranceNumber'
    ) as string;

    // Address information
    const addressLine1 = formData.get('addressLine1') as string;
    const addressLine2 = formData.get('addressLine2') as string;
    const city = formData.get('city') as string;
    const postcode = formData.get('postcode') as string;
    const county = formData.get('county') as string;

    // Driving information
    const drivingLicenseNumber = formData.get('drivingLicenseNumber') as string;
    const drivingLicenseExpiry = formData.get('drivingLicenseExpiry') as string;

    // Insurance information
    const insuranceProvider = formData.get('insuranceProvider') as string;
    const insurancePolicyNumber = formData.get('insurancePolicyNumber') as string;
    const insuranceExpiry = formData.get('insuranceExpiry') as string;

    // Banking information
    const bankName = formData.get('bankName') as string;
    const accountHolderName = formData.get('accountHolderName') as string;
    const sortCode = formData.get('sortCode') as string;
    const accountNumber = formData.get('accountNumber') as string;

    // Right to work
    const rightToWorkShareCode = formData.get('rightToWorkShareCode') as string;

    // Emergency contact
    const emergencyContactName = formData.get('emergencyContactName') as string;
    const emergencyContactPhone = formData.get('emergencyContactPhone') as string;
    const emergencyContactRelationship = formData.get(
      'emergencyContactRelationship'
    ) as string;

    // Terms agreement
    const agreeToTerms = formData.get('agreeToTerms') === 'true';
    const agreeToDataProcessing =
      formData.get('agreeToDataProcessing') === 'true';
    const agreeToBackgroundCheck =
      formData.get('agreeToBackgroundCheck') === 'true';

    console.log('✅ Form data extracted successfully');

    // Validate required fields
    console.log('🔍 Validating required fields...');
    const missingFields = [];
    
    if (!firstName) missingFields.push('firstName');
    if (!lastName) missingFields.push('lastName');
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    if (!phone) missingFields.push('phone');
    if (!dateOfBirth) missingFields.push('dateOfBirth');
    if (!nationalInsuranceNumber) missingFields.push('nationalInsuranceNumber');
    if (!addressLine1) missingFields.push('addressLine1');
    if (!city) missingFields.push('city');
    if (!postcode) missingFields.push('postcode');
    if (!drivingLicenseNumber) missingFields.push('drivingLicenseNumber');
    if (!drivingLicenseExpiry) missingFields.push('drivingLicenseExpiry');
    if (!insuranceProvider) missingFields.push('insuranceProvider');
    if (!insurancePolicyNumber) missingFields.push('insurancePolicyNumber');
    if (!insuranceExpiry) missingFields.push('insuranceExpiry');
    if (!bankName) missingFields.push('bankName');
    if (!sortCode) missingFields.push('sortCode');
    if (!accountNumber) missingFields.push('accountNumber');
    if (!rightToWorkShareCode) missingFields.push('rightToWorkShareCode');
    if (!emergencyContactName) missingFields.push('emergencyContactName');
    if (!emergencyContactPhone) missingFields.push('emergencyContactPhone');
    if (!emergencyContactRelationship) missingFields.push('emergencyContactRelationship');

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return httpJson(400, { 
        error: 'Missing required fields',
        missingFields: missingFields,
        message: `Please fill in the following fields: ${missingFields.join(', ')}`
      });
    }

    // Validate terms agreement
    if (!agreeToTerms || !agreeToDataProcessing || !agreeToBackgroundCheck) {
      console.error('❌ Terms agreement validation failed');
      return httpJson(400, {
        error: 'You must agree to all terms and conditions',
        message: 'Please check all agreement checkboxes to proceed'
      });
    }

    console.log('✅ All validations passed');

    // Check if email already exists
    console.log('🔍 Checking for existing user with email:', email);
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log('❌ User already exists with email:', email);
        return httpJson(409, {
          error:
            'Email already registered. Please use a different email address or try logging in.',
        });
      }
    } catch (dbError) {
      console.error('❌ Database error checking existing user:', dbError);
      return httpJson(500, {
        error: 'Database error occurred while checking email',
        message: 'Please try again later'
      });
    }

    // Check if driver application already exists
    console.log('🔍 Checking for existing driver application...');
    try {
      const existingApplication = await prisma.driverApplication.findUnique({
        where: { email },
        include: { 
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
              isActive: true
            }
          }
        },
      });

      if (existingApplication) {
        // If application exists but no user, this means a previous submission failed
        if (!existingApplication.userId) {
          console.log('🧹 Cleaning up orphaned application:', existingApplication.id);
          // Delete the orphaned application and allow resubmission
          await prisma.driverApplication.delete({
            where: { id: existingApplication.id },
          });
        } else {
          console.log('❌ Application already exists with user:', existingApplication.id);
          return httpJson(409, {
            error:
              'Application already submitted with this email. Please contact support if you need to update your application.',
          });
        }
      }
    } catch (dbError) {
      console.error('❌ Database error checking existing application:', dbError);
      return httpJson(500, {
        error: 'Database error occurred while checking application',
        message: 'Please try again later'
      });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12);
      console.log('✅ Password hashed successfully');
    } catch (hashError) {
      console.error('❌ Password hashing error:', hashError);
      return httpJson(500, {
        error: 'Password processing failed',
        message: 'Please try again later'
      });
    }

    // Handle file uploads
    console.log('📁 Processing file uploads...');
    const uploadDir = join(
      process.cwd(),
      'public',
      'uploads',
      'driver-applications'
    );
    
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log('✅ Upload directory created/verified');
    } catch (dirError) {
      console.error('❌ Error creating upload directory:', dirError);
      return httpJson(500, {
        error: 'File upload directory error',
        message: 'Please try again later'
      });
    }

    const files: { [key: string]: string } = {};

    // Process file uploads
    const fileFields = [
      'drivingLicenseFront',
      'drivingLicenseBack',
      'insuranceDocument',
      'rightToWorkDocument',
    ];

    for (const field of fileFields) {
      try {
        const file = formData.get(field) as File;
        if (file) {
          console.log(`📄 Processing file: ${field} - ${file.name}`);
          const bytes = await file.arrayBuffer();
          const buffer = new Uint8Array(bytes);

          const fileName = `${Date.now()}-${field}-${file.name}`;
          const filePath = join(uploadDir, fileName);

          await writeFile(filePath, buffer);
          files[field] = `/uploads/driver-applications/${fileName}`;
          console.log(`✅ File uploaded: ${fileName}`);
        }
      } catch (fileError) {
        console.error(`❌ Error processing file ${field}:`, fileError);
        return httpJson(500, {
          error: `File upload failed for ${field}`,
          message: 'Please try uploading the file again'
        });
      }
    }

    // Create driver application
    console.log('📝 Creating driver application...');
    let application;
    try {
      application = await prisma.driverApplication.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          dateOfBirth: new Date(dateOfBirth),
          addressLine1,
          addressLine2: addressLine2 || null,
          city,
          postcode,
          county: county || '',
          nationalInsuranceNumber,
          drivingLicenseNumber,
          drivingLicenseExpiry: new Date(drivingLicenseExpiry),
          drivingLicenseFrontImage: files.drivingLicenseFront || null,
          drivingLicenseBackImage: files.drivingLicenseBack || null,
          insuranceProvider,
          insurancePolicyNumber,
          insuranceExpiry: new Date(insuranceExpiry),
          insuranceDocument: files.insuranceDocument || null,
          bankName,
          accountHolderName,
          sortCode,
          accountNumber,
          rightToWorkShareCode,
          rightToWorkDocument: files.rightToWorkDocument || null,
          emergencyContactName,
          emergencyContactPhone,
          emergencyContactRelationship,
          agreeToTerms,
          agreeToDataProcessing,
          agreeToBackgroundCheck,
          status: 'pending',
        },
      });
      console.log('✅ Driver application created:', application.id);
    } catch (appError) {
      console.error('❌ Error creating driver application:', appError);
      return httpJson(500, {
        error: 'Failed to create driver application',
        message: 'Please try again later'
      });
    }

    // Create user account (inactive until approved)
    console.log('👤 Creating user account...');
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          password: hashedPassword,
          role: 'driver',
          isActive: false, // Will be activated when admin approves
        },
      });
      console.log('✅ User account created:', user.id);
    } catch (userError) {
      console.error('❌ Error creating user account:', userError);
      // Clean up the application if user creation fails
      try {
        await prisma.driverApplication.delete({
          where: { id: application.id },
        });
        console.log('🧹 Cleaned up orphaned application');
      } catch (cleanupError) {
        console.error('❌ Error cleaning up orphaned application:', cleanupError);
      }
      return httpJson(500, {
        error: 'Failed to create user account',
        message: 'Please try again later'
      });
    }

    // Update the driver application to link it to the user
    console.log('🔗 Linking application to user...');
    try {
      await prisma.driverApplication.update({
        where: { id: application.id },
        data: { userId: user.id },
      });
      console.log('✅ Application linked to user successfully');
    } catch (linkError) {
      console.error('❌ Error linking application to user:', linkError);
      // This is not critical, the application can still be processed
      console.log('⚠️ Continuing despite link error...');
    }

    // Send comprehensive admin notification with all application details
    console.log('📧 Sending admin notification...');
    try {
      await sendDriverApplicationNotification(application, files);
      console.log('✅ Admin notification sent successfully');
    } catch (notificationError) {
      console.error('⚠️ Failed to send admin notification:', notificationError);
      // Don't fail the application submission if notification fails
    }

    // Send confirmation email to the driver
    console.log('📧 Sending driver confirmation email...');
    try {
      await unifiedEmailService.sendDriverApplicationConfirmation({
        driverName: `${firstName} ${lastName}`,
        driverEmail: email,
        applicationId: application.id,
        appliedAt: new Date().toISOString(),
      });
      console.log('✅ Driver application confirmation email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Failed to send driver confirmation email:', emailError);
      // Don't fail the application submission if email fails
    }

    // Send SMS confirmation to the driver
    console.log('📱 Sending driver application confirmation SMS...');
    try {
      const { getVoodooSMSService } = await import('@/lib/sms/VoodooSMSService');
      const smsService = getVoodooSMSService();
      
      const smsMessage = `Hi ${firstName}, your Speedy Van driver application has been received! We'll review it within 24-48 hours and notify you of the status. Application ID: ${application.id}. Call 01202129746 for support.`;
      
      const smsResult = await smsService.sendSMS({
        to: phone,
        message: smsMessage
      });

      if (smsResult.success) {
        console.log(`✅ Driver application confirmation SMS sent to ${phone}`);
      } else {
        console.error('❌ Driver application confirmation SMS failed:', smsResult.error);
      }
    } catch (smsError) {
      console.error('❌ SMS service error for driver application:', smsError);
      // Don't fail the application submission if SMS fails
    }

    console.log('🎉 Driver application submission completed successfully');
    return httpJson(201, {
      message: 'Application submitted successfully',
      applicationId: application.id,
      userId: user.id,
    });

  } catch (error) {
    console.error('❌ Unexpected error in driver application submission:', error);
    return httpJson(500, {
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// GET /api/driver/applications - Get driver applications (admin only)
export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await requireRole(request, 'admin');

  const queryParams = parseQueryParams(
    request.url,
    paginationQuery.merge(searchQuery)
  );
  if (!queryParams.ok) return queryParams.error;

  const { page, limit, status } = queryParams.data;
  const skip = ((page || 1) - 1) * (limit || 10);

  const where = status ? { status: status as any } : {};

  const [applications, total] = await Promise.all([
    prisma.driverApplication.findMany({
      where,
      skip,
      take: limit,
      orderBy: { applicationDate: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        },
      },
    }),
    prisma.driverApplication.count({ where }),
  ]);

  return httpJson(200, {
    applications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / (limit || 10)),
    },
  });
});
