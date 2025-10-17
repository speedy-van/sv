/**
 * Email Validation & Suppression System
 * Prevents sending to invalid emails and maintains suppression list
 */

import { z } from 'zod';

// Email validation schema
export const emailValidationSchema = z.string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .refine((email) => {
    // Block common invalid domains
    const invalidDomains = [
      'example.com',
      'test.com',
      'localhost',
      'invalid.com',
      'nonexistent.com'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && !invalidDomains.includes(domain);
  }, 'Invalid email domain')
  .refine((email) => {
    // Block disposable email services
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'temp-mail.org',
      'throwaway.email'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && !disposableDomains.includes(domain);
  }, 'Disposable email addresses are not allowed');

// Suppression list management
class EmailSuppressionList {
  private static instance: EmailSuppressionList;
  private suppressedEmails: Set<string> = new Set();
  private suppressedDomains: Set<string> = new Set();

  private constructor() {
    this.loadSuppressionList();
  }

  public static getInstance(): EmailSuppressionList {
    if (!EmailSuppressionList.instance) {
      EmailSuppressionList.instance = new EmailSuppressionList();
    }
    return EmailSuppressionList.instance;
  }

  private loadSuppressionList(): void {
    // Load from environment or database
    const suppressedEmailsEnv = process.env.SUPPRESSED_EMAILS || '';
    const suppressedDomainsEnv = process.env.SUPPRESSED_DOMAINS || '';
    
    if (suppressedEmailsEnv) {
      suppressedEmailsEnv.split(',').forEach(email => {
        this.suppressedEmails.add(email.trim().toLowerCase());
      });
    }
    
    if (suppressedDomainsEnv) {
      suppressedDomainsEnv.split(',').forEach(domain => {
        this.suppressedDomains.add(domain.trim().toLowerCase());
      });
    }
  }

  public isSuppressed(email: string): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    const domain = normalizedEmail.split('@')[1];
    
    return this.suppressedEmails.has(normalizedEmail) || 
           Boolean(domain && this.suppressedDomains.has(domain));
  }

  public addSuppressed(email: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    this.suppressedEmails.add(normalizedEmail);
    
    // Log suppression for monitoring
    console.warn(`🚫 Email suppressed: ${normalizedEmail}`);
  }

  public addSuppressedDomain(domain: string): void {
    const normalizedDomain = domain.toLowerCase().trim();
    this.suppressedDomains.add(normalizedDomain);
    
    console.warn(`🚫 Domain suppressed: ${normalizedDomain}`);
  }

  public getSuppressionStats(): {
    suppressedEmails: number;
    suppressedDomains: number;
  } {
    return {
      suppressedEmails: this.suppressedEmails.size,
      suppressedDomains: this.suppressedDomains.size
    };
  }
}

// Email validation function
export function validateEmailForSending(email: string): {
  isValid: boolean;
  error?: string;
  shouldSuppress?: boolean;
} {
  try {
    // Basic validation
    const validatedEmail = emailValidationSchema.parse(email);
    
    // Check suppression list
    const suppressionList = EmailSuppressionList.getInstance();
    if (suppressionList.isSuppressed(validatedEmail)) {
      return {
        isValid: false,
        error: 'Email address is suppressed',
        shouldSuppress: false // Already suppressed
      };
    }
    
    return {
      isValid: true
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors[0]?.message || 'Invalid email';
      
      // Add to suppression if it's a domain issue
      if (errorMessage.includes('domain')) {
        const domain = email.split('@')[1];
        if (domain) {
          EmailSuppressionList.getInstance().addSuppressedDomain(domain);
        }
      }
      
      return {
        isValid: false,
        error: errorMessage,
        shouldSuppress: errorMessage.includes('domain') || errorMessage.includes('Disposable')
      };
    }
    
    return {
      isValid: false,
      error: 'Unknown validation error'
    };
  }
}

// Bounce tracking
export class BounceTracker {
  private static instance: BounceTracker;
  private bounceCounts: Map<string, number> = new Map();
  private lastBounceTime: Map<string, Date> = new Map();

  private constructor() {}

  public static getInstance(): BounceTracker {
    if (!BounceTracker.instance) {
      BounceTracker.instance = new BounceTracker();
    }
    return BounceTracker.instance;
  }

