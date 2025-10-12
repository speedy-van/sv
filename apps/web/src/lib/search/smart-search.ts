/**
 * Advanced Smart Search System
 * Provides intelligent search with autocomplete, suggestions, and keyword matching
 */

import { COMPREHENSIVE_CATALOG, type CatalogItem } from '../pricing/catalog-dataset';
import { POPULAR_ITEMS, convertPopularToItem, type PopularItem } from '../items/popular-items';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'item' | 'keyword' | 'category';
  item?: CatalogItem;
  popularity: number;
  matchedKeywords: string[];
}

export interface SearchResult {
  item: CatalogItem;
  relevance: number;
  matchedKeywords: string[];
  matchType: 'exact' | 'partial' | 'keyword' | 'fuzzy';
}

class SmartSearchEngine {
  private searchIndex: Map<string, Set<string>> = new Map();
  private keywordIndex: Map<string, CatalogItem[]> = new Map();
  private fuzzyIndex: Map<string, string[]> = new Map();
  private popularTerms: string[] = [];

  constructor() {
    this.buildSearchIndex();
    this.buildKeywordIndex();
    this.buildFuzzyIndex();
    this.buildPopularTerms();
  }

  // Build comprehensive search index
  private buildSearchIndex() {
    COMPREHENSIVE_CATALOG.forEach(item => {
      const searchTerms = new Set<string>();

      // Add item name
      searchTerms.add(item.name.toLowerCase());

      // Add keywords (now an array)
      item.keywords.forEach(keyword => {
        searchTerms.add(keyword.toLowerCase());
      });
      
      // Add category
      searchTerms.add(item.category.toLowerCase());
      
      // Add characteristics
      if (item.heavy) searchTerms.add('heavy');
      if (item.fragile) searchTerms.add('fragile');
      if (item.valuable) searchTerms.add('valuable');
      
      // Add size-related terms
      if (item.volume > 2) searchTerms.add('large');
      else if (item.volume > 0.5) searchTerms.add('medium');
      else searchTerms.add('small');
      
      // Add weight-related terms
      if (item.weight > 50) searchTerms.add('heavy');
      else if (item.weight < 10) searchTerms.add('light');
      
      this.searchIndex.set(item.id, searchTerms);
    });
  }

  // Build keyword to items mapping
  private buildKeywordIndex() {
    COMPREHENSIVE_CATALOG.forEach(item => {
      const keywords = [
        item.name.toLowerCase(),
        ...item.keywords.map(k => k.toLowerCase()),
        item.category.toLowerCase()
      ];

      keywords.forEach(keyword => {
        if (!this.keywordIndex.has(keyword)) {
          this.keywordIndex.set(keyword, []);
        }
        this.keywordIndex.get(keyword)!.push(item);
      });
    });
  }

  // Build fuzzy matching index for common misspellings
  private buildFuzzyIndex() {
    const commonMisspellings = {
      'sofa': ['sopha', 'soffa', 'couch'],
      'refrigerator': ['fridge', 'refridgerator', 'fridg'],
      'television': ['tv', 'telly', 'televisoin'],
      'washing': ['washer', 'washing machine', 'washng'],
      'dishwasher': ['dish washer', 'dishwashr'],
      'microwave': ['micro wave', 'microwav'],
      'wardrobe': ['wardobe', 'closet', 'cupboard'],
      'bookshelf': ['book shelf', 'bookcase', 'shelf'],
      'dining': ['dinning', 'dining table'],
      'mattress': ['matress', 'mattrass'],
      'bicycle': ['bike', 'cycle', 'bycicle'],
      // Full House Removal keywords
      'full house': ['full house removal', 'house move', 'complete move', 'entire house', 'whole house'],
      'house removal': ['house move', 'home removal', 'property move', 'relocation'],
      '1 bedroom': ['one bedroom', 'studio', 'bedsit', '1bed', 'single bedroom'],
      '2 bedroom': ['two bedroom', '2bed', 'double bedroom'],
      '3 bedroom': ['three bedroom', '3bed', 'family home'],
      '4 bedroom': ['four bedroom', '4bed', 'large house'],
      '5 bedroom': ['five bedroom', '5bed', 'mansion'],
      '6 bedroom': ['six bedroom', '6bed', 'estate', 'large mansion'],
      'apartment': ['flat', 'unit', 'condo'],
      'house': ['home', 'property', 'residence'],
      'move': ['removal', 'relocation', 'transport']
    };

    Object.entries(commonMisspellings).forEach(([correct, variants]) => {
      variants.forEach(variant => {
        if (!this.fuzzyIndex.has(variant)) {
          this.fuzzyIndex.set(variant, []);
        }
        this.fuzzyIndex.get(variant)!.push(correct);
      });
    });
  }

