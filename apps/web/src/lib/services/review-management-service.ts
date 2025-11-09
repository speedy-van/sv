/**
 * Review Management Service
 * 
 * Handles Google Business Profile review responses and management
 * Provides templates and automation for timely review responses
 */

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  createTime: string;
  updateTime?: string;
  reply?: {
    text: string;
    updateTime: string;
  };
}

export type ReviewSentiment = 'positive' | 'neutral' | 'negative';

/**
 * Determine review sentiment based on rating
 */
export function getReviewSentiment(rating: number): ReviewSentiment {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

/**
 * Extract service type from review text
 */
export function extractServiceType(reviewText: string): string {
  const text = reviewText.toLowerCase();
  
  if (text.includes('house') || text.includes('home') || text.includes('removal')) {
    return 'house removal';
  }
  if (text.includes('furniture')) {
    return 'furniture transport';
  }
  if (text.includes('office') || text.includes('business')) {
    return 'office relocation';
  }
  if (text.includes('student') || text.includes('university')) {
    return 'student move';
  }
  if (text.includes('same-day') || text.includes('urgent')) {
    return 'same-day delivery';
  }
  if (text.includes('packing')) {
    return 'packing service';
  }
  
  return 'moving service';
}

/**
 * Extract location from review text
 */
export function extractLocation(reviewText: string): string {
  const text = reviewText.toLowerCase();
  
  const locations = [
    'london', 'manchester', 'birmingham', 'glasgow', 'edinburgh',
    'leeds', 'liverpool', 'bristol', 'cardiff', 'belfast',
    'newcastle', 'sheffield', 'nottingham', 'leicester', 'coventry',
  ];
  
  for (const location of locations) {
    if (text.includes(location)) {
      return location.charAt(0).toUpperCase() + location.slice(1);
    }
  }
  
  return 'your area';
}

/**
 * Review response templates
 */
export const REVIEW_RESPONSE_TEMPLATES = {
  positive: [
    {
      template: `Thank you so much for your wonderful review! We're delighted to hear that our team provided excellent service for your {service_type} in {location}. We look forward to helping you again in the future!`,
      keywords: ['wonderful', 'excellent', 'great', 'amazing', 'fantastic'],
    },
    {
      template: `We really appreciate your kind words! It's great to know our {service_type} service met your expectations. Thank you for choosing Speedy Van!`,
      keywords: ['kind', 'appreciate', 'thank', 'good', 'professional'],
    },
    {
      template: `Thank you for the 5-star review! We're thrilled that you had a positive experience with our team. We're always here when you need reliable moving services in {location}.`,
      keywords: ['5-star', '5 star', 'perfect', 'best', 'highly recommend'],
    },
    {
      template: `We're so happy to hear you were satisfied with our {service_type} service! Your feedback means a lot to us. Thank you for trusting Speedy Van with your move.`,
      keywords: ['satisfied', 'happy', 'pleased', 'impressed', 'smooth'],
    },
    {
      template: `Thank you for taking the time to leave such a positive review! We're proud to have provided you with excellent {service_type} service in {location}. We hope to serve you again soon!`,
      keywords: ['positive', 'efficient', 'quick', 'fast', 'reliable'],
    },
  ],
  
  neutral: [
    {
      template: `Thank you for your feedback. We're always working to improve our services. If there's anything specific we could have done better with your {service_type}, please let us know at support@speedy-van.co.uk.`,
      keywords: ['ok', 'okay', 'fine', 'average', 'decent'],
    },
    {
      template: `We appreciate you taking the time to review our {service_type} service. Your feedback helps us improve. Please don't hesitate to reach out if you have any concerns at support@speedy-van.co.uk.`,
      keywords: ['good', 'alright', 'satisfactory', 'acceptable'],
    },
    {
      template: `Thank you for your review. We're glad we could help with your {service_type} in {location}. If you have any suggestions for how we can improve, we'd love to hear them at support@speedy-van.co.uk.`,
      keywords: ['helpful', 'did the job', 'got it done', 'completed'],
    },
  ],
  
  negative: [
    {
      template: `We sincerely apologize for your experience with our {service_type} service. This doesn't meet our standards. Please contact us directly at support@speedy-van.co.uk or call 01202129764 so we can make this right.`,
      keywords: ['disappointed', 'unhappy', 'poor', 'terrible', 'awful', 'worst'],
    },
    {
      template: `Thank you for bringing this to our attention. We take all feedback seriously and would like to resolve this issue with your {service_type}. Please reach out to us directly at support@speedy-van.co.uk so we can discuss how we can improve your experience.`,
      keywords: ['issue', 'problem', 'concern', 'complaint', 'not happy'],
    },
    {
      template: `We're very sorry to hear about your experience in {location}. This is not the level of service we strive for. Please contact our customer service team at support@speedy-van.co.uk or 01202129764 so we can address your concerns immediately.`,
      keywords: ['late', 'damaged', 'rude', 'unprofessional', 'careless'],
    },
    {
      template: `We apologize for falling short of your expectations with our {service_type} service. Your feedback is important to us. Please contact us at support@speedy-van.co.uk so we can make things right and prevent this from happening again.`,
      keywords: ['expected', 'should have', 'could have', 'disappointed', 'let down'],
    },
  ],
};

/**
 * Generate a personalized review response
 */
export function generateReviewResponse(review: Review): string {
  const sentiment = getReviewSentiment(review.rating);
  const serviceType = extractServiceType(review.text);
  const location = extractLocation(review.text);
  
  // Get templates for this sentiment
  const templates = REVIEW_RESPONSE_TEMPLATES[sentiment];
  
  // Find the best matching template based on keywords
  let selectedTemplate = templates[0];
  
  for (const template of templates) {
    const hasKeyword = template.keywords.some(keyword => 
      review.text.toLowerCase().includes(keyword)
    );
    
    if (hasKeyword) {
      selectedTemplate = template;
      break;
    }
  }
  
  // Replace placeholders
  let response = selectedTemplate.template;
  response = response.replace(/{service_type}/g, serviceType);
  response = response.replace(/{location}/g, location);
  
  return response;
}

/**
 * Check if a review needs urgent attention
 */
export function needsUrgentAttention(review: Review): boolean {
  // Negative reviews (1-2 stars) need urgent attention
  if (review.rating <= 2) return true;
  
  // Reviews with certain keywords need urgent attention
  const urgentKeywords = [
    'damaged', 'broken', 'lost', 'stolen', 'rude', 'unprofessional',
    'terrible', 'awful', 'worst', 'never again', 'scam', 'fraud',
  ];
  
  const text = review.text.toLowerCase();
  return urgentKeywords.some(keyword => text.includes(keyword));
}

/**
 * Calculate response time priority
 */
export function getResponsePriority(review: Review): 'urgent' | 'high' | 'normal' {
  if (needsUrgentAttention(review)) return 'urgent';
  if (review.rating <= 3) return 'high';
  return 'normal';
}

/**
 * Get recommended response time in hours
 */
export function getRecommendedResponseTime(review: Review): number {
  const priority = getResponsePriority(review);
  
  switch (priority) {
    case 'urgent':
      return 2; // 2 hours
    case 'high':
      return 6; // 6 hours
    case 'normal':
      return 24; // 24 hours
    default:
      return 24;
  }
}

/**
 * Check if review response is overdue
 */
export function isResponseOverdue(review: Review): boolean {
  if (review.reply) return false; // Already replied
  
  const createTime = new Date(review.createTime);
  const now = new Date();
  const hoursSinceReview = (now.getTime() - createTime.getTime()) / (1000 * 60 * 60);
  
  const recommendedTime = getRecommendedResponseTime(review);
  
  return hoursSinceReview > recommendedTime;
}

/**
 * Review statistics
 */
export interface ReviewStats {
  total: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  responseRate: number;
  averageResponseTime: number;
  pendingReviews: number;
  overdueReviews: number;
}

/**
 * Calculate review statistics
 */
export function calculateReviewStats(reviews: Review[]): ReviewStats {
  const total = reviews.length;
  
  if (total === 0) {
    return {
      total: 0,
      averageRating: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      responseRate: 0,
      averageResponseTime: 0,
      pendingReviews: 0,
      overdueReviews: 0,
    };
  }
  
  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / total;
  
  // Calculate rating distribution
  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };
  
  // Calculate response rate
  const repliedReviews = reviews.filter(r => r.reply).length;
  const responseRate = (repliedReviews / total) * 100;
  
  // Calculate average response time (in hours)
  let totalResponseTime = 0;
  let responseCount = 0;
  
  for (const review of reviews) {
    if (review.reply) {
      const createTime = new Date(review.createTime);
      const replyTime = new Date(review.reply.updateTime);
      const responseTime = (replyTime.getTime() - createTime.getTime()) / (1000 * 60 * 60);
      totalResponseTime += responseTime;
      responseCount++;
    }
  }
  
  const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
  
  // Calculate pending and overdue reviews
  const pendingReviews = reviews.filter(r => !r.reply).length;
  const overdueReviews = reviews.filter(r => isResponseOverdue(r)).length;
  
  return {
    total,
    averageRating,
    ratingDistribution,
    responseRate,
    averageResponseTime,
    pendingReviews,
    overdueReviews,
  };
}

/**
 * Get review management recommendations
 */
export function getReviewManagementRecommendations(stats: ReviewStats): string[] {
  const recommendations: string[] = [];
  
  if (stats.responseRate < 80) {
    recommendations.push('Increase review response rate to at least 80% for better engagement');
  }
  
  if (stats.averageResponseTime > 24) {
    recommendations.push('Reduce average response time to under 24 hours');
  }
  
  if (stats.overdueReviews > 0) {
    recommendations.push(`Respond to ${stats.overdueReviews} overdue review(s) immediately`);
  }
  
  if (stats.averageRating < 4.5) {
    recommendations.push('Focus on improving service quality to increase average rating');
  }
  
  if (stats.ratingDistribution[1] + stats.ratingDistribution[2] > stats.total * 0.1) {
    recommendations.push('Address negative reviews promptly and implement service improvements');
  }
  
  return recommendations;
}

export default {
  getReviewSentiment,
  extractServiceType,
  extractLocation,
  generateReviewResponse,
  needsUrgentAttention,
  getResponsePriority,
  getRecommendedResponseTime,
  isResponseOverdue,
  calculateReviewStats,
  getReviewManagementRecommendations,
};

