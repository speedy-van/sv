export const SITE = {
  name: "Speedy Van",
  tagline: "Moving Scotland. Perfected.",
  domain: "speedy-van.co.uk",
  url: "https://www.speedy-van.co.uk",
  phone: {
    display: "01202 129 746",
    href: "tel:+441202129746",
  },
  whatsapp: {
    display: "07481 586 574",
    href: "https://wa.me/447481586574",
  },
  email: "support@speedy-van.co.uk",
  address: "1 Barrack Street, Office 2.18, Hamilton ML3 0HS",
  social: {
    instagram: "https://www.instagram.com/speedyvanscotland",
    facebook: "https://www.facebook.com/speedyvanscotland",
    tiktok: "https://www.tiktok.com/@speedyvanscotland",
  },
  ios: "https://apps.apple.com/gb/app/speedy-van/id0000000000",
} as const;

export const NAV_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Areas", href: "/areas" },
  { label: "Pricing", href: "/pricing" },
  { label: "How It Works", href: "/how-it-works" },
] as const;
