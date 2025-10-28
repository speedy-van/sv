/**
 * Google Business Profile Configuration
 * 
 * Complete configuration for Speedy Van's Google Business Profile
 * to achieve 100% profile strength and maximum organic visibility
 */

export const GOOGLE_BUSINESS_PROFILE = {
  // Basic Information
  businessName: 'Speedy Van',
  legalName: 'SPEEDY VAN REMOVALS LTD',
  companyNumber: 'SC865658',
  
  // Primary Address (can be hidden for service-area businesses)
  address: {
    line1: '1 Barrack Street',
    line2: 'Office 2.18',
    city: 'Hamilton',
    postcode: 'ML3 0DG',
    country: 'United Kingdom',
    hideAddress: true, // Service-area business
  },
  
  // Contact Information
  contact: {
    primaryPhone: '+441202129746',
    secondaryPhone: '+447770498047',
    email: 'support@speedy-van.co.uk',
    website: 'https://speedy-van.co.uk',
  },
  
  // Business Description (750 characters max)
  description: `Speedy Van is a premium moving and delivery service operating nationwide across the United Kingdom. Based in Hamilton, we provide fast, reliable, and affordable van services covering London, Manchester, Birmingham, Glasgow, Edinburgh, Leeds, Liverpool, Bristol, Cardiff, Belfast, and every major city across England, Scotland, Wales, and Northern Ireland.

We specialize in furniture moving, house removals, same-day delivery, student moves, office relocations, and professional man and van services. With over 50,000 happy customers, 95% on-time delivery, and fully insured drivers, we offer 24/7 support and competitive pricing from £25/hour.

Whether you need to move a single item or an entire home, our experienced team handles your belongings with care. Book online instantly or call us for a free quote.`,
  
  // Categories (Primary + Additional)
  categories: {
    primary: 'Moving and storage service',
    additional: [
      'Moving supply store',
      'Courier service',
      'Delivery service',
      'Furniture moving service',
      'Piano moving service',
      'Van rental agency',
      'Storage facility',
      'Packing service',
      'Logistics service',
    ],
  },
  
  // Service Areas (Nationwide UK Coverage)
  serviceAreas: {
    countries: ['United Kingdom'],
    regions: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    majorCities: {
      england: [
        'London',
        'Manchester',
        'Birmingham',
        'Leeds',
        'Liverpool',
        'Bristol',
        'Newcastle upon Tyne',
        'Sheffield',
        'Nottingham',
        'Leicester',
        'Coventry',
        'Bradford',
        'Southampton',
        'Portsmouth',
        'Reading',
        'Derby',
        'Plymouth',
        'Wolverhampton',
        'Stoke-on-Trent',
        'Brighton',
      ],
      scotland: [
        'Glasgow',
        'Edinburgh',
        'Aberdeen',
        'Dundee',
        'Inverness',
        'Stirling',
        'Perth',
      ],
      wales: ['Cardiff', 'Swansea', 'Newport', 'Wrexham'],
      northernIreland: ['Belfast', 'Derry', 'Lisburn', 'Newry'],
    },
  },
  
  // Services with Price Ranges
  services: [
    {
      name: 'House Removals',
      description: 'Professional full-house moving services for homes of all sizes',
      priceRange: '£50 - £500',
      priceFrom: 50,
      unit: 'move',
    },
    {
      name: 'Man and Van Service',
      description: 'Flexible man and van hire for small to medium moves',
      priceRange: '£25 - £50 per hour',
      priceFrom: 25,
      unit: 'hour',
    },
    {
      name: 'Same-Day Delivery',
      description: 'Urgent same-day delivery services across the UK',
      priceRange: '£50 - £200',
      priceFrom: 50,
      unit: 'delivery',
    },
    {
      name: 'Student Moves',
      description: 'Affordable student relocation services with special discounts',
      priceRange: '£40 - £150',
      priceFrom: 40,
      unit: 'move',
    },
    {
      name: 'Office Relocation',
      description: 'Professional business and office moving services',
      priceRange: '£75 - £500 per hour',
      priceFrom: 75,
      unit: 'hour',
    },
    {
      name: 'Furniture Transport',
      description: 'Safe and secure furniture moving for individual items',
      priceRange: '£25 - £100',
      priceFrom: 25,
      unit: 'hour',
    },
    {
      name: 'Furniture Assembly',
      description: 'Professional furniture assembly and disassembly services',
      priceRange: '£30 - £80 per item',
      priceFrom: 30,
      unit: 'item',
    },
    {
      name: 'Packing Service',
      description: 'Professional packing services with high-quality materials',
      priceRange: '£20 - £50 per hour',
      priceFrom: 20,
      unit: 'hour',
    },
  ],
  
  // Business Hours
  hours: {
    monday: { open: '07:00', close: '22:00' },
    tuesday: { open: '07:00', close: '22:00' },
    wednesday: { open: '07:00', close: '22:00' },
    thursday: { open: '07:00', close: '22:00' },
    friday: { open: '07:00', close: '22:00' },
    saturday: { open: '08:00', close: '20:00' },
    sunday: { open: '08:00', close: '20:00' },
  },
  
  // Attributes (Features)
  attributes: [
    'Online booking',
    'Free quotes',
    'Same-day service',
    'Fully insured',
    '24/7 customer support',
    'Professional drivers',
    'Competitive pricing',
    'Nationwide coverage',
    'Real-time tracking',
    'Contactless delivery',
  ],
  
  // FAQ for Google Business Profile
  faq: [
    {
      question: 'What areas do you cover?',
      answer: 'We provide moving and delivery services nationwide across the entire United Kingdom, including all major cities in England, Scotland, Wales, and Northern Ireland.',
    },
    {
      question: 'How much do your services cost?',
      answer: 'Our man and van services start from £25/hour. House removals start from £50. We offer free instant quotes online or over the phone. Final prices depend on distance, items, and service type.',
    },
    {
      question: 'Do you offer same-day service?',
      answer: 'Yes! We offer same-day delivery and moving services across the UK. Book online or call us for urgent requests. Subject to availability.',
    },
    {
      question: 'Are your drivers insured?',
      answer: 'Yes, all our drivers are fully insured with comprehensive goods-in-transit insurance. Your belongings are protected throughout the entire journey.',
    },
    {
      question: 'How do I book a service?',
      answer: 'You can book instantly online at speedy-van.co.uk, call us on +44 7901 846297, or request a quote through our website. We respond within minutes.',
    },
    {
      question: 'Do you provide packing materials?',
      answer: 'Yes, we offer professional packing services and can supply boxes, bubble wrap, and other packing materials. This can be added to your booking.',
    },
    {
      question: 'Can you move furniture up stairs?',
      answer: 'Yes, our experienced team can move furniture up and down stairs. We assess access during booking and ensure we have the right team for the job.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards, bank transfers, and online payments through our secure booking system. Payment is typically taken after service completion.',
    },
  ],
  
  // Social Media Links
  socialMedia: {
    facebook: 'https://www.facebook.com/speedyvan',
    instagram: 'https://www.instagram.com/speedyvan',
    linkedin: 'https://www.linkedin.com/company/speedyvan',
    twitter: 'https://twitter.com/speedyvan',
  },
  
  // Statistics (for description and posts)
  stats: {
    customersServed: '50,000+',
    onTimeDelivery: '95%',
    averageRating: '4.8',
    yearsExperience: '5+',
    vehiclesInFleet: '50+',
  },
};

