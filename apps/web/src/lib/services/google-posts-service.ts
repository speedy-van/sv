/**
 * Google Posts Service
 * 
 * Manages Google Business Profile posts for Speedy Van
 * Provides templates and automation for regular posting
 */

export interface GooglePost {
  id: string;
  type: 'offer' | 'update' | 'event' | 'product';
  title: string;
  content: string;
  image: string;
  ctaType: 'book' | 'call' | 'learn_more' | 'sign_up' | 'order';
  ctaUrl?: string;
  startDate?: string;
  endDate?: string;
  offerCode?: string;
  keywords: string[];
}

export const GOOGLE_POSTS_LIBRARY: GooglePost[] = [
  // Week 1: Service Announcement
  {
    id: 'post-001',
    type: 'update',
    title: 'Professional Moving Services Across the UK',
    content: `🚚 Professional Moving Services Across the UK

Need a reliable man and van? Speedy Van offers same-day service from £25/hour!

✅ Fully insured drivers
✅ 50,000+ happy customers
✅ 95% on-time delivery
✅ 24/7 support

Covering London, Manchester, Birmingham, Glasgow, Edinburgh, and all UK cities.

Book now at speedy-van.co.uk or call 01202129764`,
    image: '/images/gbp/speedy-van-hero-banner.png',
    ctaType: 'book',
    ctaUrl: 'https://speedy-van.co.uk/booking',
    keywords: ['moving services', 'man and van', 'uk delivery', 'same-day service'],
  },

  // Week 2: Special Offer
  {
    id: 'post-002',
    type: 'offer',
    title: '10% Off Your First Booking!',
    content: `📦 10% Off Your First Booking!

Moving to Manchester, Birmingham, or Glasgow? Get 10% off your first move with Speedy Van!

✨ Professional furniture moving across the UK
✨ Same-day service available
✨ Fully insured and DBS-checked drivers

Use code: FIRST10
Book online: speedy-van.co.uk

Valid until end of month. Terms apply.
Call 01202129764 for details.`,
    image: '/images/gbp/speedy-van-london-delivery.png',
    ctaType: 'book',
    ctaUrl: 'https://speedy-van.co.uk/booking',
    offerCode: 'FIRST10',
    keywords: ['discount', 'first booking', 'special offer', 'furniture moving'],
  },

  // Week 3: Student Focus
  {
    id: 'post-003',
    type: 'update',
    title: 'Student Moving? We\'ve Got You Covered!',
    content: `🎓 Student Moving? We've Got You Covered!

Special student discounts on all moves. Perfect for university relocations.

✅ Affordable rates from £40
✅ Flexible scheduling
✅ Professional service
✅ Packing materials available

Edinburgh, Leeds, Bristol, Manchester - we cover it all!

Book now: speedy-van.co.uk
Student ID required. Call 01202129764`,
    image: '/images/gbp/furniture-transport.png',
    ctaType: 'learn_more',
    ctaUrl: 'https://speedy-van.co.uk/blog/student-moves',
    keywords: ['student moves', 'university', 'affordable', 'student discount'],
  },

  // Week 4: Social Proof
  {
    id: 'post-004',
    type: 'update',
    title: '50,000+ Happy Customers Trust Speedy Van!',
    content: `⭐ 50,000+ Happy Customers Trust Speedy Van!

"Excellent service from start to finish. The team was professional, careful with our furniture, and completed the move faster than expected. Highly recommend!" 
- Sarah M., London

🏆 95% on-time delivery
🏆 5-star rated service
🏆 Fully insured drivers

Experience the UK's most reliable moving service.

Get your free quote today: speedy-van.co.uk
📞 01202129764`,
    image: '/images/gbp/speedy-van-glasgow-moving.png',
    ctaType: 'call',
    keywords: ['testimonial', 'customer review', 'reliable service', '5-star'],
  },

  // Week 5: Same-Day Service
  {
    id: 'post-005',
    type: 'update',
    title: 'Need It Moved Today? We Can Help!',
    content: `⚡ Need It Moved Today? We Can Help!

Speedy Van offers same-day delivery services across the UK.

✅ Urgent furniture moves
✅ Last-minute relocations
✅ Emergency deliveries
✅ Available 7 days a week

From London to Edinburgh, we've got you covered.

Book online now: speedy-van.co.uk
Or call for immediate service: 01202129764

Subject to availability. Book early to secure your slot!`,
    image: '/images/gbp/speedy-van-manchester-service.png',
    ctaType: 'book',
    ctaUrl: 'https://speedy-van.co.uk/booking',
    keywords: ['same-day', 'urgent delivery', 'emergency', 'fast service'],
  },

  // Week 6: Business Services
  {
    id: 'post-006',
    type: 'update',
    title: 'Office Relocation Made Easy',
    content: `💼 Office Relocation Made Easy

Professional business moving services with minimal downtime.

✅ IT equipment handling
✅ Furniture disassembly/assembly
✅ Secure document transport
✅ Weekend/evening moves available

From small offices to large corporate relocations, we handle it all.

Get a free business quote: speedy-van.co.uk
📞 01202129764

Serving businesses across London, Manchester, Birmingham, and all UK cities.`,
    image: '/images/gbp/operations_excellence.png',
    ctaType: 'learn_more',
    ctaUrl: 'https://speedy-van.co.uk/blog/office-relocation',
    keywords: ['office relocation', 'business moving', 'corporate', 'commercial'],
  },

  // Week 7: Summer Season
  {
    id: 'post-007',
    type: 'update',
    title: 'Summer Moving Season is Here!',
    content: `☀️ Summer Moving Season is Here!

Beat the rush! Book your move with Speedy Van today.

🏡 House removals from £50
🚚 Man and van from £25/hour
📦 Packing services available

July and August are our busiest months. Secure your preferred date now!

Book online: speedy-van.co.uk
Call: 01202129764

Covering all UK cities with professional, reliable service.`,
    image: '/images/gbp/glasgow-service.png',
    ctaType: 'book',
    ctaUrl: 'https://speedy-van.co.uk/booking',
    keywords: ['summer moving', 'peak season', 'house removals', 'book early'],
  },

  // Week 8: FAQ
  {
    id: 'post-008',
    type: 'update',
    title: 'Frequently Asked Questions',
    content: `❓ Frequently Asked Questions

Q: What areas do you cover?
A: The entire UK! London, Manchester, Birmingham, Glasgow, Edinburgh, and everywhere in between.

Q: Are your drivers insured?
A: Yes! All drivers are fully insured, DBS checked, and professionally trained.

Q: Can I track my delivery?
A: Absolutely! Real-time tracking available through our website and app.

More questions? Visit speedy-van.co.uk
Or call us: 01202129764`,
    image: '/images/gbp/executive_team.png',
    ctaType: 'learn_more',
    ctaUrl: 'https://speedy-van.co.uk',
    keywords: ['faq', 'questions', 'information', 'help'],
  },

  // Week 9: Furniture Assembly
  {
    id: 'post-009',
    type: 'update',
    title: 'Furniture Assembly Services',
    content: `🔧 Furniture Assembly Services

Don't struggle with flat-pack furniture! Let our experts handle it.

✅ IKEA assembly specialists
✅ Beds, wardrobes, tables
✅ Disassembly for moves
✅ Professional tools included

From £30 per item. Available across the UK.

Book online: speedy-van.co.uk
Call: 01202129764

Combine with our moving services for a complete solution!`,
    image: '/images/gbp/furniture-transport.png',
    ctaType: 'book',
    ctaUrl: 'https://speedy-van.co.uk/booking',
    keywords: ['furniture assembly', 'ikea', 'flat-pack', 'installation'],
  },

  // Week 10: Packing Services
  {
    id: 'post-010',
    type: 'update',
    title: 'Professional Packing Services',
    content: `📦 Professional Packing Services

Make your move stress-free with our expert packing team.

✅ High-quality packing materials
✅ Fragile item specialists
✅ Boxes, bubble wrap, tape included
✅ From £20/hour

We'll pack it, move it, and unpack it!

Book now: speedy-van.co.uk
📞 01202129764

Available across London, Manchester, Birmingham, and all UK cities.`,
    image: '/images/gbp/operations_excellence.png',
    ctaType: 'book',
    ctaUrl: 'https://speedy-van.co.uk/booking',
    keywords: ['packing services', 'packing materials', 'professional packing', 'fragile items'],
  },
];

