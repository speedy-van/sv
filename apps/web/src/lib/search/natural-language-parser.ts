/**
 * Natural Language Processing for Item Extraction
 * Parses natural language text to extract items and quantities
 */

import { COMPREHENSIVE_CATALOG, type CatalogItem } from '../pricing/catalog-dataset';

export interface ParsedItem {
  item: CatalogItem;
  quantity: number;
  confidence: number;
  matchedText: string;
  position: number;
}

export interface ParseResult {
  items: ParsedItem[];
  totalConfidence: number;
  originalText: string;
  processedText: string;
}

class NaturalLanguageParser {
  private itemPatterns: Map<string, CatalogItem[]> = new Map();
  private quantityPatterns: RegExp[] = [];
  private synonyms: Map<string, string[]> = new Map();
  private sizeModifiers: Map<string, string> = new Map();

  constructor() {
    this.buildItemPatterns();
    this.buildQuantityPatterns();
    this.buildSynonyms();
    this.buildSizeModifiers();
  }

  // Build patterns for item recognition
  private buildItemPatterns() {
    COMPREHENSIVE_CATALOG.forEach(item => {
      const patterns = new Set<string>();
      
      // Add main name
      const mainName = item.name.toLowerCase();
      patterns.add(mainName);
      
      // Add keywords
      item.keywords.forEach(keyword => {
        const cleaned = keyword.trim().toLowerCase();
        if (cleaned.length > 2) {
          patterns.add(cleaned);
        }
      });
      
      // Add variations
      patterns.add(mainName.replace(/s$/, '')); // Remove plural s
      patterns.add(mainName + 's'); // Add plural s
      
      // Add common variations for specific items
      if (mainName.includes('sofa')) {
        patterns.add('couch');
        patterns.add('settee');
        patterns.add('loveseat');
      }
      if (mainName.includes('chair')) {
        patterns.add('seat');
        patterns.add('seating');
      }
      if (mainName.includes('table')) {
        patterns.add('desk');
        patterns.add('surface');
      }
      if (mainName.includes('bed') || mainName.includes('mattress')) {
        patterns.add('mattress');
        patterns.add('bed');
        patterns.add('bedframe');
      }
      if (mainName.includes('refrigerator') || mainName.includes('fridge')) {
        patterns.add('fridge');
        patterns.add('refrigerator');
        patterns.add('freezer');
      }
      if (mainName.includes('washing machine')) {
        patterns.add('washer');
        patterns.add('laundry machine');
      }
      if (mainName.includes('box')) {
        patterns.add('container');
        patterns.add('boxes');
        patterns.add('storage');
        patterns.add('bin');
      }
      
      patterns.forEach(pattern => {
        if (!this.itemPatterns.has(pattern)) {
          this.itemPatterns.set(pattern, []);
        }
        this.itemPatterns.get(pattern)!.push(item);
      });
    });
  }

