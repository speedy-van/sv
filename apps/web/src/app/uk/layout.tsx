// Force Node runtime for SSG/ISR
export const runtime = 'nodejs';
export const revalidate = 86400; // 24h ISR
export const dynamic = 'force-static';
export const dynamicParams = false;

export default function UKLayout({ children }: { children: React.ReactNode }) {
  return children;
}
