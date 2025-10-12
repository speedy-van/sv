/**
 * Google Ads Configuration
 * 
 * Negative keywords and optimization settings for Google Ads campaigns
 * to reduce irrelevant clicks and lower cost-per-click (CPC)
 */

export const NEGATIVE_KEYWORDS = {
  // Job-Related Keywords
  jobs: [
    'jobs',
    'employment',
    'careers',
    'driver jobs',
    'van driver jobs',
    'delivery driver jobs',
    'hiring',
    'recruit',
    'recruitment',
    'apply',
    'cv',
    'resume',
    'work for',
    'join our team',
    'vacancy',
    'vacancies',
  ],
  
  // Van Sales/Rental Keywords
  vanSales: [
    'cheap van hire',
    'used van',
    'van for sale',
    'van rental',
    'self drive',
    'DIY moving',
    'van lease',
    'hire purchase',
    'van finance',
    'second hand',
    'buy van',
    'sell van',
    'van dealer',
    'van showroom',
    'commercial vehicle sales',
    'new van',
    'van auction',
  ],
  
  // Repair/Maintenance Keywords
  maintenance: [
    'scrap van',
    'van parts',
    'mechanic',
    'repair',
    'garage',
    'MOT',
    'service',
    'maintenance',
    'breakdown',
    'recovery',
    'tow',
    'towing',
    'salvage',
    'spare parts',
    'engine',
    'transmission',
    'bodywork',
    'respray',
  ],
  
  // Free/Low-Value Keywords
  lowValue: [
    'free',
    'free quote',
    'free estimate',
    'free service',
    'cheap',
    'cheapest',
    'budget',
    'discount',
    'bargain',
    'free delivery',
    'no charge',
  ],
  
  // Competitor Brand Names
  competitors: [
    'anyvan',
    'man with a van',
    'shiply',
    'compare the man',
    'fantastic services',
    'taskrabbit',
    'airtasker',
  ],
  
  // Unrelated Services
  unrelated: [
    'taxi',
    'cab',
    'uber',
    'lyft',
    'passenger transport',
    'airport transfer',
    'wedding car',
    'limo',
    'limousine',
    'chauffeur',
    'minicab',
    'private hire',
  ],
  
  // DIY/Self-Service
  diy: [
    'do it yourself',
    'DIY',
    'self service',
    'self move',
    'rent a van',
    'hire a van',
    'van hire',
    'self storage',
  ],
  
  // Insurance/Legal
  legal: [
    'insurance',
    'claim',
    'compensation',
    'legal',
    'solicitor',
    'lawyer',
    'sue',
    'complaint',
    'claims',
  ],
  
  // Education/Training
  education: [
    'course',
    'training',
    'learn',
    'study',
    'school',
    'college',
    'university',
    'lesson',
    'tutorial',
    'certification',
  ],
  
  // Other Irrelevant Terms
  other: [
    'volunteer',
    'charity',
    'donation',
    'sponsor',
    'grant',
    'funding',
    'investment',
    'franchise',
    'business opportunity',
    'wholesale',
    'trade',
  ],
};

/**
 * Get all negative keywords as a flat array
 */
export function getAllNegativeKeywords(): string[] {
  return Object.values(NEGATIVE_KEYWORDS).flat();
}

/**
 * Get negative keywords by category
 */
export function getNegativeKeywordsByCategory(category: keyof typeof NEGATIVE_KEYWORDS): string[] {
  return NEGATIVE_KEYWORDS[category];
}

/**
 * Export negative keywords in Google Ads format (one per line)
 */
export function exportNegativeKeywordsForGoogleAds(): string {
  const allKeywords = getAllNegativeKeywords();
  return allKeywords.map(keyword => `"${keyword}"`).join('\n');
}

/**
 * Campaign optimization settings
 */
export const CAMPAIGN_SETTINGS = {
  // Target locations
  targetLocations: [
    'United Kingdom',
    'England',
    'Scotland',
    'Wales',
    'Northern Ireland',
  ],
  
  // Target cities (high-value)
  targetCities: [
    'London',
    'Manchester',
    'Birmingham',
    'Glasgow',
    'Edinburgh',
    'Leeds',
    'Liverpool',
    'Bristol',
    'Cardiff',
    'Belfast',
  ],
  
  // Target keywords (positive)
  targetKeywords: [
    'man and van',
    'house removals',
    'furniture delivery',
    'moving service',
    'same day delivery',
    'office relocation',
    'student moves',
    'furniture transport',
    'professional movers',
    'removal company',
  ],
  
  // Bid adjustments
  bidAdjustments: {
    mobile: 1.2, // 20% increase for mobile
    desktop: 1.0, // No adjustment
    tablet: 1.1, // 10% increase for tablet
    
    // Time of day
    weekdayMorning: 1.3, // 30% increase (7am-12pm weekdays)
    weekdayAfternoon: 1.2, // 20% increase (12pm-6pm weekdays)
    weekdayEvening: 1.0, // No adjustment (6pm-10pm weekdays)
    weekend: 1.1, // 10% increase (all day weekends)
    
    // Location
    london: 1.3, // 30% increase for London
    majorCities: 1.2, // 20% increase for major cities
    otherAreas: 1.0, // No adjustment for other areas
  },
  
  // Quality Score optimization
  qualityScoreTargets: {
    expectedCTR: 'Above average',
    adRelevance: 'Above average',
    landingPageExperience: 'Above average',
    minQualityScore: 7,
  },
  
  // Budget allocation
  budgetAllocation: {
    searchCampaigns: 0.7, // 70% to search campaigns
    displayCampaigns: 0.15, // 15% to display campaigns
    remarketing: 0.15, // 15% to remarketing
  },
};

