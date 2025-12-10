import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Moving Service UK | Affordable Student Removals | Speedy Van',
  description: 'Affordable student moving service across the UK. Specializing in university and student accommodation moves. From £60. Flexible booking for term starts and ends. Book your student move online.',
  keywords: 'student moving service, student removals, university moving, student accommodation moving, affordable student movers, student relocation, student house moving, university removals',
  alternates: { canonical: 'https://speedy-van.co.uk/services/student' },
  openGraph: {
    title: 'Student Moving Service UK | Affordable Student Removals',
    description: 'Affordable student moving service. Specializing in university moves from £60. Flexible booking for term starts and ends.',
    url: 'https://speedy-van.co.uk/services/student',
    siteName: 'Speedy Van',
    images: [
      { url: '/og/og-student.jpg', width: 1200, height: 630, alt: 'Affordable student moving service' },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
    title: 'Student Moving Service UK | Affordable Student Removals',
    description: 'Affordable student moving service from £60. Flexible booking for term starts and ends.',
  },
};

