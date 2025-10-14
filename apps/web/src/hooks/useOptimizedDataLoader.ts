import { useState, useEffect, useCallback, useRef } from 'react';

interface UseOptimizedDataLoaderOptions {
  endpoint: string;
  debounceMs?: number;
  cacheKey?: string;
  enabled?: boolean;
}

interface UseOptimizedDataLoaderResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOptimizedDataLoader<T>(
  options: UseOptimizedDataLoaderOptions
): UseOptimizedDataLoaderResult<T> {
  const { endpoint, debounceMs = 300, cacheKey, enabled = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Check cache first
    if (cacheKey) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const newData = result.data || result;

      setData(newData);

      // Cache the result
      if (cacheKey) {
        cacheRef.current.set(cacheKey, {
          data: newData,
          timestamp: Date.now(),
        });
      }

    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled, cacheKey]);

  const debouncedFetch = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchData();
    }, debounceMs);
  }, [fetchData, debounceMs]);

  const refetch = useCallback(() => {
    // Clear cache if refetching
    if (cacheKey) {
      cacheRef.current.delete(cacheKey);
    }
    fetchData();
  }, [fetchData, cacheKey]);

  useEffect(() => {
    if (enabled) {
      // Use setTimeout to avoid setState during render
      const timeoutId = setTimeout(() => {
        debouncedFetch();
      }, 0);
      
      return () => {
        clearTimeout(timeoutId);
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }
  }, [debouncedFetch, enabled]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
