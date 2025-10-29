import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const applySchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  position: z.string().min(1, 'Position is required'),
  coverLetter: z.string().min(50, 'Cover letter must be at least 50 characters'),
  cvFile: z.string(), // Base64 encoded PDF
  cvFileName: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    const validated = applySchema.parse(formData);

    // Decode and save CV file
    const buffer = Buffer.from(validated.cvFile.split(',')[1], 'base64');
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'cvs');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = validated.cvFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    await writeFile(filePath, new Uint8Array(buffer));

    // Store in database
    const application = await prisma.careerApplication.create({
      data: {
        fullName: validated.fullName,
        email: validated.email,
        phone: validated.phone,
        position: validated.position,
        coverLetter: validated.coverLetter,
        cvUrl: `/uploads/cvs/${fileName}`,
      },
    });

    // Send email notification to careers@
    await sendEmail({
      to: 'careers@speedy-van.co.uk',
      subject: `New Career Application: ${validated.position}`,
      html: `
        <h2>New Career Application Received</h2>
        <p><strong>Position:</strong> ${validated.position}</p>
        <p><strong>Applicant:</strong> ${validated.fullName}</p>
        <p><strong>Email:</strong> ${validated.email}</p>
        <p><strong>Phone:</strong> ${validated.phone}</p>
        <p><strong>Application ID:</strong> ${application.id}</p>
        <br>
        <p><strong>Cover Letter:</strong></p>
        <p>${validated.coverLetter}</p>
        <br>
        <p><a href="https://speedy-van.co.uk/admin/careers">View in Admin Panel</a></p>
      `,
    });

    // Send confirmation email to applicant
    await sendEmail({
      to: validated.email,
      subject: 'Application Received - Speedy Van Careers',
      html: `
        <h2>Thank You for Your Application!</h2>
        <p>Dear ${validated.fullName},</p>
        <p>We have received your application for the <strong>${validated.position}</strong> position.</p>
        <p>Our HR team will review your application and get back to you within 5-7 business days.</p>
        <br>
        <p>Application Reference: <strong>${application.id}</strong></p>
        <br>
        <p>Best regards,<br>Speedy Van Careers Team</p>
      `,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully',
        applicationId: application.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Career application error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

