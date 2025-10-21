/**
 * Article Schema Component
 * 
 * Implements Article structured data for blog posts
 * Supports rich results and Google News eligibility
 */

import Script from 'next/script';

interface ArticleSchemaProps {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
}

export function ArticleSchema({
  headline,
  description,
  author,
  datePublished,
  dateModified,
  image,
  url,
  keywords,
  articleSection,
  wordCount,
}: ArticleSchemaProps) {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: headline,
    description: description,
    image: image || 'https://speedy-van.co.uk/og-image.jpg',
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Speedy Van',
      logo: {
        '@type': 'ImageObject',
        url: 'https://speedy-van.co.uk/images/gbp/speedy_van_logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    ...(keywords && keywords.length > 0 && { keywords: keywords.join(', ') }),
    ...(articleSection && { articleSection: articleSection }),
    ...(wordCount && { wordCount: wordCount }),
  };

  return (
    <Script
      id="article-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      strategy="afterInteractive"
    />
  );
}

export default ArticleSchema;

