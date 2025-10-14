/**
 * Secure File Upload API
 * Handles file uploads with proper validation, security, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { promises as fs } from 'fs';
import * as path from 'path';
import {
  validateFile,
  validateFileSize,
  sanitizeFilename,
  generateSecureFilename,
  isPathSafe,
  scanFileForMalware,
  getCORSHeaders,
  checkRateLimit,
  UPLOAD_DIRS,
  FILE_TYPES,
  SECURITY_CONFIG,
} from '@/lib/file-upload/config';
import {
  createSuccessResponse,
  createErrorResponse,
  createAuthErrorResponse,
  createValidationErrorResponse,
  generateRequestId,
} from '@/lib/api-response';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCORSHeaders(origin || undefined);
  
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const origin = request.headers.get('origin');
  const corsHeaders = getCORSHeaders(origin || undefined);

  try {
    // Authentication check
    if (SECURITY_CONFIG.requireAuth) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return createAuthErrorResponse(
          'Authentication required for file upload',
          requestId
        );
      }

      // Rate limiting
      const rateLimitResult = await checkRateLimit(session.user.id);
      if (!rateLimitResult.allowed) {
        return createErrorResponse(
          'Upload rate limit exceeded. Please try again later.',
          'RATE_LIMIT_EXCEEDED',
          requestId,
          {
            resetTime: new Date(rateLimitResult.resetTime || 0).toISOString(),
            remaining: rateLimitResult.remaining,
          },
          429
        );
      }
    }

    // Parse multipart form data
    const formData = await request.formData();
    const filesData = formData.getAll('files');
    const files = filesData.filter((f): f is File => f instanceof File || (typeof f === 'object' && 'name' in f && 'type' in f));
    const category = formData.get('category') as keyof typeof FILE_TYPES;
    const directory = formData.get('directory') as keyof typeof UPLOAD_DIRS;

    // Validation
    if (!files || files.length === 0) {
      return createValidationErrorResponse(
        'files',
        'At least one file is required',
        requestId
      );
    }

    if (files.length > SECURITY_CONFIG.maxFilesPerRequest) {
      return createValidationErrorResponse(
        'files',
        `Maximum ${SECURITY_CONFIG.maxFilesPerRequest} files allowed per request`,
        requestId
      );
    }

    if (!category || !FILE_TYPES[category]) {
      return createValidationErrorResponse(
        'category',
        'Valid file category is required',
        requestId
      );
    }

    if (!directory || !UPLOAD_DIRS[directory]) {
      return createValidationErrorResponse(
        'directory',
        'Valid upload directory is required',
        requestId
      );
    }

    const session = await getServerSession(authOptions);
    const uploadResults = [];
    const errors = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        console.log(`[${requestId}] Processing file ${i + 1}/${files.length}: ${file.name}`);

        // File validation
        const typeValidation = validateFile(file, {
          maxFileSize: SECURITY_CONFIG.maxFileSize,
          allowedTypes: [...(FILE_TYPES[category] || [])],
          allowedExtensions: [...SECURITY_CONFIG.allowedExtensions],
          uploadPath: UPLOAD_DIRS[directory] || '/uploads'
        });
        if (!typeValidation.valid) {
          errors.push({
            file: file.name,
            error: typeValidation.error,
          });
          continue;
        }

        const sizeValidation = validateFileSize(file, SECURITY_CONFIG.maxFileSize);
        if (!sizeValidation.valid) {
          errors.push({
            file: file.name,
            error: sizeValidation.error,
          });
          continue;
        }

        // Generate secure filename
        const secureFilename = generateSecureFilename(file.name);

        // Create upload directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), UPLOAD_DIRS[directory]);
        await fs.mkdir(uploadDir, { recursive: true });

        // Final file path
        const filePath = path.join(uploadDir, secureFilename);

        // Security check - ensure path is safe
        if (!isPathSafe(filePath, uploadDir)) {
          errors.push({
            file: file.name,
            error: 'Invalid file path',
          });
          continue;
        }

        // Convert file to buffer and save
        const fileBuffer = await file.arrayBuffer();
        await fs.writeFile(filePath, new Uint8Array(fileBuffer));

        // Scan for malware
        const scanResult = await scanFileForMalware(filePath);
        if (!scanResult.clean) {
          // Delete the file immediately
          await fs.unlink(filePath).catch(() => {});
          errors.push({
            file: file.name,
            error: `Security threat detected: ${scanResult.threat}`,
          });
          continue;
        }

        // Success - add to results
        uploadResults.push({
          originalName: file.name,
          filename: secureFilename,
          size: file.size,
          type: file.type,
          category,
          directory,
          url: `/api/uploads/${String(directory)}/${secureFilename}`,
          uploadedAt: new Date().toISOString(),
        });

        console.log(`[${requestId}] ✅ File uploaded successfully: ${secureFilename}`);

      } catch (fileError) {
        console.error(`[${requestId}] ❌ Error processing file ${file.name}:`, fileError);
        errors.push({
          file: file.name,
          error: fileError instanceof Error ? fileError.message : 'Unknown error',
        });
      }
    }

    // Prepare response
    const response = {
      uploaded: uploadResults,
      errors,
      summary: {
        totalFiles: files.length,
        successful: uploadResults.length,
        failed: errors.length,
      },
    };

    if (uploadResults.length === 0 && errors.length > 0) {
      // All files failed
      return createErrorResponse(
        'All file uploads failed',
        'UPLOAD_FAILED',
        requestId,
        response,
        400
      );
    }

    // Some or all files succeeded
    const message = errors.length > 0 
      ? `${uploadResults.length} files uploaded successfully, ${errors.length} failed`
      : `${uploadResults.length} files uploaded successfully`;

    const successResponse = NextResponse.json(
      createSuccessResponse(response, message, requestId)
    );
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      successResponse.headers.set(key, String(value));
    });

    return successResponse;

  } catch (error) {
    console.error(`[${requestId}] ❌ Upload API error:`, error);
    
    const errorResponse = NextResponse.json(
      createErrorResponse(
        'File upload failed due to server error',
        'INTERNAL_ERROR',
        requestId,
        process.env.NODE_ENV === 'development' ? {
          error: error instanceof Error ? error.message : String(error),
        } : undefined,
        500
      )
    );

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, String(value));
    });

    return errorResponse;
  }
}

// Get uploaded file info
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const origin = request.headers.get('origin');
  const corsHeaders = getCORSHeaders(origin || undefined);

  try {
    const { searchParams } = new URL(request.url);
    const directory = searchParams.get('directory') as keyof typeof UPLOAD_DIRS;
    const filename = searchParams.get('filename');

    if (!directory || !UPLOAD_DIRS[directory]) {
      return createValidationErrorResponse(
        'directory',
        'Valid directory is required',
        requestId
      );
    }

    if (!filename) {
      return createValidationErrorResponse(
        'filename',
        'Filename is required',
        requestId
      );
    }

    const filePath = path.join(process.cwd(), UPLOAD_DIRS[directory], filename);

    // Security check
    const uploadDir = path.join(process.cwd(), UPLOAD_DIRS[directory]);
    if (!isPathSafe(filePath, uploadDir)) {
      return createErrorResponse(
        'Invalid file path',
        'SECURITY_ERROR',
        requestId,
        undefined,
        403
      );
    }

    // Check if file exists
    try {
      const stats = await fs.stat(filePath);
      
      const fileInfo = {
        filename,
        size: stats.size,
        directory,
        url: `/api/uploads/${String(directory)}/${filename}`,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
      };

      const response = NextResponse.json(
        createSuccessResponse(fileInfo, 'File info retrieved', requestId)
      );
      
      // Add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, String(value));
      });

      return response;

    } catch (fileError) {
      return createErrorResponse(
        'File not found',
        'NOT_FOUND',
        requestId,
        undefined,
        404
      );
    }

  } catch (error) {
    console.error(`[${requestId}] ❌ File info API error:`, error);
    
    const errorResponse = NextResponse.json(
      createErrorResponse(
        'Failed to retrieve file information',
        'INTERNAL_ERROR',
        requestId,
        undefined,
        500
      )
    );

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, String(value));
    });

    return errorResponse;
  }
}

// Delete uploaded file
export async function DELETE(request: NextRequest) {
  const requestId = generateRequestId();
  const origin = request.headers.get('origin');
  const corsHeaders = getCORSHeaders(origin || undefined);

  try {
    // Authentication required for deletion
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createAuthErrorResponse(
        'Authentication required for file deletion',
        requestId
      );
    }

    const { searchParams } = new URL(request.url);
    const directory = searchParams.get('directory') as keyof typeof UPLOAD_DIRS;
    const filename = searchParams.get('filename');

    if (!directory || !UPLOAD_DIRS[directory]) {
      return createValidationErrorResponse(
        'directory',
        'Valid directory is required',
        requestId
      );
    }

    if (!filename) {
      return createValidationErrorResponse(
        'filename',
        'Filename is required',
        requestId
      );
    }

    const filePath = path.join(process.cwd(), UPLOAD_DIRS[directory], filename);

    // Security check
    const uploadDir = path.join(process.cwd(), UPLOAD_DIRS[directory]);
    if (!isPathSafe(filePath, uploadDir)) {
      return createErrorResponse(
        'Invalid file path',
        'SECURITY_ERROR',
        requestId,
        undefined,
        403
      );
    }

    // Delete file
    try {
      await fs.unlink(filePath);
      console.log(`[${requestId}] ✅ File deleted: ${filename}`);

      const response = NextResponse.json(
        createSuccessResponse(
          { filename, directory },
          'File deleted successfully',
          requestId
        )
      );
      
      // Add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, String(value));
      });

      return response;

    } catch (deleteError) {
      return createErrorResponse(
        'File not found or already deleted',
        'NOT_FOUND',
        requestId,
        undefined,
        404
      );
    }

  } catch (error) {
    console.error(`[${requestId}] ❌ File deletion API error:`, error);
    
    const errorResponse = NextResponse.json(
      createErrorResponse(
        'Failed to delete file',
        'INTERNAL_ERROR',
        requestId,
        undefined,
        500
      )
    );

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, String(value));
    });

    return errorResponse;
  }
}
