import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Outfit } from "next/font/google";
import { ReactNode } from "react";
import { Providers } from "@/lib/providers";
import { SITE } from "@/lib/site";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "Professional removals and man and van across Scotland. Fixed pricing, full insurance, drivers you can trust. Book online in under 2 minutes.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: SITE.url,
    title: `${SITE.name} — ${SITE.tagline}`,
    description:
      "Premium professional removals across Scotland. Fixed prices, full insurance, refined service.",
    siteName: SITE.name,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#09090B",
  width: "device-width",
  initialScale: 1,
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "MovingCompany",
  name: SITE.name,
  legalName: SITE.name,
  url: SITE.url,
  telephone: SITE.phone.href.replace("tel:", ""),
  email: SITE.email,
  image: `${SITE.url}/og-image.jpg`,
  logo: `${SITE.url}/icon-512.png`,
  priceRange: "££",
  areaServed: [
    { "@type": "Country", name: "United Kingdom" },
    { "@type": "AdministrativeArea", name: "Scotland" },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "1 Barrack Street, Office 2.18",
    addressLocality: "Hamilton",
    postalCode: "ML3 0HS",
    addressRegion: "South Lanarkshire",
    addressCountry: "GB",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "06:00",
      closes: "22:00",
    },
  ],
  sameAs: [SITE.social.instagram, SITE.social.facebook, SITE.social.tiktok],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${outfit.variable} ${dmSans.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