  public recordBounce(email: string, reason: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    const currentCount = this.bounceCounts.get(normalizedEmail) || 0;
    const newCount = currentCount + 1;
    
    this.bounceCounts.set(normalizedEmail, newCount);
    this.lastBounceTime.set(normalizedEmail, new Date());
    
    console.error(`📧 BOUNCE RECORDED: ${normalizedEmail} (${newCount}/3) - ${reason}`);
    
    // Auto-suppress after 3 bounces
    if (newCount >= 3) {
      EmailSuppressionList.getInstance().addSuppressed(normalizedEmail);
      console.error(`🚫 AUTO-SUPPRESSED: ${normalizedEmail} after ${newCount} bounces`);
    }
  }

  public getBounceStats(): {
    totalBounces: number;
    suppressedEmails: number;
    bounceRate: number;
  } {
    const suppressionList = EmailSuppressionList.getInstance();
    const suppressionStats = suppressionList.getSuppressionStats();
    
    return {
      totalBounces: Array.from(this.bounceCounts.values()).reduce((sum, count) => sum + count, 0),
      suppressedEmails: suppressionStats.suppressedEmails,
      bounceRate: this.calculateBounceRate()
    };
  }

  private calculateBounceRate(): number {
    // This would ideally track total emails sent vs bounces
    // For now, return a placeholder
    return 0;
  }
}

// Rate limiting
export class EmailRateLimiter {
  private static instance: EmailRateLimiter;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxRequestsPerMinute = 10; // Conservative limit
  private readonly maxRequestsPerHour = 100;

  private constructor() {}

  public static getInstance(): EmailRateLimiter {
    if (!EmailRateLimiter.instance) {
      EmailRateLimiter.instance = new EmailRateLimiter();
    }
    return EmailRateLimiter.instance;
  }

  public canSendEmail(identifier: string = 'global'): {
    allowed: boolean;
    retryAfter?: number;
    reason?: string;
  } {
    const now = Date.now();
    const minuteWindow = Math.floor(now / 60000) * 60000;
    const hourWindow = Math.floor(now / 3600000) * 3600000;
    
    const minuteKey = `${identifier}:${minuteWindow}`;
    const hourKey = `${identifier}:${hourWindow}`;
    
    // Check minute limit
    const minuteData = this.requestCounts.get(minuteKey) || { count: 0, resetTime: minuteWindow + 60000 };
    if (minuteData.count >= this.maxRequestsPerMinute) {
      return {
        allowed: false,
        retryAfter: minuteData.resetTime - now,
        reason: 'Rate limit exceeded (per minute)'
      };
    }
    
    // Check hour limit
    const hourData = this.requestCounts.get(hourKey) || { count: 0, resetTime: hourWindow + 3600000 };
    if (hourData.count >= this.maxRequestsPerHour) {
      return {
        allowed: false,
        retryAfter: hourData.resetTime - now,
        reason: 'Rate limit exceeded (per hour)'
      };
    }
    
    // Increment counters
    this.requestCounts.set(minuteKey, { 
      count: minuteData.count + 1, 
      resetTime: minuteData.resetTime 
    });
    this.requestCounts.set(hourKey, { 
      count: hourData.count + 1, 
      resetTime: hourData.resetTime 
    });
    
    return { allowed: true };
  }
}

// Main validation function
export function validateEmailBeforeSending(email: string, identifier?: string): {
  canSend: boolean;
  error?: string;
  shouldRetry?: boolean;
  retryAfter?: number;
} {
  // 1. Email format validation
  const emailValidation = validateEmailForSending(email);
  if (!emailValidation.isValid) {
    return {
      canSend: false,
      error: emailValidation.error
    };
  }
  
  // 2. Rate limiting check
  const rateLimit = EmailRateLimiter.getInstance().canSendEmail(identifier);
  if (!rateLimit.allowed) {
    return {
      canSend: false,
      error: rateLimit.reason,
      shouldRetry: true,
      retryAfter: rateLimit.retryAfter
    };
  }
  
  return { canSend: true };
}

export const emailSuppressionList = EmailSuppressionList.getInstance();
export const bounceTracker = BounceTracker.getInstance();
export const emailRateLimiter = EmailRateLimiter.getInstance();
