import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/api/admin-auth';
import { validateEmailSecurityConfig, performEmailSecurityAudit, getEmailSecurityConfig } from '@/lib/email/security-config';
import { emailSuppressionList, bounceTracker, emailRateLimiter } from '@/lib/email/email-validation';

export async function GET(request: NextRequest) {
  // Authentication check
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    // Check admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Perform security audit
    const audit = performEmailSecurityAudit();
    const config = validateEmailSecurityConfig();
    const environment = process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development';
    const securityConfig = getEmailSecurityConfig(environment);

    // Get current statistics
    const suppressionStats = emailSuppressionList.getSuppressionStats();
    const bounceStats = bounceTracker.getBounceStats();

    // Get environment info (without exposing secrets)
    const envInfo = {
      nodeEnv: environment,
      hasZeptoApiKey: !!process.env.ZEPTO_API_KEY,
      zeptoApiKeyLength: process.env.ZEPTO_API_KEY?.length || 0,
      zeptoApiUrl: process.env.ZEPTO_API_URL,
      mailFrom: process.env.MAIL_FROM,
      isProduction: environment === 'production'
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envInfo,
      securityAudit: {
        score: audit.score,
        maxScore: audit.maxScore,
        percentage: Math.round((audit.score / audit.maxScore) * 100),
        grade: audit.score >= 8 ? 'A' : audit.score >= 6 ? 'B' : audit.score >= 4 ? 'C' : 'D',
        issues: audit.issues,
        recommendations: audit.recommendations
      },
      configuration: {
        isValid: config.isValid,
        issues: config.issues,
        recommendations: config.recommendations
      },
      statistics: {
        suppression: suppressionStats,
        bounce: bounceStats,
        rateLimiting: {
          active: true,
          limits: securityConfig.rateLimits
        }
      },
      recommendations: audit.score < 7 ? [
        'Update API keys with secure values',
        'Implement comprehensive monitoring',
        'Set up bounce handling automation',
        'Configure SPF/DKIM/DMARC records',
        'Review and update email templates',
        'Implement proper error handling'
      ] : []
    });

  } catch (error) {
    console.error('Email security audit error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform security audit',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Authentication check
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { action, data } = body;

    // Check admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'addSuppression':
        if (data.email) {
          emailSuppressionList.addSuppressed(data.email);
          return NextResponse.json({
            success: true,
            message: `Email ${data.email} added to suppression list`
          });
        }
        break;

      case 'addSuppressedDomain':
        if (data.domain) {
          emailSuppressionList.addSuppressedDomain(data.domain);
          return NextResponse.json({
            success: true,
            message: `Domain ${data.domain} added to suppression list`
          });
        }
        break;

      case 'getStats':
        return NextResponse.json({
          suppression: emailSuppressionList.getSuppressionStats(),
          bounce: bounceTracker.getBounceStats()
        });

      case 'testRateLimit':
        const testResult = emailRateLimiter.canSendEmail('test');
        return NextResponse.json({
          allowed: testResult.allowed,
          retryAfter: testResult.retryAfter,
          reason: testResult.reason
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Email security action error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
