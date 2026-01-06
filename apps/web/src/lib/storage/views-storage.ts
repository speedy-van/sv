/**
 * Custom Views & Saved Filters Storage
 * 
 * Manages saving and loading of custom views and filter presets
 */

import {
  safeLocalStorageGetItem,
  safeLocalStorageSetItem,
  safeLocalStorageRemoveItem,
} from '@/lib/safe-storage';

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface CustomView {
  id: string;
  name: string;
  description?: string;
  filters: SavedFilter;
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  grouping?: {
    field: string;
    enabled: boolean;
  };
  columns?: string[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

const STORAGE_KEY_FILTERS = 'admin_saved_filters';
const STORAGE_KEY_VIEWS = 'admin_custom_views';

export class ViewsStorage {
  /**
   * Save a filter preset
   */
  static saveFilter(filter: Omit<SavedFilter, 'id' | 'createdAt' | 'updatedAt'>): SavedFilter {
    const filters = this.getFilters();
    const now = new Date().toISOString();
    
    const newFilter: SavedFilter = {
      ...filter,
      id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    filters.push(newFilter);
    this.setFilters(filters);
    
    return newFilter;
  }

  /**
   * Get all saved filters
   */
  static getFilters(): SavedFilter[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = safeLocalStorageGetItem(STORAGE_KEY_FILTERS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get a specific filter by ID
   */
  static getFilter(id: string): SavedFilter | null {
    const filters = this.getFilters();
    return filters.find(f => f.id === id) || null;
  }

  /**
   * Update a filter
   */
  static updateFilter(id: string, updates: Partial<SavedFilter>): SavedFilter | null {
    const filters = this.getFilters();
    const index = filters.findIndex(f => f.id === id);
    
    if (index === -1) return null;

    filters[index] = {
      ...filters[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.setFilters(filters);
    return filters[index];
  }

  /**
   * Delete a filter
   */
  static deleteFilter(id: string): boolean {
    const filters = this.getFilters();
    const filtered = filters.filter(f => f.id !== id);
    
    if (filtered.length === filters.length) return false;

    this.setFilters(filtered);
    return true;
  }

  /**
   * Save a custom view
   */
  static saveView(view: Omit<CustomView, 'id' | 'createdAt' | 'updatedAt'>): CustomView {
    const views = this.getViews();
    const now = new Date().toISOString();
    
    const newView: CustomView = {
      ...view,
      id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    views.push(newView);
    this.setViews(views);
    
    return newView;
  }

  /**
   * Get all custom views
   */
  static getViews(): CustomView[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = safeLocalStorageGetItem(STORAGE_KEY_VIEWS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get a specific view by ID
   */
  static getView(id: string): CustomView | null {
    const views = this.getViews();
    return views.find(v => v.id === id) || null;
  }

  /**
   * Update a view
   */
  static updateView(id: string, updates: Partial<CustomView>): CustomView | null {
    const views = this.getViews();
    const index = views.findIndex(v => v.id === id);
    
    if (index === -1) return null;

    views[index] = {
      ...views[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.setViews(views);
    return views[index];
  }

  /**
   * Delete a view
   */
  static deleteView(id: string): boolean {
    const views = this.getViews();
    const filtered = views.filter(v => v.id !== id);
    
    if (filtered.length === views.length) return false;

    this.setViews(filtered);
    return true;
  }

  /**
   * Set default filter
   */
  static setDefaultFilter(id: string): void {
    const filters = this.getFilters();
    filters.forEach(f => {
      f.isDefault = f.id === id;
    });
    this.setFilters(filters);
  }

  /**
   * Set default view
   */
  static setDefaultView(id: string): void {
    const views = this.getViews();
    views.forEach(v => {
      v.isDefault = v.id === id;
    });
    this.setViews(views);
  }

  /**
   * Get default filter
   */
  static getDefaultFilter(): SavedFilter | null {
    const filters = this.getFilters();
    return filters.find(f => f.isDefault) || null;
  }

  /**
   * Get default view
   */
  static getDefaultView(): CustomView | null {
    const views = this.getViews();
    return views.find(v => v.isDefault) || null;
  }

  /**
   * Clear all filters
   */
  static clearFilters(): void {
    if (typeof window === 'undefined') return;
    safeLocalStorageRemoveItem(STORAGE_KEY_FILTERS);
  }

  /**
   * Clear all views
   */
  static clearViews(): void {
    if (typeof window === 'undefined') return;
    safeLocalStorageRemoveItem(STORAGE_KEY_VIEWS);
  }

  /**
   * Export filters as JSON
   */
  static exportFilters(): string {
    return JSON.stringify(this.getFilters(), null, 2);
  }

  /**
   * Export views as JSON
   */
  static exportViews(): string {
    return JSON.stringify(this.getViews(), null, 2);
  }

  /**
   * Import filters from JSON
   */
  static importFilters(json: string): boolean {
    try {
      const filters = JSON.parse(json) as SavedFilter[];
      this.setFilters(filters);
      return true;
    } catch (error) {
      console.error('Error importing filters:', error);
      return false;
    }
  }

  /**
   * Import views from JSON
   */
  static importViews(json: string): boolean {
    try {
      const views = JSON.parse(json) as CustomView[];
      this.setViews(views);
      return true;
    } catch (error) {
      console.error('Error importing views:', error);
      return false;
    }
  }

  // Private helpers
  private static setFilters(filters: SavedFilter[]): void {
    if (typeof window === 'undefined') return;
    safeLocalStorageSetItem(STORAGE_KEY_FILTERS, JSON.stringify(filters));
  }

  private static setViews(views: CustomView[]): void {
    if (typeof window === 'undefined') return;
    safeLocalStorageSetItem(STORAGE_KEY_VIEWS, JSON.stringify(views));
  }
}

