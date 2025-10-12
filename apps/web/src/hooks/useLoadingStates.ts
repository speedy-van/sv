/**
 * Loading states hook for managing async operations
 */

import { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any;
  progress?: number;
  message?: string;
}

export interface LoadingStates {
  [key: string]: LoadingState;
}

export function useLoadingStates(initialStates: LoadingStates = {}) {
  const [states, setStates] = useState<LoadingStates>(initialStates);

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading,
        error: isLoading ? null : prev[key]?.error || null,
      },
    }));
  }, []);

  const setError = useCallback((key: string, error: string | null) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        error,
        isLoading: false,
      },
    }));
  }, []);

  const setData = useCallback((key: string, data: any) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        data,
        error: null,
        isLoading: false,
      },
    }));
  }, []);

  const reset = useCallback((key: string) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        isLoading: false,
        error: null,
        data: null,
      },
    }));
  }, []);

  const resetAll = useCallback(() => {
    setStates({});
  }, []);

  const executeAsync = useCallback(async (
    key: string,
    asyncFn: () => Promise<any>
  ) => {
    setLoading(key, true);
    try {
      const result = await asyncFn();
      setData(key, result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(key, errorMessage);
      throw error;
    }
  }, [setLoading, setData, setError]);

  return {
    states,
    setLoading,
    setError,
    setData,
    reset,
    resetAll,
    executeAsync,
  };
}

export default useLoadingStates;