/**
 * Ad copy templates optimized for Quality Score
 */
export const AD_COPY_TEMPLATES = [
  {
    headline1: 'Man and Van {City}',
    headline2: 'From £25/Hour | Book Online',
    headline3: 'Fully Insured | Same-Day',
    description1: 'Professional moving services in {City}. Instant quotes, online booking, and 24/7 support. Fully insured drivers.',
    description2: '50,000+ happy customers. 95% on-time delivery. Book your move today.',
    path1: 'moving',
    path2: '{city}',
  },
  {
    headline1: 'House Removals {City}',
    headline2: 'Professional Movers | £50+',
    headline3: 'Book Online | Free Quote',
    description1: 'Reliable house removal services in {City}. Experienced team, competitive prices, and excellent service.',
    description2: 'Same-day service available. Fully insured. Get your free quote online now.',
    path1: 'removals',
    path2: '{city}',
  },
  {
    headline1: 'Furniture Delivery {City}',
    headline2: 'Same-Day Service Available',
    headline3: 'From £25/Hour | Insured',
    description1: 'Fast furniture delivery across {City}. Professional handling, real-time tracking, and competitive rates.',
    description2: 'Book online in minutes. 24/7 customer support. Trusted by 50,000+ customers.',
    path1: 'furniture',
    path2: '{city}',
  },
];

/**
 * Landing page recommendations
 */
export const LANDING_PAGE_RECOMMENDATIONS = {
  // Key elements for high Quality Score
  elements: [
    'Clear headline matching ad copy',
    'Prominent call-to-action (Book Now)',
    'Trust signals (reviews, insurance, certifications)',
    'Mobile-optimized design',
    'Fast loading speed (<3 seconds)',
    'Easy navigation',
    'Contact information visible',
    'Service area clearly stated',
    'Pricing information transparent',
    'Customer testimonials',
  ],
  
  // Recommended landing pages for different campaigns
  pages: {
    general: '/booking',
    manAndVan: '/services/man-and-van',
    houseRemovals: '/services/house-removals',
    furnitureDelivery: '/services/furniture-delivery',
    studentMoves: '/services/student-moves',
    officeRelocation: '/services/office-relocation',
    
    // City-specific pages
    cityPages: '/areas/{city-slug}',
  },
};

/**
 * Conversion tracking events
 */
export const CONVERSION_EVENTS = {
  bookingCompleted: {
    name: 'Booking Completed',
    value: 50, // Average booking value
    currency: 'GBP',
  },
  quoteRequested: {
    name: 'Quote Requested',
    value: 25, // Estimated value
    currency: 'GBP',
  },
  phoneCall: {
    name: 'Phone Call',
    value: 30, // Estimated value
    currency: 'GBP',
  },
  chatInitiated: {
    name: 'Chat Initiated',
    value: 15, // Estimated value
    currency: 'GBP',
  },
};

/**
 * Performance monitoring thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  ctr: {
    min: 0.05, // 5% minimum CTR
    target: 0.08, // 8% target CTR
    excellent: 0.12, // 12% excellent CTR
  },
  cpc: {
    max: 3.0, // £3.00 maximum CPC
    target: 2.0, // £2.00 target CPC
    excellent: 1.5, // £1.50 excellent CPC
  },
  conversionRate: {
    min: 0.03, // 3% minimum conversion rate
    target: 0.05, // 5% target conversion rate
    excellent: 0.08, // 8% excellent conversion rate
  },
  qualityScore: {
    min: 6,
    target: 8,
    excellent: 10,
  },
  roas: {
    min: 2.0, // 2:1 minimum ROAS
    target: 4.0, // 4:1 target ROAS
    excellent: 6.0, // 6:1 excellent ROAS
  },
};

export default {
  NEGATIVE_KEYWORDS,
  getAllNegativeKeywords,
  getNegativeKeywordsByCategory,
  exportNegativeKeywordsForGoogleAds,
  CAMPAIGN_SETTINGS,
  AD_COPY_TEMPLATES,
  LANDING_PAGE_RECOMMENDATIONS,
  CONVERSION_EVENTS,
  PERFORMANCE_THRESHOLDS,
};

