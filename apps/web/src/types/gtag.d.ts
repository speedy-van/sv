/**
 * Google Analytics / Google Ads gtag TypeScript declarations
 * Enables type-safe conversion tracking
 */

declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'js' | 'set',
      targetId: string | Date,
      config?: {
        send_to?: string;
        value?: number;
        currency?: string;
        transaction_id?: string;
        event_category?: string;
        event_label?: string;
        [key: string]: any;
      }
    ) => void;
    dataLayer: any[];
  }
}

export {};
