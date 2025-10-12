import type {
  Organization,
  WithContext,
  FAQPage,
  BreadcrumbList,
} from 'schema-dts';

export function JsonLd() {
  const org: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Speedy Van',
    url: 'https://speedy-van.co.uk',
    logo: 'https://speedy-van.co.uk/logo.png',
  };
  const breadcrumbs: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://speedy-van.co.uk/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'About',
        item: 'https://speedy-van.co.uk/about',
      },
    ],
  };
  const faq: WithContext<FAQPage> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Are you insured?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Hire & Reward + Goods in Transit for moves.',
        },
      },
      {
        '@type': 'Question',
        name: 'Where do you operate?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Greater London, Glasgow, and longer UK routes.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I get a price?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use the Book flow for an instant quote.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you handle heavy items?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, with proper crew and equipment. Let us know in the booking.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do payments work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All payments are processed securely by Stripe.',
        },
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
    </>
  );
}
