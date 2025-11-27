/**
 * Safe Storage Utilities
 * 
 * Provides robust, error-resilient wrappers for localStorage and sessionStorage.
 * Handles:
 * - SSR (typeof window === 'undefined')
 * - SecurityError (tracking prevention, blocked storage)
 * - QuotaExceededError
 * - Any other storage access exceptions
 * 
 * All functions fail gracefully and never throw.
 */

/**
 * Safely get localStorage instance
 * @returns Storage object or null if unavailable
 */
export function getSafeLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Test access by attempting a read
    const test = window.localStorage;
    // Some browsers throw on access, some on method call
    test.length;
    return test;
  } catch (error) {
    // SecurityError, or storage disabled
    return null;
  }
}

/**
 * Safely get sessionStorage instance
 * @returns Storage object or null if unavailable
 */
export function getSafeSessionStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Test access by attempting a read
    const test = window.sessionStorage;
    // Some browsers throw on access, some on method call
    test.length;
    return test;
  } catch (error) {
    // SecurityError, or storage disabled
    return null;
  }
}

/**
 * Safely get an item from localStorage
 * @param key Storage key
 * @returns Value or null if unavailable/not found
 */
export function safeLocalStorageGetItem(key: string): string | null {
  try {
    const storage = getSafeLocalStorage();
    if (!storage) return null;
    return storage.getItem(key);
  } catch (error) {
    console.warn(`Failed to get localStorage item "${key}":`, error);
    return null;
  }
}

/**
 * Safely set an item in localStorage
 * @param key Storage key
 * @param value Value to store
 * @returns true if successful, false otherwise
 */
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    const storage = getSafeLocalStorage();
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch (error) {
    // QuotaExceededError or SecurityError
    console.warn(`Failed to set localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 * @param key Storage key
 * @returns true if successful, false otherwise
 */
export function safeLocalStorageRemoveItem(key: string): boolean {
  try {
    const storage = getSafeLocalStorage();
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely clear all localStorage
 * @returns true if successful, false otherwise
 */
export function safeLocalStorageClear(): boolean {
  try {
    const storage = getSafeLocalStorage();
    if (!storage) return false;
    storage.clear();
    return true;
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Safely get an item from sessionStorage
 * @param key Storage key
 * @returns Value or null if unavailable/not found
 */
export function safeSessionStorageGetItem(key: string): string | null {
  try {
    const storage = getSafeSessionStorage();
    if (!storage) return null;
    return storage.getItem(key);
  } catch (error) {
    console.warn(`Failed to get sessionStorage item "${key}":`, error);
    return null;
  }
}

/**
 * Safely set an item in sessionStorage
 * @param key Storage key
 * @param value Value to store
 * @returns true if successful, false otherwise
 */
export function safeSessionStorageSetItem(key: string, value: string): boolean {
  try {
    const storage = getSafeSessionStorage();
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch (error) {
    // QuotaExceededError or SecurityError
    console.warn(`Failed to set sessionStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely remove an item from sessionStorage
 * @param key Storage key
 * @returns true if successful, false otherwise
 */
export function safeSessionStorageRemoveItem(key: string): boolean {
  try {
    const storage = getSafeSessionStorage();
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove sessionStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely clear all sessionStorage
 * @returns true if successful, false otherwise
 */
export function safeSessionStorageClear(): boolean {
  try {
    const storage = getSafeSessionStorage();
    if (!storage) return false;
    storage.clear();
    return true;
  } catch (error) {
    console.warn('Failed to clear sessionStorage:', error);
    return false;
  }
}

/**
 * Safely get and parse JSON from localStorage
 * @param key Storage key
 * @param defaultValue Default value if parsing fails or storage unavailable
 * @returns Parsed value or default
 */
export function safeLocalStorageGetJSON<T>(key: string, defaultValue: T): T {
  try {
    const item = safeLocalStorageGetItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to parse localStorage JSON for "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely stringify and set JSON to localStorage
 * @param key Storage key
 * @param value Value to store
 * @returns true if successful, false otherwise
 */
export function safeLocalStorageSetJSON<T>(key: string, value: T): boolean {
  try {
    const json = JSON.stringify(value);
    return safeLocalStorageSetItem(key, json);
  } catch (error) {
    console.warn(`Failed to stringify JSON for localStorage "${key}":`, error);
    return false;
  }
}

/**
 * Safely get and parse JSON from sessionStorage
 * @param key Storage key
 * @param defaultValue Default value if parsing fails or storage unavailable
 * @returns Parsed value or default
 */
export function safeSessionStorageGetJSON<T>(key: string, defaultValue: T): T {
  try {
    const item = safeSessionStorageGetItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to parse sessionStorage JSON for "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safely stringify and set JSON to sessionStorage
 * @param key Storage key
 * @param value Value to store
 * @returns true if successful, false otherwise
 */
export function safeSessionStorageSetJSON<T>(key: string, value: T): boolean {
  try {
    const json = JSON.stringify(value);
    return safeSessionStorageSetItem(key, json);
  } catch (error) {
    console.warn(`Failed to stringify JSON for sessionStorage "${key}":`, error);
    return false;
  }
}

/**
 * Check if localStorage is available
 * @returns true if localStorage can be used
 */
export function isLocalStorageAvailable(): boolean {
  return getSafeLocalStorage() !== null;
}

/**
 * Check if sessionStorage is available
 * @returns true if sessionStorage can be used
 */
export function isSessionStorageAvailable(): boolean {
  return getSafeSessionStorage() !== null;
}
