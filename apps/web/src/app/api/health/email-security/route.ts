import { NextResponse } from 'next/server';
import { performEmailSecurityAudit, validateEmailSecurityConfig } from '@/lib/email/security-config';
import { emailSuppressionList, bounceTracker } from '@/lib/email/email-validation';

// Public health check endpoint (no auth required)
export async function GET() {
  try {
    const audit = performEmailSecurityAudit();
    const config = validateEmailSecurityConfig();
    const suppressionStats = emailSuppressionList.getSuppressionStats();
    const bounceStats = bounceTracker.getBounceStats();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      security: {
        score: audit.score,
        maxScore: audit.maxScore,
        percentage: Math.round((audit.score / audit.maxScore) * 100),
        grade: audit.score >= 8 ? 'A' : audit.score >= 6 ? 'B' : audit.score >= 4 ? 'C' : 'D',
        hasIssues: audit.issues.length > 0
      },
      configuration: {
        isValid: config.isValid,
        issuesCount: config.issues.length,
        recommendationsCount: config.recommendations.length
      },
      statistics: {
        suppression: suppressionStats,
        bounce: {
          totalBounces: bounceStats.totalBounces,
          suppressedEmails: bounceStats.suppressedEmails,
          bounceRate: bounceStats.bounceRate + '%'
        }
      },
      features: {
        emailValidation: true,
        spamFiltering: true,
        rateLimiting: true,
        bounceTracking: true,
        suppressionList: true
      },
      environment: {
        hasZeptoApiKey: !!process.env.ZEPTO_API_KEY,
        isProduction: process.env.NODE_ENV === 'production',
        mailFrom: process.env.MAIL_FROM
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
