import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  isPathSafe,
  getContentType,
  getCORSHeaders,
  UPLOAD_DIRS,
} from '@/lib/file-upload/config';
import {
  createErrorResponse,
  createAuthErrorResponse,
  generateRequestId,
} from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const requestId = generateRequestId();
  const origin = request.headers.get('origin');
  const corsHeaders = getCORSHeaders(origin || undefined);

  try {
    // Validate path structure
    if (!params.path || params.path.length < 2) {
      console.warn(`[${requestId}] Invalid path structure:`, params.path);
      return new NextResponse('Invalid path', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
          ...corsHeaders,
        },
      });
    }

    const [directory, ...filePathParts] = params.path;
    const filename = filePathParts.join('/');

    // Validate directory
    if (!Object.values(UPLOAD_DIRS).some((dir: any) => String(dir).endsWith(directory))) {
      console.warn(`[${requestId}] Invalid directory:`, directory);
      return new NextResponse('Invalid directory', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
          ...corsHeaders,
        },
      });
    }

    // Construct safe file path
    const baseDir = path.join(process.cwd(), 'public', 'uploads', directory);
    const filePath = path.join(baseDir, filename);

    // Security check - prevent path traversal
    if (!isPathSafe(filePath, baseDir)) {
      console.warn(`[${requestId}] Path traversal attempt:`, filePath);
      return new NextResponse('Forbidden', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          ...corsHeaders,
        },
      });
    }

    // Check if file exists and get stats
    let fileStats;
    try {
      fileStats = await fs.stat(filePath);
    } catch {
      console.warn(`[${requestId}] File not found: ${filePath}`);
      return new NextResponse('File not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          ...corsHeaders,
        },
      });
    }

    // Optional: Authentication check for private files
    // Uncomment if you need authentication for file access
    /*
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'Content-Type': 'text/plain',
          ...corsHeaders,
        },
      });
    }
    */

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type
    const contentType = getContentType(filename);

    // Security headers
    const securityHeaders = {
      'Content-Type': contentType,
      'Content-Length': fileStats.size.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'none'",
      'Last-Modified': fileStats.mtime.toUTCString(),
      'ETag': `"${fileStats.mtime.getTime()}-${fileStats.size}"`,
      ...corsHeaders,
    };

    // Check if client has cached version
    const ifNoneMatch = request.headers.get('if-none-match');
    const ifModifiedSince = request.headers.get('if-modified-since');
    
    if (ifNoneMatch === securityHeaders['ETag'] || 
        (ifModifiedSince && new Date(ifModifiedSince) >= fileStats.mtime)) {
      return new NextResponse(null, {
        status: 304,
        headers: securityHeaders,
      });
    }

    console.log(`[${requestId}] ✅ Serving file: ${filename} (${fileStats.size} bytes)`);

    return new NextResponse(fileBuffer, {
      headers: securityHeaders,
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Error serving file:`, error);
    return new NextResponse('Internal server error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        ...corsHeaders,
      },
    });
  }
}
