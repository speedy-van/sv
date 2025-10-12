/**
 * Comprehensive Keyword Generator
 * 
 * Generates 1000+ unique keywords per city for maximum SEO coverage
 * Based on enterprise SEO strategies from major companies
 */

import { UKCity } from '@/data/uk-cities';

// Service Types (50+)
const SERVICES = [
  'furniture delivery',
  'furniture removal',
  'furniture moving',
  'furniture transport',
  'sofa delivery',
  'couch delivery',
  'bed delivery',
  'mattress delivery',
  'wardrobe delivery',
  'table delivery',
  'chair delivery',
  'desk delivery',
  'cabinet delivery',
  'bookshelf delivery',
  'dresser delivery',
  'appliance delivery',
  'fridge delivery',
  'freezer delivery',
  'washing machine delivery',
  'dryer delivery',
  'dishwasher delivery',
  'oven delivery',
  'cooker delivery',
  'TV delivery',
  'television delivery',
  'piano moving',
  'piano delivery',
  'antique furniture moving',
  'vintage furniture delivery',
  'office furniture delivery',
  'office desk delivery',
  'filing cabinet delivery',
  'garden furniture delivery',
  'outdoor furniture delivery',
  'gym equipment delivery',
  'treadmill delivery',
  'exercise bike delivery',
  'pool table moving',
  'snooker table moving',
  'safe moving',
  'heavy item delivery',
  'bulky item delivery',
  'large item delivery',
  'parcel delivery',
  'package delivery',
  'box delivery',
  'pallet delivery',
  'ebay delivery',
  'facebook marketplace delivery',
  'gumtree delivery',
  'ikea delivery',
  'argos delivery',
];

// Service Modifiers (40+)
const SERVICE_MODIFIERS = [
  'same day',
  'next day',
  'urgent',
  'express',
  'fast',
  'quick',
  'cheap',
  'affordable',
  'budget',
  'low cost',
  'best price',
  'premium',
  'luxury',
  'professional',
  'reliable',
  'trusted',
  'local',
  'nearby',
  'near me',
  'emergency',
  '24 hour',
  '24/7',
  'weekend',
  'evening',
  'night',
  'early morning',
  'student',
  'house',
  'flat',
  'apartment',
  'office',
  'business',
  'commercial',
  'residential',
  'single item',
  'two man',
  'one man',
  'insured',
  'licensed',
  'tracked',
  'eco friendly',
];

// Vehicle Types (25+)
const VEHICLES = [
  'man and van',
  'man with van',
  'van hire',
  'van rental',
  'van service',
  'van delivery',
  'large van',
  'small van',
  'medium van',
  'luton van',
  'transit van',
  'sprinter van',
  'long wheel base van',
  'short wheel base van',
  'box van',
  'tail lift van',
  'removal van',
  'courier van',
  'delivery van',
  'cargo van',
  'panel van',
  'minibus',
  'truck',
  'lorry',
  '3.5 tonne van',
];

// Action Words (20+)
const ACTIONS = [
  'hire',
  'book',
  'rent',
  'get',
  'find',
  'need',
  'looking for',
  'search',
  'quote',
  'price',
  'cost',
  'compare',
  'best',
  'top',
  'recommended',
  'reviews',
  'cheap',
  'affordable',
  'near me',
  'local',
];

// Moving Types (15+)
const MOVING_TYPES = [
  'house moving',
  'house removal',
  'home moving',
  'flat moving',
  'apartment moving',
  'office moving',
  'office relocation',
  'student moving',
  'student removal',
  'house clearance',
  'flat clearance',
  'rubbish removal',
  'waste removal',
  'junk removal',
  'furniture disposal',
];

// Specific Items (30+)
const SPECIFIC_ITEMS = [
  'sofa',
  'couch',
  'settee',
  'bed',
  'mattress',
  'wardrobe',
  'table',
  'dining table',
  'coffee table',
  'desk',
  'chair',
  'armchair',
  'cabinet',
  'bookshelf',
  'dresser',
  'chest of drawers',
  'fridge',
  'freezer',
  'washing machine',
  'dryer',
  'dishwasher',
  'oven',
  'cooker',
  'TV',
  'piano',
  'treadmill',
  'bike',
  'pool table',
  'safe',
  'mirror',
];

