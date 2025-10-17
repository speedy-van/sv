/**
 * Email Spam Filter
 * Removes spammy content and ensures transactional-only emails
 */

// Spam trigger words and phrases
const SPAM_TRIGGERS = [
  // Financial promises
  'make money',
  'earn money',
  'get rich',
  'guaranteed income',
  'work from home',
  'cash bonus',
  'money back guarantee',
  
  // Urgency/scarcity
  'limited time',
  'act now',
  'don\'t miss out',
  'expires soon',
  'while supplies last',
  'one time offer',
  
  // Marketing terms
  'click here',
  'buy now',
  'free offer',
  'special promotion',
  'discount code',
  'sale ends',
  'save big',
  
  // Excessive capitalization
  /[A-Z]{3,}/g, // 3+ consecutive capitals
  
  // Excessive punctuation
  /[!]{2,}/g, // 2+ exclamation marks
  /[?]{2,}/g, // 2+ question marks
  
  // HTML spam patterns
  /<script/i,
  /onclick=/i,
  /onload=/i,
  /javascript:/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
];

// Allowed transactional content
const ALLOWED_TRANSACTIONAL_CONTENT = [
  'booking confirmation',
  'payment confirmation',
  'order confirmation',
  'booking reminder',
  'driver assignment',
  'booking update',
  'cancellation notice',
  'password reset',
  'account verification',
  'admin welcome',
  'driver application',
  'support response'
];

export interface SpamCheckResult {
  isSpam: boolean;
  spamScore: number;
  triggers: string[];
  recommendations: string[];
}

export function checkEmailForSpam(
  subject: string,
  htmlContent: string,
  isTransactional: boolean = true
): SpamCheckResult {
  const triggers: string[] = [];
  let spamScore = 0;
  const recommendations: string[] = [];

  // Convert to lowercase for checking
  const lowerSubject = subject.toLowerCase();
  const lowerHtml = htmlContent.toLowerCase();
  const combinedText = `${lowerSubject} ${lowerHtml}`;

  // Check for spam triggers
  SPAM_TRIGGERS.forEach((trigger, index) => {
    if (typeof trigger === 'string') {
      if (combinedText.includes(trigger.toLowerCase())) {
        triggers.push(trigger);
        spamScore += 1;
      }
    } else if (trigger instanceof RegExp) {
      const matches = combinedText.match(trigger);
      if (matches) {
        triggers.push(`Pattern: ${trigger.source}`);
        spamScore += matches.length;
      }
    }
  });

  // Check HTML structure
  const htmlTagCount = (htmlContent.match(/<[^>]+>/g) || []).length;
  const textLength = htmlContent.replace(/<[^>]*>/g, '').length;
  
  if (htmlTagCount > textLength / 10) {
    triggers.push('Excessive HTML tags');
    spamScore += 2;
    recommendations.push('Reduce HTML complexity, use more plain text');
  }

  // Check for excessive links
  const linkCount = (htmlContent.match(/<a[^>]*href=/gi) || []).length;
  if (linkCount > 5) {
    triggers.push('Too many links');
    spamScore += 1;
    recommendations.push('Limit links to essential ones only');
  }

  // Check for image-heavy content
  const imageCount = (htmlContent.match(/<img[^>]*>/gi) || []).length;
  if (imageCount > 3) {
    triggers.push('Too many images');
    spamScore += 1;
    recommendations.push('Use fewer images, optimize for email');
  }

  // Validate transactional nature
  if (isTransactional) {
    const hasTransactionalContent = ALLOWED_TRANSACTIONAL_CONTENT.some(content =>
      combinedText.includes(content.toLowerCase())
    );
    
    if (!hasTransactionalContent) {
      recommendations.push('Ensure email clearly indicates its transactional purpose');
    }
  }

  // Check subject line
  if (subject.length > 50) {
    triggers.push('Subject too long');
    spamScore += 1;
    recommendations.push('Keep subject line under 50 characters');
  }

  if (subject.toLowerCase().includes('urgent') || subject.toLowerCase().includes('immediate')) {
    triggers.push('Urgency words in subject');
    spamScore += 1;
    recommendations.push('Avoid urgency words in subject lines');
  }

  // Determine if spam
  const isSpam = spamScore >= 3 || triggers.length >= 2;

  return {
    isSpam,
    spamScore,
    triggers,
    recommendations
  };
}

export function sanitizeEmailContent(htmlContent: string): string {
  let sanitized = htmlContent;

  // Remove dangerous HTML
  sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed[^>]*>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: links
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  
  // Normalize excessive punctuation
  sanitized = sanitized.replace(/[!]{2,}/g, '!');
  sanitized = sanitized.replace(/[?]{2,}/g, '?');
  
  // Remove excessive capitalization
  sanitized = sanitized.replace(/\b[A-Z]{3,}\b/g, (match) => {
    return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
  });

  return sanitized;
}

export function validateEmailTemplate(
  subject: string,
  htmlContent: string,
  templateType: 'transactional' | 'marketing' = 'transactional'
): {
  isValid: boolean;
  issues: string[];
  sanitizedContent: string;
} {
  const issues: string[] = [];
  
  // Sanitize content first
  const sanitizedContent = sanitizeEmailContent(htmlContent);
  
  // Check for spam
  const spamCheck = checkEmailForSpam(subject, sanitizedContent, templateType === 'transactional');
  
  if (spamCheck.isSpam) {
    issues.push(`Spam detected (score: ${spamCheck.spamScore}): ${spamCheck.triggers.join(', ')}`);
  }
  
  // Add recommendations as issues
  spamCheck.recommendations.forEach(rec => {
    issues.push(`Recommendation: ${rec}`);
  });
  
  // Additional validations
  if (templateType === 'transactional') {
    // Must have clear transactional purpose
    if (!spamCheck.triggers.some(t => ALLOWED_TRANSACTIONAL_CONTENT.some(allowed => 
      t.toLowerCase().includes(allowed.toLowerCase())
    ))) {
      issues.push('Transactional email should clearly indicate its purpose');
    }
    
    // Should not have marketing content
    if (sanitizedContent.toLowerCase().includes('unsubscribe')) {
      issues.push('Transactional emails should not contain unsubscribe links');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    sanitizedContent
  };
}

// Template content guidelines
export const EMAIL_TEMPLATE_GUIDELINES = {
  transactional: {
    maxSubjectLength: 50,
    maxHtmlTags: 50,
    maxLinks: 3,
    maxImages: 2,
    requiredElements: ['company branding', 'clear purpose', 'contact information'],
    forbiddenElements: ['unsubscribe links', 'marketing content', 'excessive styling']
  },
  
  marketing: {
    maxSubjectLength: 60,
    maxHtmlTags: 100,
    maxLinks: 5,
    maxImages: 5,
    requiredElements: ['unsubscribe link', 'company address', 'clear value proposition'],
    forbiddenElements: ['deceptive content', 'excessive urgency', 'misleading claims']
  }
};
