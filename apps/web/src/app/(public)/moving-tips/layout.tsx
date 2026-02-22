import { Metadata } from 'next';
import { APP_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: 'Expert Moving Tips & Advice | Speedy Van',
  description: 'Get expert moving tips and advice from professional movers. Learn how to pack, organize, and move efficiently. Free moving checklist included.',
  keywords: 'moving tips, moving advice, packing tips, moving house tips, relocation tips',
  alternates: { canonical: `${APP_BASE_URL}/moving-tips` },
  openGraph: {
    title: 'Expert Moving Tips & Advice | Speedy Van',
    description: 'Professional moving tips to make your move stress-free',
    type: 'article',
  },
};

export default function MovingTipsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