/**
 * Get a post by ID
 */
export function getPostById(id: string): GooglePost | undefined {
  return GOOGLE_POSTS_LIBRARY.find(post => post.id === id);
}

/**
 * Get posts by type
 */
export function getPostsByType(type: GooglePost['type']): GooglePost[] {
  return GOOGLE_POSTS_LIBRARY.filter(post => post.type === type);
}

/**
 * Get next post to publish (simple rotation)
 */
export function getNextPost(lastPublishedId?: string): GooglePost {
  if (!lastPublishedId) {
    return GOOGLE_POSTS_LIBRARY[0];
  }
  
  const currentIndex = GOOGLE_POSTS_LIBRARY.findIndex(post => post.id === lastPublishedId);
  const nextIndex = (currentIndex + 1) % GOOGLE_POSTS_LIBRARY.length;
  
  return GOOGLE_POSTS_LIBRARY[nextIndex];
}

/**
 * Get seasonal post recommendations
 */
export function getSeasonalPosts(month: number): GooglePost[] {
  // Spring (March-May): 3-5
  if (month >= 3 && month <= 5) {
    return GOOGLE_POSTS_LIBRARY.filter(post => 
      post.keywords.some(k => k.includes('student') || k.includes('spring'))
    );
  }
  
  // Summer (June-August): 6-8
  if (month >= 6 && month <= 8) {
    return GOOGLE_POSTS_LIBRARY.filter(post => 
      post.keywords.some(k => k.includes('summer') || k.includes('peak'))
    );
  }
  
  // Autumn (September-November): 9-11
  if (month >= 9 && month <= 11) {
    return GOOGLE_POSTS_LIBRARY.filter(post => 
      post.keywords.some(k => k.includes('student') || k.includes('university'))
    );
  }
  
  // Winter (December-February): 12, 1, 2
  return GOOGLE_POSTS_LIBRARY.filter(post => 
    post.keywords.some(k => k.includes('holiday') || k.includes('winter'))
  );
}

/**
 * Format post for Google Business Profile API
 */
export function formatPostForAPI(post: GooglePost) {
  return {
    languageCode: 'en-GB',
    summary: post.title,
    callToAction: {
      actionType: post.ctaType.toUpperCase(),
      url: post.ctaUrl,
    },
    media: [
      {
        mediaFormat: 'PHOTO',
        sourceUrl: post.image,
      },
    ],
    topicType: post.type.toUpperCase(),
    ...(post.startDate && { event: { schedule: { startDate: post.startDate, endDate: post.endDate } } }),
    ...(post.offerCode && { offer: { couponCode: post.offerCode, redeemOnlineUrl: post.ctaUrl } }),
  };
}

export default {
  GOOGLE_POSTS_LIBRARY,
  getPostById,
  getPostsByType,
  getNextPost,
  getSeasonalPosts,
  formatPostForAPI,
};

