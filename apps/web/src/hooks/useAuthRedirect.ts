import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Custom hook to handle authentication redirect logic
 * Provides utilities for managing returnTo URLs and redirects after authentication
 */
export function useAuthRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get returnTo from query params, with fallback to document.referrer
  const returnTo =
    searchParams?.get('returnTo') ||
    searchParams?.get('callbackUrl') ||
    (typeof window !== 'undefined' ? document.referrer : null);

  /**
   * Handle redirect after successful authentication
   * Cleans up URL parameters and redirects to the appropriate destination
   */
  const handleAuthRedirect = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Clean up URL parameters after successful auth
    const url = new URL(window.location.href);
    url.searchParams.delete('returnTo');
    url.searchParams.delete('callbackUrl');
    url.searchParams.delete('showAuth');

    // Determine redirect destination
    let redirectUrl = '/';

    if (returnTo) {
      // Validate returnTo URL to prevent open redirects
      try {
        const returnToUrl = new URL(returnTo, window.location.origin);
        // Only allow same-origin redirects
        if (returnToUrl.origin === window.location.origin) {
          redirectUrl =
            returnToUrl.pathname + returnToUrl.search + returnToUrl.hash;
        }
      } catch (error) {
        console.warn('Invalid returnTo URL:', returnTo);
      }
    }

    // Update URL without the auth parameters
    window.history.replaceState({}, '', url.toString());

    // Perform redirect
    if (redirectUrl === '/') {
      // Default landing: stay on home page
      // No auto-redirect away from Home unless user came from a protected page
      router.replace('/');
    } else {
      router.replace(redirectUrl);
    }
  }, [returnTo, router]);

  /**
   * Check if the current URL has auth parameters
   */
  const hasAuthParams = useCallback(() => {
    return !!(
      searchParams?.get('returnTo') ||
      searchParams?.get('callbackUrl') ||
      searchParams?.get('showAuth')
    );
  }, [searchParams]);

  /**
   * Get the clean returnTo URL (validated and sanitized)
   */
  const getValidReturnTo = useCallback(() => {
    if (!returnTo) return null;

    try {
      const returnToUrl = new URL(
        returnTo,
        typeof window !== 'undefined'
          ? window.location.origin
          : 'http://localhost'
      );
      // Only allow same-origin redirects
      if (
        returnToUrl.origin ===
        (typeof window !== 'undefined'
          ? window.location.origin
          : 'http://localhost')
      ) {
        return returnToUrl.pathname + returnToUrl.search + returnToUrl.hash;
      }
    } catch (error) {
      console.warn('Invalid returnTo URL:', returnTo);
    }

    return null;
  }, [returnTo]);

  return {
    returnTo,
    handleAuthRedirect,
    hasAuthParams,
    getValidReturnTo,
  };
}
