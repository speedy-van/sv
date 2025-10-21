/**
 * Enhanced FAQ Schema Component
 * 
 * Implements FAQ structured data for rich results in Google Search
 * Supports FAQ drop-downs in search results
 */

import Script from 'next/script';

export interface FAQItem {
  question: string;
  answer: string;
}

interface EnhancedFAQSchemaProps {
  faqs: FAQItem[];
  pageUrl?: string;
}

export function EnhancedFAQSchema({ faqs, pageUrl }: EnhancedFAQSchemaProps) {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      strategy="afterInteractive"
    />
  );
}

export default EnhancedFAQSchema;

