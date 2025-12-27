import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Cookie Diagnostic Endpoint
 * Visit: http://localhost:3000/api/debug/cookies
 * 
 * This endpoint helps diagnose cookie issues by showing:
 * - What cookies the server receives
 * - Request headers
 * - Environment info
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const authCookie = cookieStore.get('auth-token');
  
  // Get request headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value: string, key: string) => {
    headers[key] = value;
  });

  const diagnosticInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    
    // Cookie information
    cookies: {
      total: allCookies.length,
      authTokenPresent: !!authCookie,
      authTokenValue: authCookie ? `${authCookie.value.substring(0, 30)}...` : 'NOT FOUND',
      allCookieNames: allCookies.map(c => c.name),
      allCookies: allCookies.map(c => ({
        name: c.name,
        valueLength: c.value.length,
        valuePreview: `${c.value.substring(0, 20)}...`,
      })),
    },
    
    // Request information
    request: {
      url: request.url,
      method: request.method,
      host: headers['host'],
      origin: headers['origin'],
      referer: headers['referer'],
      userAgent: headers['user-agent'],
      cookieHeader: headers['cookie'] || 'NOT PRESENT',
    },
    
    // Analysis
    analysis: {
      usingCorrectHost: headers['host']?.includes('localhost'),
      cookieHeaderPresent: !!headers['cookie'],
      authTokenInCookieHeader: headers['cookie']?.includes('auth-token') || false,
      
      // Recommendations
      recommendations: [] as string[],
    },
  };

  // Add recommendations based on analysis
  if (!diagnosticInfo.analysis.usingCorrectHost) {
    diagnosticInfo.analysis.recommendations.push(
      '❌ You are NOT using localhost! Use http://localhost:3000 instead of ' + headers['host']
    );
  } else {
    diagnosticInfo.analysis.recommendations.push(
      '✅ Correct host: using localhost'
    );
  }

  if (!diagnosticInfo.analysis.cookieHeaderPresent) {
    diagnosticInfo.analysis.recommendations.push(
      '❌ No Cookie header in request - browser is not sending cookies'
    );
    diagnosticInfo.analysis.recommendations.push(
      '   → Check browser privacy settings (Edge: Tracking Prevention)'
    );
    diagnosticInfo.analysis.recommendations.push(
      '   → Try in Incognito/Private mode'
    );
  } else if (!diagnosticInfo.analysis.authTokenInCookieHeader) {
    diagnosticInfo.analysis.recommendations.push(
      '⚠️  Cookie header present but no auth-token'
    );
    diagnosticInfo.analysis.recommendations.push(
      '   → Login first at http://localhost:3000/auth/login'
    );
  } else {
    diagnosticInfo.analysis.recommendations.push(
      '✅ auth-token cookie is being sent correctly!'
    );
  }

  return NextResponse.json(diagnosticInfo, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
