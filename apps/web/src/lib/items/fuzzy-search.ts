/**
 * Fuzzy Search Utility for Items
 * Uses Fuse.js for intelligent item searching with typo tolerance
 */

import Fuse from 'fuse.js';
import type { IFuseOptions } from 'fuse.js';

export interface SearchableItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  keywords?: string[];
  [key: string]: any;
}

/**
 * Fuzzy search configuration
 */
const fuseOptions: IFuseOptions<SearchableItem> = {
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'category', weight: 0.2 },
    { name: 'description', weight: 0.2 },
    { name: 'keywords', weight: 0.1 },
  ],
  threshold: 0.4, // 0.0 = exact match, 1.0 = match anything
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  useExtendedSearch: true,
};

/**
 * Create a fuzzy search instance for items
 */
export function createItemSearch(items: SearchableItem[]) {
  return new Fuse(items, fuseOptions);
}

/**
 * Perform fuzzy search on items
 */
export function fuzzySearchItems(
  items: SearchableItem[],
  query: string,
  maxResults: number = 20
): SearchableItem[] {
  if (!query || query.trim().length < 2) {
    return items.slice(0, maxResults);
  }

  const fuse = createItemSearch(items);
  const results = fuse.search(query, { limit: maxResults });

  return results.map((result) => result.item);
}

/**
 * Get search suggestions based on partial input
 */
export function getSearchSuggestions(
  items: SearchableItem[],
  query: string,
  maxSuggestions: number = 5
): string[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const fuse = createItemSearch(items);
  const results = fuse.search(query, { limit: maxSuggestions * 2 });

  // Extract unique item names as suggestions
  const suggestions = new Set<string>();
  
  for (const result of results) {
    if (suggestions.size >= maxSuggestions) break;
    suggestions.add(result.item.name);
  }

  return Array.from(suggestions);
}

/**
 * Search items by category with fuzzy matching
 */
export function searchItemsByCategory(
  items: SearchableItem[],
  category: string,
  query?: string,
  maxResults: number = 20
): SearchableItem[] {
  // Filter by category first
  const categoryItems = items.filter(
    (item) => item.category.toLowerCase() === category.toLowerCase()
  );

  // If no query, return all items in category
  if (!query || query.trim().length < 2) {
    return categoryItems.slice(0, maxResults);
  }

  // Apply fuzzy search within category
  return fuzzySearchItems(categoryItems, query, maxResults);
}

/**
 * Calculate relevance score for an item based on query
 */
export function calculateRelevanceScore(
  item: SearchableItem,
  query: string
): number {
  const fuse = createItemSearch([item]);
  const results = fuse.search(query);

  if (results.length === 0) return 0;

  // Fuse.js score is 0 (perfect match) to 1 (no match)
  // We invert it to make higher scores better
  return 1 - (results[0].score || 1);
}

