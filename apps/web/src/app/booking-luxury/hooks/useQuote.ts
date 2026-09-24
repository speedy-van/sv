'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { QuoteRequest, QuoteResponse, QuoteError } from '@/lib/pricing/quote-schema';

export type QuoteStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseQuoteResult {
  status: QuoteStatus;
  data: QuoteResponse | null;
  error: QuoteError | null;
  /** True while a new request is in-flight but we still have the last good data. */
  isStale: boolean;
  refresh: () => void;
}

const TIMEOUT_MS = 15_000;

/** Derive a stable string key from a normalised QuoteRequest (or null = idle). */
function deriveKey(input: QuoteRequest | null): string {
  if (!input) return '';
  const stable: QuoteRequest = {
    ...input,
    items: [...input.items].sort((a, b) => a.id.localeCompare(b.id)),
    extras: {
      ...input.extras,
      assembly: [...(input.extras?.assembly ?? [])].sort((a, b) =>
        a.itemId.localeCompare(b.itemId)
      ),
    },
  };
  return JSON.stringify(stable);
}

/**
 * Fires a quote request whenever `input` changes (debounced).
 * - Cancels in-flight requests on change or unmount.
 * - Ignores stale responses via a monotonic request counter.
 * - Keeps the last good data while reloading (isStale).
 * - Returns TIMEOUT error after 15 s.
 */
export function useQuote(
  input: QuoteRequest | null,
  { debounceMs = 350 }: { debounceMs?: number } = {}
): UseQuoteResult {
  const [status, setStatus] = useState<QuoteStatus>('idle');
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<QuoteError | null>(null);
  const [isStale, setIsStale] = useState(false);

  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const [refreshTick, setRefreshTick] = useState(0);
  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const key = deriveKey(input);

  useEffect(() => {
    if (!key) {
      setStatus('idle');
      setError(null);
      setIsStale(false);
      return;
    }

    // Abort any previous request
    abortRef.current?.abort();

    const debounceTimer = setTimeout(async () => {
      if (!mountedRef.current) return;

      const thisId = ++requestIdRef.current;
      const controller = new AbortController();
      abortRef.current = controller;

      // If we already have data, mark it stale while loading
      setStatus('loading');
      if (data !== null) setIsStale(true);

      // Timeout guard
      const timeoutId = setTimeout(() => {
        if (!mountedRef.current || requestIdRef.current !== thisId) return;
        controller.abort();
        setStatus('error');
        setError({ code: 'TIMEOUT', message: 'Pricing request timed out. Please try again.' });
        setIsStale(false);
      }, TIMEOUT_MS);

      try {
        const res = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!mountedRef.current || requestIdRef.current !== thisId) return;

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          setStatus('error');
          setError({
            code: errBody.code ?? 'NETWORK',
            message: errBody.message ?? 'Could not load pricing.',
            fields: errBody.fields,
          });
          setIsStale(false);
          return;
        }

        const json: QuoteResponse = await res.json();

        if (!mountedRef.current || requestIdRef.current !== thisId) return;

        setData(json);
        setStatus('success');
        setError(null);
        setIsStale(false);
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (!mountedRef.current || requestIdRef.current !== thisId) return;
        if ((err as any)?.name === 'AbortError') return; // cancelled — ignore

        setStatus('error');
        setError({ code: 'NETWORK', message: 'Network error. Check your connection and try again.' });
        setIsStale(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(debounceTimer);
      abortRef.current?.abort();
    };
    // Intentionally omit `data` from deps — we only want to re-run on key/tick change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refreshTick, debounceMs]);

  return { status, data, error, isStale, refresh };
}
