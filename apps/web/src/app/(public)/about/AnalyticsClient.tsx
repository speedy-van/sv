'use client';

import { useEffect } from 'react';

type AnalyticsEventProps = Record<string, unknown> | undefined;

function sendAnalyticsEvent(eventName: string, props?: AnalyticsEventProps) {
  try {
    const w = window as any;
    if (typeof w.plausible === 'function') {
      w.plausible(eventName, { props: props || {} });
      return;
    }
    if (typeof w.gtag === 'function') {
      w.gtag('event', eventName, props || {});
      return;
    }
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: eventName, ...(props || {}) });
      return;
    }
  } catch (_) {}
}

export default function AnalyticsClient() {
  useEffect(() => {
    // Fire view event once on mount
    sendAnalyticsEvent('about_view');

    // Delegate click tracking for elements with data-analytics
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest('[data-analytics]') as HTMLElement | null;
      if (!el) return;
      const eventName = el.getAttribute('data-analytics');
      if (!eventName) return;
      const propsAttr = el.getAttribute('data-analytics-props');
      let props: AnalyticsEventProps;
      try {
        props = propsAttr ? JSON.parse(propsAttr) : undefined;
      } catch {
        props = undefined;
      }
      sendAnalyticsEvent(eventName, props);
    };
    document.addEventListener('click', onClick);

    // Scroll depth tracking at 25/50/75/100
    const milestones = new Set<number>();
    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const winHeight = window.innerHeight;
      const progress = Math.min(
        100,
        Math.round(((scrollTop + winHeight) / docHeight) * 100)
      );
      [25, 50, 75, 100].forEach(m => {
        if (progress >= m && !milestones.has(m)) {
          milestones.add(m);
          sendAnalyticsEvent('about_scroll_depth', { depth: m });
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Testimonials visibility
    let testimonialsObserved = false;
    const testimonialsEl = document.getElementById('testimonials');
    let observer: IntersectionObserver | null = null;
    if (testimonialsEl && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (
              !testimonialsObserved &&
              entry.isIntersecting &&
              entry.intersectionRatio > 0
            ) {
              testimonialsObserved = true;
              sendAnalyticsEvent('about_testimonials_view');
              observer && observer.disconnect();
            }
          });
        },
        { threshold: [0.2] }
      );
      observer.observe(testimonialsEl);
    }

    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('scroll', onScroll as any);
      if (observer) observer.disconnect();
    };
  }, []);

  return null;
}
