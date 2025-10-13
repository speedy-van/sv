/**
 * Company constants for Speedy Van Removals Ltd
 */

export const COMPANY_INFO = {
  name: 'Speedy Van',
  legalName: 'SPEEDY VAN REMOVALS LTD',
  companyNumber: 'SC865658',
  companyType: 'Private Limited by Shares',
  registeredIn: 'Scotland',
  incorporationDate: '2025-10-07',
  registrar: 'Companies House - Scotland',
  tagline: 'Your trusted moving partner',
  description: 'Professional moving and delivery services across the UK',
  founded: '2020',
  website: 'https://speedy-van.co.uk',
  address: 'Office 2.18 1 Barrack St, Hamilton ML3 0HS',
  phone: '+44 7901846297',
  email: 'support@speedy-van.co.uk',
} as const;

export const COMPANY_CONTACT = {
  phone: '+44 7901846297',
  email: 'support@speedy-van.co.uk',
  address: 'Office 2.18 1 Barrack St, Hamilton ML3 0HS',
  supportPhone: '+44 7901846297',
  supportEmail: 'support@speedy-van.co.uk',
  emergencyPhone: '+44 7901846297',
  hours: {
    weekdays: '8:00 AM - 6:00 PM',
    weekends: '9:00 AM - 5:00 PM',
  },
} as const;

export const EMAIL_BRANDING = {
  primaryColor: '#2c3e50',
  secondaryColor: '#27ae60',
  logoUrl: 'https://speedy-van.co.uk/logo.png',
  socialLinks: {
    facebook: 'https://facebook.com/speedyvan',
    twitter: 'https://twitter.com/speedyvan',
    instagram: 'https://instagram.com/speedyvan',
  },
} as const;

export const SERVICE_AREAS = [
  'London',
  'Manchester',
  'Birmingham',
  'Liverpool',
  'Leeds',
  'Sheffield',
  'Bristol',
  'Newcastle',
  'Nottingham',
  'Leicester',
] as const;

export const BUSINESS_HOURS = {
  monday: { open: '08:00', close: '18:00' },
  tuesday: { open: '08:00', close: '18:00' },
  wednesday: { open: '08:00', close: '18:00' },
  thursday: { open: '08:00', close: '18:00' },
  friday: { open: '08:00', close: '18:00' },
  saturday: { open: '09:00', close: '17:00' },
  sunday: { open: '10:00', close: '16:00' },
} as const;