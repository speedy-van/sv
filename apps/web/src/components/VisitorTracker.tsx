'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';

export function VisitorTracker() {
  const pathname = usePathname();
  const { trackPageView, trackAction } = useVisitorTracking({
    enabled: true,
    trackPageViews: true,
    trackActions: true,
  });

  useEffect(() => {
    // Track page view when pathname changes
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname, trackPageView]);

  useEffect(() => {
    // Track specific user interactions
    const trackClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Track clicks on important elements
      if (target.tagName === 'A') {
        trackAction('link_click', {
          href: (target as HTMLAnchorElement).href,
          text: target.textContent,
        });
      } else if (target.tagName === 'BUTTON') {
        trackAction('button_click', {
          text: target.textContent,
          id: target.id,
          class: target.className,
        });
      }
    };

    // Track form submissions
    const trackFormSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement;
      trackAction('form_submit', {
        formId: form.id,
        formAction: form.action,
      });
    };

    // Track scroll depth
    let maxScrollDepth = 0;
    const trackScroll = () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollDepth > maxScrollDepth && scrollDepth % 25 === 0) {
        maxScrollDepth = scrollDepth;
        trackAction('scroll_depth', { depth: scrollDepth });
      }
    };

    document.addEventListener('click', trackClick);
    document.addEventListener('submit', trackFormSubmit);
    window.addEventListener('scroll', trackScroll, { passive: true });

    return () => {
      document.removeEventListener('click', trackClick);
      document.removeEventListener('submit', trackFormSubmit);
      window.removeEventListener('scroll', trackScroll);
    };
  }, [trackAction]);

  // This component doesn't render anything
  return null;
}
