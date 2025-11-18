/**
 * Catalog Items Data Parser
 * Reads from catalog.txt and provides search functionality
 */

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  searchTerms: string;
  volume: number;
  requiresTwo: boolean;
  fragile: boolean;
  highValue: boolean;
  weight: number;
}

// Parse catalog.txt format: id,name,category,"search terms",volume,requiresTwo,fragile,highValue,weight
export const CATALOG_ITEMS: CatalogItem[] = [
  {"id":"weight-rack","name":"Weight Rack","category":"fitness","searchTerms":"squat rack, weight stand","volume":1.2,"requiresTwo":true,"fragile":false,"highValue":false,"weight":40},
  {"id":"ab-machine","name":"Abdominal Machine","category":"fitness","searchTerms":"ab roller, crunch machine","volume":0.6,"requiresTwo":false,"fragile":false,"highValue":false,"weight":25},
  {"id":"leg-press-machine","name":"Leg Press Machine","category":"fitness","searchTerms":"leg press, gym legs","volume":2.2,"requiresTwo":true,"fragile":false,"highValue":true,"weight":90},
  {"id":"cable-crossover-machine","name":"Cable Crossover Machine","category":"fitness","searchTerms":"cable machine, pulley system","volume":3.0,"requiresTwo":true,"fragile":false,"highValue":true,"weight":150},
  {"id":"smith-machine","name":"Smith Machine","category":"fitness","searchTerms":"guided barbell, smith rack","volume":2.8,"requiresTwo":true,"fragile":false,"highValue":true,"weight":140},
  {"id":"dip-bar","name":"Dip Bar","category":"fitness","searchTerms":"parallel bars, dip station","volume":0.5,"requiresTwo":false,"fragile":false,"highValue":false,"weight":20},
  {"id":"plyo-box","name":"Plyometric Box","category":"fitness","searchTerms":"jump box, workout box","volume":0.4,"requiresTwo":false,"fragile":false,"highValue":false,"weight":18},
  {"id":"heart-rate-monitor","name":"Heart Rate Monitor","category":"fitness","searchTerms":"chest strap, pulse monitor","volume":0.1,"requiresTwo":false,"fragile":false,"highValue":false,"weight":6},
  {"id":"fitness-tracker","name":"Fitness Tracker","category":"fitness","searchTerms":"activity tracker, smartwatch","volume":0.1,"requiresTwo":false,"fragile":true,"highValue":false,"weight":5},
  {"id":"gym-mat-large","name":"Large Gym Mat","category":"fitness","searchTerms":"exercise mat, tumbling mat","volume":0.6,"requiresTwo":false,"fragile":false,"highValue":false,"weight":20},
  {"id":"boxing-gloves","name":"Boxing Gloves Set","category":"fitness","searchTerms":"punching gloves, sparring","volume":0.2,"requiresTwo":false,"fragile":false,"highValue":false,"weight":10},
  {"id":"speed-bag","name":"Speed Bag","category":"fitness","searchTerms":"boxing speed ball","volume":0.3,"requiresTwo":false,"fragile":false,"highValue":false,"weight":15},
  {"id":"medicine-ball","name":"Medicine Ball","category":"fitness","searchTerms":"workout ball, fitness ball","volume":0.2,"requiresTwo":false,"fragile":false,"highValue":false,"weight":12},
  {"id":"foam-roller","name":"Foam Roller","category":"fitness","searchTerms":"muscle roller, recovery","volume":0.2,"requiresTwo":false,"fragile":false,"highValue":false,"weight":8},
  {"id":"yoga-block","name":"Yoga Block","category":"fitness","searchTerms":"yoga brick, support block","volume":0.1,"requiresTwo":false,"fragile":false,"highValue":false,"weight":4},
  {"id":"office-chair","name":"Office Chair","category":"office","searchTerms":"desk chair, swivel chair, computer chair","volume":0.6,"requiresTwo":false,"fragile":false,"highValue":false,"weight":18},
  {"id":"boardroom-chair","name":"Boardroom Chair","category":"office","searchTerms":"meeting chair, conference chair","volume":0.4,"requiresTwo":false,"fragile":false,"highValue":false,"weight":14},
  {"id":"reception-desk","name":"Reception Desk","category":"office","searchTerms":"office reception, front desk","volume":2.0,"requiresTwo":true,"fragile":false,"highValue":true,"weight":65},
  {"id":"filing-cabinet-4drawer","name":"4-Drawer Filing Cabinet","category":"office","searchTerms":"office filing, document storage","volume":1.0,"requiresTwo":true,"fragile":false,"highValue":false,"weight":32},
  {"id":"box-small","name":"Box - Small","category":"boxes","searchTerms":"small box, box, cardboard box","volume":0.2,"requiresTwo":false,"fragile":false,"highValue":false,"weight":4},
  {"id":"box-medium","name":"Box - Medium","category":"boxes","searchTerms":"medium box, packing box","volume":0.2,"requiresTwo":false,"fragile":false,"highValue":false,"weight":4},
  {"id":"box-large","name":"Box - Large","category":"boxes","searchTerms":"large box, suitcase, storage box","volume":0.4,"requiresTwo":false,"fragile":false,"highValue":false,"weight":9},
];

/**
 * Smart Search Engine - Advanced catalog search with relevance scoring
 * Features:
 * - Fuzzy matching for typos
 * - Synonym support
 * - Partial word matching
 * - Relevance scoring
 * - Multi-word query support
 */