  // Build quantity detection patterns
  private buildQuantityPatterns() {
    this.quantityPatterns = [
      // Numbers with words
      /(\d+)\s*(piece|pieces|item|items|of|x|\*)/gi,
      // Written numbers
      /(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(piece|pieces|item|items|of|x|\*)?/gi,
      // Standalone numbers before items
      /(\d+)\s*(?=\w)/g,
      // Numbers after "have" or "got"
      /(have|got|need|want)\s*(\d+)/gi,
      // Size + quantity patterns
      /(single|double|triple|king\s*size|queen\s*size|twin)\s*(\d+)?/gi,
      // Specific item quantity patterns
      /(\d+)\s*(seats?|chairs?|sofas?|tables?|beds?|mattresses?|boxes?|fridges?|washers?)/gi,
      // Complex patterns
      /(\d+)\s*(seats?\s+sofa|chairs?|tables?|beds?|mattresses?)/gi,
    ];
  }

  // Build synonyms for better matching
  private buildSynonyms() {
    this.synonyms.set('sofa', ['couch', 'settee', 'loveseat', 'sectional']);
    this.synonyms.set('chair', ['seat', 'seating', 'chairs']);
    this.synonyms.set('table', ['desk', 'surface', 'tables']);
    this.synonyms.set('bed', ['mattress', 'beds', 'bedframe']);
    this.synonyms.set('tv', ['television', 'screen', 'monitor']);
    this.synonyms.set('fridge', ['refrigerator', 'freezer', 'icebox']);
    this.synonyms.set('washing machine', ['washer', 'laundry machine']);
    this.synonyms.set('box', ['container', 'boxes', 'storage', 'bin']);
    this.synonyms.set('wardrobe', ['closet', 'cupboard', 'armoire']);
    this.synonyms.set('bookshelf', ['bookcase', 'shelf', 'shelving']);
  }

  // Build size modifiers
  private buildSizeModifiers() {
    this.sizeModifiers.set('king size', 'large');
    this.sizeModifiers.set('queen size', 'large');
    this.sizeModifiers.set('double', 'medium');
    this.sizeModifiers.set('single', 'small');
    this.sizeModifiers.set('twin', 'small');
    this.sizeModifiers.set('large', 'large');
    this.sizeModifiers.set('big', 'large');
    this.sizeModifiers.set('small', 'small');
    this.sizeModifiers.set('mini', 'small');
    this.sizeModifiers.set('huge', 'large');
    this.sizeModifiers.set('massive', 'large');
  }

  // Extract quantities from text
  private extractQuantities(text: string): Map<number, number> {
    const quantities = new Map<number, number>();
    const normalizedText = this.normalizeNumbers(text);
    
    // Find all quantity patterns
    this.quantityPatterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(normalizedText)) !== null) {
        const quantity = this.parseQuantity(match[1] || match[2] || match[0]);
        if (quantity > 0) {
          quantities.set(match.index, quantity);
        }
      }
    });

    return quantities;
  }

  // Convert written numbers to digits
  private normalizeNumbers(text: string): string {
    const numberMap: Record<string, string> = {
      'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
      'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
      'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
      'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20'
    };

    let normalized = text.toLowerCase();
    Object.entries(numberMap).forEach(([word, digit]) => {
      normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
    });

    return normalized;
  }

  // Special handling for complex phrases like "3 seats sofa"
  private processComplexPhrases(text: string): string {
    let processed = text;
    
    // Handle "3 seats sofa" -> "3 sofa" (sofa with 3 seats)
    processed = processed.replace(/(\d+)\s+seats?\s+(sofa|couch|settee)/gi, '$1 $2');
    
    // Handle "king size mattress" -> "large mattress"
    processed = processed.replace(/king\s+size\s+(mattress|bed)/gi, 'large $1');
    processed = processed.replace(/queen\s+size\s+(mattress|bed)/gi, 'large $1');
    
    // Handle "large fridge" -> "large refrigerator"
    processed = processed.replace(/large\s+fridge/gi, 'large refrigerator');
    
    return processed;
  }

  // Parse quantity from matched text
  private parseQuantity(text: string): number {
    const cleaned = text.replace(/[^\d]/g, '');
    const num = parseInt(cleaned);
    return isNaN(num) ? 1 : Math.min(num, 50); // Cap at 50 for safety
  }

  // Find items in text with position tracking
  private findItemsInText(text: string): Array<{item: CatalogItem, position: number, matchedText: string, confidence: number}> {
    const found: Array<{item: CatalogItem, position: number, matchedText: string, confidence: number}> = [];
    const normalizedText = text.toLowerCase();
    
    // Check for direct item matches with better regex
    this.itemPatterns.forEach((items, pattern) => {
      // Escape special regex characters
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedPattern}\\b`, 'gi');
      let match: RegExpExecArray | null;
      
      while ((match = regex.exec(normalizedText)) !== null) {
        items.forEach(item => {
          // Calculate confidence based on match quality
          let confidence = 70;
          const matchedText = match![0];
          
          // Exact name match gets highest confidence
          if (matchedText === item.name.toLowerCase()) {
            confidence = 95;
          }
          // Keyword match gets high confidence
          else if (item.keywords.some(k => k.toLowerCase().includes(matchedText))) {
            confidence = 85;
          }
          // Partial match gets medium confidence
          else if (item.name.toLowerCase().includes(matchedText) || matchedText.includes(item.name.toLowerCase())) {
            confidence = 75;
          }
          
          found.push({
            item,
            position: match!.index,
            matchedText: matchedText,
            confidence
          });
        });
      }
    });

    // Check for synonym matches
    this.synonyms.forEach((synonymList, mainTerm) => {
      synonymList.forEach(synonym => {
        const escapedSynonym = synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedSynonym}\\b`, 'gi');
        let match: RegExpExecArray | null;
        
        while ((match = regex.exec(normalizedText)) !== null) {
          const items = this.itemPatterns.get(mainTerm) || [];
          items.forEach(item => {
            found.push({
              item,
              position: match!.index,
              matchedText: match![0],
              confidence: 80
            });
          });
        }
      });
    });

    // Remove duplicates and sort by position
    const uniqueFound = found.filter((item, index, arr) => 
      arr.findIndex(other => other.item.id === item.item.id && other.position === item.position) === index
    );

    return uniqueFound.sort((a, b) => a.position - b.position);
  }

  // Match quantities with nearby items
  private matchQuantitiesWithItems(
    quantities: Map<number, number>, 
    items: Array<{item: CatalogItem, position: number, matchedText: string, confidence: number}>
  ): ParsedItem[] {
    const result: ParsedItem[] = [];
    
    items.forEach(itemMatch => {
      let bestQuantity = 1;
      let bestDistance = Infinity;
      
      // Find closest quantity before the item
      quantities.forEach((qty, pos) => {
        const distance = itemMatch.position - pos;
        if (distance >= 0 && distance < bestDistance && distance < 50) { // Within 50 characters
          bestQuantity = qty;
          bestDistance = distance;
        }
      });
      
      // If no quantity found before, look after (less preferred)
      if (bestDistance === Infinity) {
        quantities.forEach((qty, pos) => {
          const distance = pos - itemMatch.position;
          if (distance >= 0 && distance < bestDistance && distance < 30) { // Within 30 characters
            bestQuantity = qty;
            bestDistance = distance;
          }
        });
      }

      result.push({
        item: itemMatch.item,
        quantity: bestQuantity,
        confidence: itemMatch.confidence - (bestDistance > 20 ? 10 : 0),
        matchedText: itemMatch.matchedText,
        position: itemMatch.position
      });
    });

    return result;
  }

  // Main parsing function
  parse(text: string): ParseResult {
    if (!text || text.trim().length < 3) {
      return {
        items: [],
        totalConfidence: 0,
        originalText: text,
        processedText: text
      };
    }

    // Process text through multiple stages
    let processedText = this.normalizeNumbers(text);
    processedText = this.processComplexPhrases(processedText);
    
    const quantities = this.extractQuantities(processedText);
    const itemMatches = this.findItemsInText(processedText);
    const parsedItems = this.matchQuantitiesWithItems(quantities, itemMatches);
    
    // Remove duplicates by item ID, keeping highest confidence
    const uniqueItems = new Map<string, ParsedItem>();
    parsedItems.forEach(parsed => {
      const existing = uniqueItems.get(parsed.item.id);
      if (!existing || parsed.confidence > existing.confidence) {
        uniqueItems.set(parsed.item.id, parsed);
      } else if (existing && parsed.confidence === existing.confidence) {
        // Same confidence, add quantities
        existing.quantity += parsed.quantity;
      }
    });

    const finalItems = Array.from(uniqueItems.values())
      .filter(item => item.confidence > 60) // Only high-confidence matches
      .sort((a, b) => b.confidence - a.confidence);

    const totalConfidence = finalItems.length > 0 
      ? finalItems.reduce((sum, item) => sum + item.confidence, 0) / finalItems.length
      : 0;

    return {
      items: finalItems,
      totalConfidence,
      originalText: text,
      processedText
    };
  }

  // Get suggestions for natural language input
  getSuggestions(text: string): string[] {
    const parseResult = this.parse(text);
    if (parseResult.items.length === 0) return [];

    return [
      `Found ${parseResult.items.length} items in your message`,
      ...parseResult.items.map(parsed => 
        `${parsed.quantity}× ${parsed.item.name} (${Math.round(parsed.confidence)}% match)`
      ),
      'Click to add all items to your booking'
    ];
  }
}

