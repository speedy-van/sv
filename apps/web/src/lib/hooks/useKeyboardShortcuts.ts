'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const matchingShortcut = shortcuts.find((shortcut) => {
        // Guard against undefined key values
        if (!shortcut.key || !event.key) return false;
        
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
          event.code?.toLowerCase() === shortcut.key.toLowerCase();

        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
      });

      if (matchingShortcut) {
        if (preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }
        matchingShortcut.action();
      }
    },
    [shortcuts, enabled, preventDefault]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

// Predefined shortcut groups for common admin operations
export const AdminShortcuts = {
  // Navigation
  goToOrders: (action: () => void): KeyboardShortcut => ({
    key: '1',
    ctrl: true,
    description: 'Go to Single Orders',
    action,
    category: 'Navigation',
  }),
  goToRoutes: (action: () => void): KeyboardShortcut => ({
    key: '2',
    ctrl: true,
    description: 'Go to Multi-Drop Routes',
    action,
    category: 'Navigation',
  }),
  goToAdditionalJourneys: (action: () => void): KeyboardShortcut => ({
    key: '3',
    ctrl: true,
    description: 'Go to Additional Journeys',
    action,
    category: 'Navigation',
  }),
  goToAnalytics: (action: () => void): KeyboardShortcut => ({
    key: '4',
    ctrl: true,
    description: 'Go to Analytics',
    action,
    category: 'Navigation',
  }),

  // Actions
  refresh: (action: () => void): KeyboardShortcut => ({
    key: 'r',
    ctrl: true,
    description: 'Refresh current view',
    action,
    category: 'Actions',
  }),
  search: (action: () => void): KeyboardShortcut => ({
    key: 'f',
    ctrl: true,
    description: 'Focus search',
    action,
    category: 'Actions',
  }),
  newOrder: (action: () => void): KeyboardShortcut => ({
    key: 'n',
    ctrl: true,
    description: 'Create new order',
    action,
    category: 'Actions',
  }),
  export: (action: () => void): KeyboardShortcut => ({
    key: 'e',
    ctrl: true,
    shift: true,
    description: 'Export data',
    action,
    category: 'Actions',
  }),

  // Filters & Views
  toggleFilters: (action: () => void): KeyboardShortcut => ({
    key: 'f',
    ctrl: true,
    shift: true,
    description: 'Toggle advanced filters',
    action,
    category: 'Filters',
  }),
  toggleGrouping: (action: () => void): KeyboardShortcut => ({
    key: 'g',
    ctrl: true,
    shift: true,
    description: 'Toggle grouping',
    action,
    category: 'Filters',
  }),

  // General
  close: (action: () => void): KeyboardShortcut => ({
    key: 'Escape',
    description: 'Close modal/drawer',
    action,
    category: 'General',
  }),
  help: (action: () => void): KeyboardShortcut => ({
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts',
    action,
    category: 'General',
  }),
};