// Questions (20+)
const QUESTIONS = [
  'how much',
  'how to',
  'where to find',
  'best way to',
  'cheapest way to',
  'fastest way to',
  'can i',
  'do i need',
  'what is',
  'which',
  'who does',
  'when to',
  'why use',
  'is it worth',
  'should i',
  'how long',
  'how far',
  'what size',
  'how many',
  'what type',
];

interface KeywordData {
  keyword: string;
  searchIntent: 'informational' | 'navigational' | 'transactional' | 'commercial';
  difficulty: 'low' | 'medium' | 'high';
  priority: number; // 1-10
  category: string;
}

/**
 * Generate comprehensive keywords for a city
 */
export function generateCityKeywords(city: UKCity): KeywordData[] {
  const keywords: KeywordData[] = [];
  const cityName = city.name.toLowerCase();
  const citySlug = city.slug;

  // 1. Service + City (50 keywords)
  SERVICES.forEach((service) => {
    keywords.push({
      keyword: `${service} ${cityName}`,
      searchIntent: 'transactional',
      difficulty: 'medium',
      priority: 9,
      category: 'service',
    });
  });

  // 2. Service + Modifier + City (2000+ keywords)
  SERVICES.forEach((service) => {
    SERVICE_MODIFIERS.forEach((modifier) => {
      keywords.push({
        keyword: `${modifier} ${service} ${cityName}`,
        searchIntent: 'transactional',
        difficulty: 'low',
        priority: 8,
        category: 'service-modified',
      });
    });
  });

  // 3. Vehicle + City (25 keywords)
  VEHICLES.forEach((vehicle) => {
    keywords.push({
      keyword: `${vehicle} ${cityName}`,
      searchIntent: 'transactional',
      difficulty: 'high',
      priority: 10,
      category: 'vehicle',
    });
  });

  // 4. Vehicle + Service + City (1250+ keywords)
  VEHICLES.forEach((vehicle) => {
    SERVICES.slice(0, 10).forEach((service) => {
      keywords.push({
        keyword: `${vehicle} for ${service} ${cityName}`,
        searchIntent: 'transactional',
        difficulty: 'low',
        priority: 7,
        category: 'vehicle-service',
      });
    });
  });

  // 5. Action + Vehicle + City (500 keywords)
  ACTIONS.forEach((action) => {
    VEHICLES.forEach((vehicle) => {
      keywords.push({
        keyword: `${action} ${vehicle} ${cityName}`,
        searchIntent: 'transactional',
        difficulty: 'medium',
        priority: 8,
        category: 'action-vehicle',
      });
    });
  });

  // 6. Moving Types + City (15 keywords)
  MOVING_TYPES.forEach((movingType) => {
    keywords.push({
      keyword: `${movingType} ${cityName}`,
      searchIntent: 'transactional',
      difficulty: 'medium',
      priority: 9,
      category: 'moving',
    });
  });

  // 7. Specific Item + Delivery + City (30 keywords)
  SPECIFIC_ITEMS.forEach((item) => {
    keywords.push({
      keyword: `${item} delivery ${cityName}`,
      searchIntent: 'transactional',
      difficulty: 'low',
      priority: 7,
      category: 'item-delivery',
    });
  });

  // 8. Specific Item + Moving + City (30 keywords)
  SPECIFIC_ITEMS.forEach((item) => {
    keywords.push({
      keyword: `${item} moving ${cityName}`,
      searchIntent: 'transactional',
      difficulty: 'low',
      priority: 7,
      category: 'item-moving',
    });
  });

  // 9. Question-based Keywords (400+ keywords)
  QUESTIONS.forEach((question) => {
    SERVICES.slice(0, 20).forEach((service) => {
      keywords.push({
        keyword: `${question} ${service} ${cityName}`,
        searchIntent: 'informational',
        difficulty: 'low',
        priority: 6,
        category: 'question',
      });
    });
  });

  // 10. Postcode-based Keywords (if available)
  if (city.postcode) {
    SERVICES.slice(0, 20).forEach((service) => {
      keywords.push({
        keyword: `${service} ${city.postcode}`,
        searchIntent: 'transactional',
        difficulty: 'low',
        priority: 8,
        category: 'postcode',
      });
    });
  }

  // 11. Near Me Keywords (50 keywords)
  [...SERVICES.slice(0, 25), ...VEHICLES.slice(0, 25)].forEach((term) => {
    keywords.push({
      keyword: `${term} near ${cityName}`,
      searchIntent: 'transactional',
      difficulty: 'medium',
      priority: 9,
      category: 'near-me',
    });
  });

  // 12. Comparison Keywords (100 keywords)
  const comparisons = ['best', 'top', 'cheapest', 'fastest', 'most reliable'];
  comparisons.forEach((comparison) => {
    SERVICES.slice(0, 20).forEach((service) => {
      keywords.push({
        keyword: `${comparison} ${service} ${cityName}`,
        searchIntent: 'commercial',
        difficulty: 'high',
        priority: 8,
        category: 'comparison',
      });
    });
  });

  // 13. Review Keywords (50 keywords)
  const reviewTerms = ['reviews', 'ratings', 'testimonials', 'feedback', 'recommendations'];
  reviewTerms.forEach((term) => {
    [...SERVICES.slice(0, 5), ...VEHICLES.slice(0, 5)].forEach((service) => {
      keywords.push({
        keyword: `${service} ${term} ${cityName}`,
        searchIntent: 'informational',
        difficulty: 'low',
        priority: 6,
        category: 'review',
      });
    });
  });

  // 14. Price Keywords (100 keywords)
  const priceTerms = ['price', 'cost', 'quote', 'estimate', 'rates'];
  priceTerms.forEach((term) => {
    SERVICES.slice(0, 20).forEach((service) => {
      keywords.push({
        keyword: `${service} ${term} ${cityName}`,
        searchIntent: 'commercial',
        difficulty: 'medium',
        priority: 8,
        category: 'price',
      });
    });
  });

  // 15. Time-based Keywords (200 keywords)
  const times = ['today', 'tonight', 'tomorrow', 'this weekend', 'next week'];
  times.forEach((time) => {
    SERVICES.slice(0, 40).forEach((service) => {
      keywords.push({
        keyword: `${service} ${time} ${cityName}`,
        searchIntent: 'transactional',
        difficulty: 'low',
        priority: 7,
        category: 'time-based',
      });
    });
  });

  return keywords;
}