// Singleton instance
let nlpInstance: NaturalLanguageParser | null = null;

export function getNLPParser(): NaturalLanguageParser {
  if (!nlpInstance) {
    nlpInstance = new NaturalLanguageParser();
  }
  return nlpInstance;
}

// Utility functions
export function parseNaturalLanguage(text: string): ParseResult {
  const parser = getNLPParser();
  return parser.parse(text);
}

export function isNaturalLanguageQuery(text: string): boolean {
  if (!text || text.trim().length < 5) return false;
  
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);
  
  // Must have at least 2 words
  const hasMultipleWords = words.length >= 2;
  
  // Check for quantity indicators
  const hasQuantityIndicators = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i.test(trimmed);
  
  // Check for connectors
  const hasConnectors = /\b(and|also|plus|with|have|got|need|want|\+|&|,)\b/i.test(trimmed);
  
  // Check for sentence structure
  const hasSentenceStructure = /\b(i\s+(have|got|need|want)|there\s+(is|are)|we\s+(have|need)|moving|items|furniture)\b/i.test(trimmed);
  
  // Check for specific patterns that indicate natural language
  const hasSpecificPatterns = /\b(\d+\s*\w+\s*\+|\w+\s*\+|\d+\s*\w+\s*and|\w+\s*and|\d+\s*\w+\s*,|\w+\s*,)/i.test(trimmed);
  
  // More lenient detection - if it has quantities or connectors, it's likely natural language
  const isNaturalLanguage = hasMultipleWords && (
    hasQuantityIndicators || 
    hasConnectors || 
    hasSentenceStructure || 
    hasSpecificPatterns ||
    words.length >= 4 // Long queries are likely natural language
  );
  
  return isNaturalLanguage;
}

