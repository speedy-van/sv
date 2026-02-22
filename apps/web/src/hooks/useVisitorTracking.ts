'use client';

import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  safeSessionStorageGetItem,
  safeSessionStorageSetItem,
  safeLocalStorageGetItem,
  safeLocalStorageSetItem,
} from '@/lib/safe-storage';

interface VisitorTrackingOptions {
  enabled?: boolean;
  trackPageViews?: boolean;
  trackActions?: boolean;
}

export function useVisitorTracking(options: VisitorTrackingOptions = {}) {
  const {
    enabled = true,
    trackPageViews = true,
    trackActions = true,
  } = options;

  const sessionIdRef = useRef<string | null>(null);
  const visitorIdRef = useRef<string | null>(null);
  const lastPageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Initialize session and visitor IDs
    initializeTracking();

    // Track initial page view
    if (trackPageViews) {
      trackPageView(window.location.pathname);
    }

    // Track page changes for SPAs
    const handleRouteChange = () => {
      const currentPage = window.location.pathname;
      if (currentPage !== lastPageRef.current && trackPageViews) {
        trackPageView(currentPage);
        lastPageRef.current = currentPage;
      }
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);

    // For Next.js or React Router (if using history API)
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      handleRouteChange();
    };

    // Track when user leaves
    const handleBeforeUnload = () => {
      trackAction('session_end', { duration: Date.now() - sessionStartTime });
    };

    const sessionStartTime = Date.now();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.history.pushState = originalPushState;
    };
  }, [enabled, trackPageViews]);

  const initializeTracking = () => {
    // Skip if running on server
    if (typeof window === 'undefined') return;

    try {
      // Get or create session ID (expires after 30 minutes of inactivity)
      let sessionId = safeSessionStorageGetItem('visitor_session_id');
      const sessionTimestamp = safeSessionStorageGetItem('visitor_session_timestamp');

      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;

      if (!sessionId || !sessionTimestamp || now - parseInt(sessionTimestamp) > thirtyMinutes) {
        sessionId = uuidv4();
        safeSessionStorageSetItem('visitor_session_id', sessionId);
      }

      safeSessionStorageSetItem('visitor_session_timestamp', now.toString());
      sessionIdRef.current = sessionId;

      // Get or create visitor ID (persists across sessions)
      let visitorId = safeLocalStorageGetItem('visitor_id');
      if (!visitorId) {
        visitorId = uuidv4();
        safeLocalStorageSetItem('visitor_id', visitorId);
      }
      visitorIdRef.current = visitorId;
    } catch {
      // If storage is completely unavailable, use temporary IDs
      sessionIdRef.current = sessionIdRef.current || uuidv4();
      visitorIdRef.current = visitorIdRef.current || uuidv4();
    }
  };

  const getDeviceInfo = () => {
    if (typeof window === 'undefined') return {};

    return {
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  };

  // Geolocation removed to improve Lighthouse Best Practices score
  // Only request geolocation when explicitly needed by user action

  const trackPageView = (page: string) => {
    try {
      // Skip if running on server
      if (typeof window === 'undefined') return;
      if (!sessionIdRef.current) return;

      const deviceInfo = getDeviceInfo();

      const trackingData = {
        sessionId: sessionIdRef.current,
        visitorId: visitorIdRef.current,
        page,
        referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
        ...deviceInfo,
      };

      // Use sendBeacon for non-blocking tracking (fires in background)
      const data = JSON.stringify(trackingData);
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/visitors/track', data);
      } else {
        // Fallback for old browsers (non-blocking fetch)
        fetch('/api/visitors/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {/* Ignore errors */});
      }

      lastPageRef.current = page;
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  const trackAction = (action: string, actionData?: any) => {
    try {
      // Skip if running on server
      if (typeof window === 'undefined') return;
      if (!trackActions || !sessionIdRef.current) return;

      const deviceInfo = getDeviceInfo();

      const data = JSON.stringify({
        sessionId: sessionIdRef.current,
        visitorId: visitorIdRef.current,
        page: window.location.pathname,
        action,
        actionData,
        ...deviceInfo,
      });

      // Use sendBeacon for non-blocking tracking
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/visitors/track', data);
      } else {
        // Fallback for old browsers
        fetch('/api/visitors/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {/* Ignore errors */});
      }
    } catch (error) {
      console.error('Failed to track action:', error);
    }
  };

  return {
    trackAction,
    trackPageView,
    sessionId: sessionIdRef.current,
    visitorId: visitorIdRef.current,
  };
}