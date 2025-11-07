import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers (matching next.config.mjs for consistency)
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  // CRITICAL: Proper MIME types for CSS files (Safari iOS fix)
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/_next/static/') && pathname.endsWith('.css')) {
    // Force correct MIME type for CSS files
    response.headers.set('Content-Type', 'text/css; charset=utf-8');
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('X-Content-Type-Options', 'nosniff');
  } else if (pathname.startsWith('/_next/static/')) {
    // Cache busting for other static files
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('X-Content-Hash', process.env.NEXT_BUILD_ID || Date.now().toString());
    response.headers.set('ETag', `"${Date.now()}"`);
  }

  // Set pathname header for use in layouts
  response.headers.set('x-pathname', pathname);

  // Force HTTPS in production
  const url = request.nextUrl.clone();
  const isProduction = process.env.NODE_ENV === 'production';
  const protocol = request.headers.get('x-forwarded-proto');

  if (isProduction && protocol !== 'https' && !url.hostname.includes('localhost')) {
    url.protocol = 'https:';
    return NextResponse.redirect(url);
  }

  return response;
}

// CRITICAL: Apply middleware to ALL routes INCLUDING _next/static for CSS MIME type fix
export const config = {
  matcher: [
    /*
     * Match ALL request paths to ensure CSS files get correct MIME type
     * This is CRITICAL for Safari iOS rendering
     */
    '/(.*)',
  ],
};