// Google Posts Templates
export const GOOGLE_POSTS_TEMPLATES = [
  {
    type: "offer",
    title: "20% Off Student Moves",
    description: "Special discount for students! Book your university move this month and save 20%. Valid for all UK universities.",
    cta: "Book Now",
    validUntil: "2025-09-30"
  },
  {
    type: "update",
    title: "Now Covering All of UK",
    description: "Great news! We now provide moving services nationwide across England, Scotland, Wales, and Northern Ireland. Same-day service available.",
    cta: "Get Quote"
  },
  {
    type: "event",
    title: "Free Moving Consultation",
    description: "Book a free consultation with our moving experts. We'll assess your needs and provide a detailed quote. Available this weekend.",
    cta: "Book Consultation",
    startDate: "2025-10-20",
    endDate: "2025-10-22"
  },
  {
    type: "offer",
    title: "Same-Day Delivery from £50",
    description: "Need something moved urgently? Our same-day delivery service starts from just £50. Available across all major UK cities.",
    cta: "Order Now"
  },
  {
    type: "update",
    title: "New Fleet of Eco-Friendly Vans",
    description: "We're proud to introduce our new fleet of Euro 6 compliant vans, reducing emissions while maintaining our premium service standards.",
    cta: "Learn More"
  }
];

// Review Response Templates
export const REVIEW_RESPONSE_TEMPLATES = {
  positive: [
    "Thank you so much for your wonderful review! We're delighted to hear that our team provided excellent service for your {service_type} in {location}. We look forward to helping you again in the future!",
    "We really appreciate your kind words! It's great to know our {service_type} service met your expectations. Thank you for choosing Speedy Van!",
    "Thank you for the 5-star review! We're thrilled that you had a positive experience with our team. We're always here when you need reliable moving services in {location}."
  ],
  negative: [
    "We sincerely apologize for your experience with our {service_type} service. This doesn't meet our standards. Please contact us directly at support@speedy-van.co.uk or call +44 7901 846297 so we can make this right.",
    "Thank you for bringing this to our attention. We take all feedback seriously and would like to resolve this issue. Please reach out to us directly so we can discuss how we can improve your experience."
  ],
  neutral: [
    "Thank you for your feedback. We're always working to improve our services. If there's anything specific we could have done better, please let us know at support@speedy-van.co.uk.",
    "We appreciate you taking the time to review our {service_type} service. Your feedback helps us improve. Please don't hesitate to reach out if you have any concerns."
  ]
};

export default GOOGLE_BUSINESS_PROFILE;