/**
 * Get top priority keywords for a city
 */
export function getTopKeywords(city: UKCity, limit: number = 100): KeywordData[] {
  const allKeywords = generateCityKeywords(city);
  return allKeywords
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

/**
 * Get keywords by category
 */
export function getKeywordsByCategory(
  city: UKCity,
  category: string
): KeywordData[] {
  const allKeywords = generateCityKeywords(city);
  return allKeywords.filter((kw) => kw.category === category);
}

/**
 * Get keywords by search intent
 */
export function getKeywordsByIntent(
  city: UKCity,
  intent: KeywordData['searchIntent']
): KeywordData[] {
  const allKeywords = generateCityKeywords(city);
  return allKeywords.filter((kw) => kw.searchIntent === intent);
}

/**
 * Export keywords to CSV format
 */
export function exportKeywordsToCSV(city: UKCity): string {
  const keywords = generateCityKeywords(city);
  const header = 'Keyword,Search Intent,Difficulty,Priority,Category\n';
  const rows = keywords.map(
    (kw) =>
      `"${kw.keyword}",${kw.searchIntent},${kw.difficulty},${kw.priority},${kw.category}`
  );
  return header + rows.join('\n');
}

/**
 * Get keyword statistics
 */
export function getKeywordStats(city: UKCity) {
  const keywords = generateCityKeywords(city);
  
  return {
    total: keywords.length,
    byIntent: {
      transactional: keywords.filter((kw) => kw.searchIntent === 'transactional').length,
      informational: keywords.filter((kw) => kw.searchIntent === 'informational').length,
      commercial: keywords.filter((kw) => kw.searchIntent === 'commercial').length,
      navigational: keywords.filter((kw) => kw.searchIntent === 'navigational').length,
    },
    byDifficulty: {
      low: keywords.filter((kw) => kw.difficulty === 'low').length,
      medium: keywords.filter((kw) => kw.difficulty === 'medium').length,
      high: keywords.filter((kw) => kw.difficulty === 'high').length,
    },
    byCategory: keywords.reduce((acc, kw) => {
      acc[kw.category] = (acc[kw.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    highPriority: keywords.filter((kw) => kw.priority >= 8).length,
  };
}

export default {
  generateCityKeywords,
  getTopKeywords,
  getKeywordsByCategory,
  getKeywordsByIntent,
  exportKeywordsToCSV,
  getKeywordStats,
};