export function getNLPSuggestions(text: string): string[] {
  const parser = getNLPParser();
  return parser.getSuggestions(text);
}

// Example usage patterns for testing
export const EXAMPLE_PATTERNS = [
  "I have 3 seats sofa + 2 chairs also I got 2 king size mattress",
  "Need to move 1 large fridge, 2 sofas and 5 boxes",
  "Moving 1 washing machine, 1 dryer, and 3 medium boxes",
  "I got 2 dining tables, 6 chairs, and 1 large wardrobe",
  "Need help with 1 piano, 2 bookcases, and 10 small boxes",
  "Have 1 king size bed, 2 nightstands, and 1 dresser",
  "Moving office: 3 desks, 6 office chairs, 1 filing cabinet",
  "Kitchen items: 1 fridge, 1 dishwasher, 1 oven, 2 stools"
];

// Test function for development
export function testNLPParser() {
  const parser = getNLPParser();
  
  console.log('🧠 Testing Natural Language Parser:');
  EXAMPLE_PATTERNS.forEach((pattern, index) => {
    console.log(`\n${index + 1}. "${pattern}"`);
    const result = parser.parse(pattern);
    console.log(`   Confidence: ${result.totalConfidence.toFixed(1)}%`);
    result.items.forEach(item => {
      console.log(`   - ${item.quantity}× ${item.item.name} (${item.confidence}%)`);
    });
  });
}