  // Build popular search terms
  private buildPopularTerms() {
    const termFrequency = new Map<string, number>();

    COMPREHENSIVE_CATALOG.forEach(item => {
      const terms = [
        item.name.toLowerCase(),
        ...item.keywords.map(k => k.toLowerCase())
      ];

      terms.forEach(term => {
        termFrequency.set(term, (termFrequency.get(term) || 0) + 1);
      });
    });

    // Add popular items terms with higher weight
    POPULAR_ITEMS.forEach(item => {
      const terms = [item.name.toLowerCase()];
      terms.forEach(term => {
        termFrequency.set(term, (termFrequency.get(term) || 0) + 10);
      });
    });

    this.popularTerms = Array.from(termFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([term]) => term);
  }

  // Get autocomplete suggestions
  getAutocompleteSuggestions(query: string, limit: number = 10): SearchSuggestion[] {
    if (!query || query.length < 1) {
      return this.getPopularSuggestions(limit);
    }

    const queryLower = query.toLowerCase();
    const suggestions: SearchSuggestion[] = [];
    const seen = new Set<string>();

    // 1. Exact matches (highest priority)
    this.keywordIndex.forEach((items, keyword) => {
      if (keyword.startsWith(queryLower) && !seen.has(keyword)) {
        suggestions.push({
          id: `keyword-${keyword}`,
          text: keyword,
          type: 'keyword',
          popularity: items.length * 10,
          matchedKeywords: [keyword],
          item: items[0] // Representative item
        });
        seen.add(keyword);
      }
    });

    // 2. Partial matches
    this.keywordIndex.forEach((items, keyword) => {
      if (keyword.includes(queryLower) && !keyword.startsWith(queryLower) && !seen.has(keyword)) {
        suggestions.push({
          id: `keyword-${keyword}`,
          text: keyword,
          type: 'keyword',
          popularity: items.length * 5,
          matchedKeywords: [keyword],
          item: items[0]
        });
        seen.add(keyword);
      }
    });

    // 3. Fuzzy matches
    this.fuzzyIndex.forEach((corrections, misspelling) => {
      if (misspelling.includes(queryLower)) {
        corrections.forEach(correction => {
          if (!seen.has(correction) && this.keywordIndex.has(correction)) {
            const items = this.keywordIndex.get(correction)!;
            suggestions.push({
              id: `fuzzy-${correction}`,
              text: correction,
              type: 'keyword',
              popularity: items.length * 3,
              matchedKeywords: [correction],
              item: items[0]
            });
            seen.add(correction);
          }
        });
      }
    });

    // 4. Category matches
    const categories = ['furniture', 'appliances', 'boxes', 'electronics', 'kitchen', 'bathroom', 'office', 'fitness', 'general'];
    categories.forEach(category => {
      if (category.includes(queryLower) && !seen.has(category)) {
        suggestions.push({
          id: `category-${category}`,
          text: category,
          type: 'category',
          popularity: 50,
          matchedKeywords: [category]
        });
        seen.add(category);
      }
    });

    return suggestions
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  // Get popular suggestions when no query
  private getPopularSuggestions(limit: number): SearchSuggestion[] {
    return this.popularTerms.slice(0, limit).map(term => ({
      id: `popular-${term}`,
      text: term,
      type: 'keyword' as const,
      popularity: 100,
      matchedKeywords: [term],
      item: this.keywordIndex.get(term)?.[0]
    }));
  }

  // Perform smart search
  search(query: string, limit: number = 20): SearchResult[] {
    if (!query) return [];

    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];
    const seen = new Set<string>();

    // 1. Exact name matches (highest relevance)
    COMPREHENSIVE_CATALOG.forEach(item => {
      if (item.name.toLowerCase() === queryLower && !seen.has(item.id)) {
        results.push({
          item,
          relevance: 100,
          matchedKeywords: [item.name],
          matchType: 'exact'
        });
        seen.add(item.id);
      }
    });

    // 2. Name starts with query
    COMPREHENSIVE_CATALOG.forEach(item => {
      if (item.name.toLowerCase().startsWith(queryLower) && !seen.has(item.id)) {
        results.push({
          item,
          relevance: 90,
          matchedKeywords: [item.name],
          matchType: 'partial'
        });
        seen.add(item.id);
      }
    });

    // 3. Keyword exact matches
    const matchedKeywords = this.keywordIndex.get(queryLower) || [];
    matchedKeywords.forEach(item => {
      if (!seen.has(item.id)) {
        results.push({
          item,
          relevance: 85,
          matchedKeywords: [queryLower],
          matchType: 'keyword'
        });
        seen.add(item.id);
      }
    });

    // 4. Partial keyword matches
    this.keywordIndex.forEach((items, keyword) => {
      if (keyword.includes(queryLower) && keyword !== queryLower) {
        items.forEach(item => {
          if (!seen.has(item.id)) {
            results.push({
              item,
              relevance: 70,
              matchedKeywords: [keyword],
              matchType: 'partial'
            });
            seen.add(item.id);
          }
        });
      }
    });

    // 5. Fuzzy matches
    this.fuzzyIndex.forEach((corrections, misspelling) => {
      if (misspelling.includes(queryLower)) {
        corrections.forEach(correction => {
          const items = this.keywordIndex.get(correction) || [];
          items.forEach(item => {
            if (!seen.has(item.id)) {
              results.push({
                item,
                relevance: 60,
                matchedKeywords: [correction],
                matchType: 'fuzzy'
              });
              seen.add(item.id);
            }
          });
        });
      }
    });

    // 6. Category matches
    COMPREHENSIVE_CATALOG.forEach(item => {
      if (item.category.toLowerCase().includes(queryLower) && !seen.has(item.id)) {
        results.push({
          item,
          relevance: 50,
          matchedKeywords: [item.category],
          matchType: 'keyword'
        });
        seen.add(item.id);
      }
    });

    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  // Get search suggestions for display outside search box
  getSearchSuggestions(query: string, limit: number = 8): SearchSuggestion[] {
    const results = this.search(query, limit);
    return results.map(result => ({
      id: result.item.id,
      text: result.item.name,
      type: 'item' as const,
      popularity: result.relevance,
      matchedKeywords: result.matchedKeywords,
      item: result.item
    }));
  }
}

// Singleton instance
let smartSearchInstance: SmartSearchEngine | null = null;

export function getSmartSearch(): SmartSearchEngine {
  if (!smartSearchInstance) {
    smartSearchInstance = new SmartSearchEngine();
  }
  return smartSearchInstance;
}

// Utility functions
export function searchItems(query: string, limit?: number): CatalogItem[] {
  const search = getSmartSearch();
  return search.search(query, limit).map(result => result.item);
}

export function getAutocomplete(query: string, limit?: number): SearchSuggestion[] {
  const search = getSmartSearch();
  return search.getAutocompleteSuggestions(query, limit);
}

export function getSuggestions(query: string, limit?: number): SearchSuggestion[] {
  const search = getSmartSearch();
  return search.getSearchSuggestions(query, limit);
}
