/**
 * Tests for safe-storage utilities
 * Verifies graceful handling of blocked/unavailable storage
 */

import {
  getSafeLocalStorage,
  getSafeSessionStorage,
  safeLocalStorageGetItem,
  safeLocalStorageSetItem,
  safeLocalStorageRemoveItem,
  safeLocalStorageClear,
  safeSessionStorageGetItem,
  safeSessionStorageSetItem,
  safeSessionStorageRemoveItem,
  safeSessionStorageClear,
  safeLocalStorageGetJSON,
  safeLocalStorageSetJSON,
  safeSessionStorageGetJSON,
  safeSessionStorageSetJSON,
  isLocalStorageAvailable,
  isSessionStorageAvailable,
} from '../safe-storage';

describe('Safe Storage Utilities', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('Normal operation (storage available)', () => {
    test('getSafeLocalStorage returns storage object', () => {
      const storage = getSafeLocalStorage();
      expect(storage).toBe(localStorage);
    });

    test('getSafeSessionStorage returns storage object', () => {
      const storage = getSafeSessionStorage();
      expect(storage).toBe(sessionStorage);
    });

    test('safeLocalStorageGetItem retrieves value', () => {
      localStorage.setItem('test-key', 'test-value');
      expect(safeLocalStorageGetItem('test-key')).toBe('test-value');
    });

    test('safeLocalStorageSetItem stores value', () => {
      const result = safeLocalStorageSetItem('test-key', 'test-value');
      expect(result).toBe(true);
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });

    test('safeLocalStorageRemoveItem removes value', () => {
      localStorage.setItem('test-key', 'test-value');
      const result = safeLocalStorageRemoveItem('test-key');
      expect(result).toBe(true);
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    test('safeLocalStorageClear removes all items', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      const result = safeLocalStorageClear();
      expect(result).toBe(true);
      expect(localStorage.length).toBe(0);
    });

    test('safeLocalStorageGetJSON parses JSON', () => {
      const obj = { foo: 'bar', count: 42 };
      localStorage.setItem('json-key', JSON.stringify(obj));
      expect(safeLocalStorageGetJSON('json-key', {})).toEqual(obj);
    });

    test('safeLocalStorageSetJSON stores JSON', () => {
      const obj = { foo: 'bar', count: 42 };
      const result = safeLocalStorageSetJSON('json-key', obj);
      expect(result).toBe(true);
      expect(JSON.parse(localStorage.getItem('json-key')!)).toEqual(obj);
    });

    test('isLocalStorageAvailable returns true', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    test('isSessionStorageAvailable returns true', () => {
      expect(isSessionStorageAvailable()).toBe(true);
    });
  });

  describe('Blocked storage (SecurityError)', () => {
    let originalLocalStorage: Storage;
    let originalSessionStorage: Storage;

    beforeEach(() => {
      // Save original storage
      originalLocalStorage = window.localStorage;
      originalSessionStorage = window.sessionStorage;

      // Mock localStorage to throw SecurityError
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('SecurityError: Access is denied');
        },
        configurable: true,
      });

      // Mock sessionStorage to throw SecurityError
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new Error('SecurityError: Access is denied');
        },
        configurable: true,
      });
    });

    afterEach(() => {
      // Restore original storage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(window, 'sessionStorage', {
        value: originalSessionStorage,
        configurable: true,
        writable: true,
      });
    });

    test('getSafeLocalStorage returns null when blocked', () => {
      const storage = getSafeLocalStorage();
      expect(storage).toBeNull();
    });

    test('getSafeSessionStorage returns null when blocked', () => {
      const storage = getSafeSessionStorage();
      expect(storage).toBeNull();
    });

    test('safeLocalStorageGetItem returns null when blocked', () => {
      const result = safeLocalStorageGetItem('test-key');
      expect(result).toBeNull();
    });

    test('safeLocalStorageSetItem returns false when blocked', () => {
      const result = safeLocalStorageSetItem('test-key', 'test-value');
      expect(result).toBe(false);
    });

    test('safeLocalStorageRemoveItem returns false when blocked', () => {
      const result = safeLocalStorageRemoveItem('test-key');
      expect(result).toBe(false);
    });

    test('safeLocalStorageClear returns false when blocked', () => {
      const result = safeLocalStorageClear();
      expect(result).toBe(false);
    });

    test('safeSessionStorageGetItem returns null when blocked', () => {
      const result = safeSessionStorageGetItem('test-key');
      expect(result).toBeNull();
    });

    test('safeSessionStorageSetItem returns false when blocked', () => {
      const result = safeSessionStorageSetItem('test-key', 'test-value');
      expect(result).toBe(false);
    });

    test('safeSessionStorageRemoveItem returns false when blocked', () => {
      const result = safeSessionStorageRemoveItem('test-key');
      expect(result).toBe(false);
    });

    test('safeSessionStorageClear returns false when blocked', () => {
      const result = safeSessionStorageClear();
      expect(result).toBe(false);
    });

    test('safeLocalStorageGetJSON returns default when blocked', () => {
      const defaultValue = { fallback: true };
      const result = safeLocalStorageGetJSON('test-key', defaultValue);
      expect(result).toEqual(defaultValue);
    });

    test('safeLocalStorageSetJSON returns false when blocked', () => {
      const result = safeLocalStorageSetJSON('test-key', { foo: 'bar' });
      expect(result).toBe(false);
    });

    test('safeSessionStorageGetJSON returns default when blocked', () => {
      const defaultValue = { fallback: true };
      const result = safeSessionStorageGetJSON('test-key', defaultValue);
      expect(result).toEqual(defaultValue);
    });

    test('safeSessionStorageSetJSON returns false when blocked', () => {
      const result = safeSessionStorageSetJSON('test-key', { foo: 'bar' });
      expect(result).toBe(false);
    });

    test('isLocalStorageAvailable returns false when blocked', () => {
      expect(isLocalStorageAvailable()).toBe(false);
    });

    test('isSessionStorageAvailable returns false when blocked', () => {
      expect(isSessionStorageAvailable()).toBe(false);
    });
  });

  describe('Invalid JSON handling', () => {
    test('safeLocalStorageGetJSON returns default for invalid JSON', () => {
      localStorage.setItem('bad-json', '{invalid json}');
      const defaultValue = { fallback: true };
      const result = safeLocalStorageGetJSON('bad-json', defaultValue);
      expect(result).toEqual(defaultValue);
    });

    test('safeSessionStorageGetJSON returns default for invalid JSON', () => {
      sessionStorage.setItem('bad-json', '{invalid json}');
      const defaultValue = { fallback: true };
      const result = safeSessionStorageGetJSON('bad-json', defaultValue);
      expect(result).toEqual(defaultValue);
    });

    test('safeLocalStorageGetJSON returns default for missing key', () => {
      const defaultValue = { fallback: true };
      const result = safeLocalStorageGetJSON('nonexistent', defaultValue);
      expect(result).toEqual(defaultValue);
    });
  });

  describe('Edge cases', () => {
    test('handles empty strings', () => {
      safeLocalStorageSetItem('empty', '');
      expect(safeLocalStorageGetItem('empty')).toBe('');
    });

    test('handles null values gracefully', () => {
      expect(safeLocalStorageGetItem('nonexistent')).toBeNull();
    });

    test('handles circular JSON structures', () => {
      const circular: any = { a: 1 };
      circular.self = circular;
      const result = safeLocalStorageSetJSON('circular', circular);
      expect(result).toBe(false); // Should fail gracefully
    });
  });
});
