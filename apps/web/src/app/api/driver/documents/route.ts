import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api/guard';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Allowed file types for security
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'driver');
    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        Document: {
          where: category ? { category: category as any } : undefined,
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json({
      documents: driver.Document,
    });
  } catch (error) {
    console.error('Driver documents GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, 'driver');
    const userId = user.id;
    const formData = await request.formData();

    const category = formData.get('category') as string;
    const file = formData.get('file') as File;
    const expiresAt = formData.get('expiresAt') as string;

    if (!category || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only PDF, JPEG, PNG, and WebP files are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'File too large. Maximum size is 10MB.',
        },
        { status: 400 }
      );
    }

    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${category}_${timestamp}.${fileExtension}`;

    // In a real implementation, you would upload to a cloud storage service
    // For now, we'll store the file information and simulate the upload
    const fileUrl = `/uploads/documents/${fileName}`;

    // Create document record
    const document = await prisma.document.create({
      data: {
        driverId: driver.id,
        category: category as any,
        fileUrl,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: 'pending',
      },
    });

    // Log the document upload
    await logAudit(user.id, 'driver_document_uploaded', document.id, { targetType: 'document', before: null, after: { category, fileName, fileSize: file.size, mimeType: file.type } });

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        category: document.category,
        fileUrl: document.fileUrl,
        status: document.status,
        uploadedAt: document.uploadedAt,
      },
    });
  } catch (error) {
    console.error('Driver documents POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate signed URL for document upload
export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(request, 'driver');
    const { fileName, fileType, category } = await request.json();

    if (!fileName || !fileType || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only PDF, JPEG, PNG, and WebP files are allowed.',
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would generate a signed URL for cloud storage
    // For now, we'll return a mock signed URL
    const signedUrl = `/api/driver/documents/upload/${fileName}?token=mock-signed-token`;

    return NextResponse.json({
      signedUrl,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error('Driver documents signed URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