// Common synonyms and variations
const SYNONYMS: Record<string, string[]> = {
  'sofa': ['couch', 'settee', 'divan', 'lounger'],
  'couch': ['sofa', 'settee'],
  'tv': ['television', 'telly', 'screen'],
  'fridge': ['refrigerator', 'freezer', 'cooler'],
  'desk': ['table', 'workstation', 'bureau'],
  'chair': ['seat', 'stool'],
  'bed': ['mattress', 'cot', 'bunk'],
  'wardrobe': ['closet', 'armoire', 'cupboard'],
  'drawer': ['chest', 'dresser', 'cabinet'],
  'lamp': ['light', 'lighting', 'fixture'],
  'box': ['container', 'crate', 'storage'],
  'table': ['desk', 'surface'],
  'mirror': ['glass', 'looking glass'],
  'curtain': ['drape', 'blind'],
  'rug': ['carpet', 'mat'],
  'shelf': ['shelving', 'bookcase', 'rack'],
  'bike': ['bicycle', 'cycle'],
  'computer': ['pc', 'laptop', 'desktop'],
  'phone': ['telephone', 'mobile'],
  'gym': ['fitness', 'exercise', 'workout'],
  'kitchen': ['cook', 'cooking'],
  'bathroom': ['bath', 'toilet', 'wc', 'loo'],
};

// Expand query with synonyms
function expandQueryWithSynonyms(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const expanded = new Set<string>([query.toLowerCase()]);
  
  words.forEach(word => {
    // Add the word itself
    expanded.add(word);
    
    // Add synonyms
    Object.entries(SYNONYMS).forEach(([key, synonyms]) => {
      if (key === word || synonyms.includes(word)) {
        expanded.add(key);
        synonyms.forEach(syn => expanded.add(syn));
      }
    });
  });
  
  return Array.from(expanded);
}

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

// Calculate relevance score for an item
function calculateRelevance(item: CatalogItem, queryTerms: string[], originalQuery: string): number {
  let score = 0;
  const itemName = item.name.toLowerCase();
  const itemCategory = item.category.toLowerCase();
  const itemSearchTerms = item.searchTerms.toLowerCase();
  const itemId = item.id.toLowerCase();
  const originalQueryLower = originalQuery.toLowerCase();
  
  // Exact match in name (highest priority)
  if (itemName === originalQueryLower) {
    score += 1000;
  }
  
  // Exact match in any field
  if (itemName.includes(originalQueryLower)) {
    score += 500;
  }
  if (itemSearchTerms.includes(originalQueryLower)) {
    score += 400;
  }
  if (itemCategory.includes(originalQueryLower)) {
    score += 300;
  }
  if (itemId.includes(originalQueryLower)) {
    score += 200;
  }
  
  // Check each query term
  queryTerms.forEach(term => {
    // Exact word match
    const nameWords = itemName.split(/\s+/);
    const searchWords = itemSearchTerms.split(/[,\s]+/);
    
    if (nameWords.includes(term)) {
      score += 100;
    }
    if (searchWords.includes(term)) {
      score += 80;
    }
    if (itemCategory === term) {
      score += 70;
    }
    
    // Partial match
    if (itemName.includes(term)) {
      score += 50;
    }
    if (itemSearchTerms.includes(term)) {
      score += 40;
    }
    if (itemCategory.includes(term)) {
      score += 30;
    }
    
    // Fuzzy match (for typos)
    nameWords.forEach(word => {
      if (word.length > 3 && term.length > 3) {
        const distance = levenshteinDistance(word, term);
        const maxLen = Math.max(word.length, term.length);
        if (distance <= 2 && distance / maxLen < 0.3) {
          score += 20 - (distance * 5);
        }
      }
    });
    
    // Starts with (important for partial typing)
    if (itemName.startsWith(term)) {
      score += 60;
    }
    if (itemSearchTerms.split(/[,\s]+/).some(w => w.startsWith(term))) {
      score += 50;
    }
  });
  
  return score;
}

// Smart search with relevance scoring
export function searchCatalogItems(query: string): CatalogItem[] {
  if (!query.trim()) return CATALOG_ITEMS;
  
  // Expand query with synonyms
  const expandedTerms = expandQueryWithSynonyms(query);
  
  // Score all items
  const scoredItems = CATALOG_ITEMS.map(item => ({
    item,
    score: calculateRelevance(item, expandedTerms, query)
  }));
  
  // Filter items with score > 0 and sort by score
  const results = scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
  
  return results;
}

// Get items by category
export function getCatalogItemsByCategory(category: string): CatalogItem[] {
  return CATALOG_ITEMS.filter(item => 
    item.category.toLowerCase() === category.toLowerCase()
  );
}

// Get all categories
export function getCatalogCategories(): string[] {
  const categories = new Set(CATALOG_ITEMS.map(item => item.category));
  return Array.from(categories);
}

// Map catalog categories to rooms
export function mapCategoryToRoom(category: string): string {
  const mapping: Record<string, string> = {
    'fitness': 'office',
    'office': 'office',
    'boxes': 'boxes',
    'lighting': 'living',
    'flooring': 'living',
    'soft-furnishing': 'bedroom',
    'kitchen': 'kitchen',
  };
  
  return mapping[category.toLowerCase()] || 'boxes';
}
