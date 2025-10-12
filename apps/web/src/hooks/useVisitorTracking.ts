'use client';

import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
    // Get or create session ID (expires after 30 minutes of inactivity)
    let sessionId = sessionStorage.getItem('visitor_session_id');
    const sessionTimestamp = sessionStorage.getItem('visitor_session_timestamp');
    
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    if (!sessionId || !sessionTimestamp || now - parseInt(sessionTimestamp) > thirtyMinutes) {
      sessionId = uuidv4();
      sessionStorage.setItem('visitor_session_id', sessionId);
    }
    
    sessionStorage.setItem('visitor_session_timestamp', now.toString());
    sessionIdRef.current = sessionId;

    // Get or create visitor ID (persists across sessions)
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = uuidv4();
      localStorage.setItem('visitor_id', visitorId);
    }
    visitorIdRef.current = visitorId;
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

  const getGeolocation = (): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        { timeout: 5000, maximumAge: 300000 } // 5 second timeout, cache for 5 minutes
      );
    });
  };

  const trackPageView = async (page: string) => {
    try {
      if (!sessionIdRef.current) return;

      const deviceInfo = getDeviceInfo();
      const geoLocation = await getGeolocation();

      const trackingData = {
        sessionId: sessionIdRef.current,
        visitorId: visitorIdRef.current,
        page,
        referrer: document.referrer || undefined,
        ...deviceInfo,
        latitude: geoLocation?.coords.latitude,
        longitude: geoLocation?.coords.longitude,
      };

      await fetch('/api/visitors/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingData),
      });

      lastPageRef.current = page;
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  const trackAction = async (action: string, actionData?: any) => {
    try {
      if (!trackActions || !sessionIdRef.current) return;

      const deviceInfo = getDeviceInfo();

      await fetch('/api/visitors/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          visitorId: visitorIdRef.current,
          page: window.location.pathname,
          action,
          actionData,
          ...deviceInfo,
        }),
      });
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
