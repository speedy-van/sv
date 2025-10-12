/**
 * Item Images Display System
 * Handles image display for items independently from catalog data
 */

export interface ItemImage {
  id: string;
  name: string;
  category: string;
  imagePath: string;
  fallbackImage?: string;
  description?: string;
  tags?: string[];
}

// Image mapping for display purposes
export const ITEM_IMAGES: Record<string, ItemImage> = {
  // Fitness Equipment
  'weight-rack': {
    id: 'weight-rack',
    name: 'Weight Rack',
    category: 'fitness',
    imagePath: '/items/fitness/weight-rack.png',
    fallbackImage: '/items/fitness/gym_equipment.png',
    description: 'Weight rack for gym equipment',
    tags: ['gym', 'weights', 'fitness']
  },
  'ab-machine': {
    id: 'ab-machine',
    name: 'Abdominal Machine',
    category: 'fitness',
    imagePath: '/items/fitness/ab-machine.png',
    fallbackImage: '/items/fitness/gym_equipment.png',
    description: 'Abdominal exercise machine'
  },
  'treadmill': {
    id: 'treadmill',
    name: 'Treadmill',
    category: 'fitness',
    imagePath: '/items/misc/treadmill.png',
    fallbackImage: '/items/fitness/gym_equipment.png'
  },

  // Office Equipment
  'office-chair': {
    id: 'office-chair',
    name: 'Office Chair',
    category: 'office',
    imagePath: '/items/furniture/office_chair.png',
    fallbackImage: '/items/furniture/chair.png',
    description: 'Ergonomic office chair'
  },
  'desk': {
    id: 'desk',
    name: 'Desk',
    category: 'office',
    imagePath: '/items/furniture/desk.png',
    fallbackImage: '/items/furniture/office_desk.png',
    description: 'Office desk'
  },
  'filing-cabinet-4drawer': {
    id: 'filing-cabinet-4drawer',
    name: '4-Drawer Filing Cabinet',
    category: 'office',
    imagePath: '/items/furniture/filing_cabinet.png',
    fallbackImage: '/items/office/cabinet.png',
    description: 'Four drawer filing cabinet'
  },

  // Boxes and Storage
  'box-small': {
    id: 'box-small',
    name: 'Small Box',
    category: 'boxes',
    imagePath: '/items/boxes/small-box.png',
    fallbackImage: '/items/boxes/box.png',
    description: 'Small moving box'
  },
  'box-medium': {
    id: 'box-medium',
    name: 'Medium Box',
    category: 'boxes',
    imagePath: '/items/boxes/medium-box.png',
    fallbackImage: '/items/boxes/box.png',
    description: 'Medium moving box'
  },
  'box-large': {
    id: 'box-large',
    name: 'Large Box',
    category: 'boxes',
    imagePath: '/items/boxes/large-box.png',
    fallbackImage: '/items/boxes/box.png',
    description: 'Large moving box'
  },
  'wardrobe-box': {
    id: 'garment-box',
    name: 'Wardrobe Box',
    category: 'boxes',
    imagePath: '/items/boxes/wardrobe-box.png',
    fallbackImage: '/items/boxes/box.png',
    description: 'Wardrobe hanging box'
  },

  // Kitchen Items
  'kitchenware-box': {
    id: 'kitchenware-box',
    name: 'Kitchen Items Box',
    category: 'kitchen',
    imagePath: '/items/kitchen/kitchen.png',
    fallbackImage: '/items/boxes/box.png',
    description: 'Kitchen utensils and items'
  },
  'mixer-stand': {
    id: 'mixer-stand',
    name: 'Stand Mixer',
    category: 'kitchen',
    imagePath: '/items/appliances/mixer.png',
    fallbackImage: '/items/kitchen/kitchen.png',
    description: 'Kitchen stand mixer'
  },
  'refrigerator': {
    id: 'fridge',
    name: 'Refrigerator',
    category: 'kitchen',
    imagePath: '/items/appliances/refrigerator.png',
    fallbackImage: '/items/appliances/fridge_freezer.png',
    description: 'Kitchen refrigerator'
  },

  // Bathroom Items
  'toilet': {
    id: 'toilet',
    name: 'Toilet',
    category: 'bathroom',
    imagePath: '/items/bathroom/toilet.png',
    fallbackImage: '/items/bathroom/bathroom.png',
    description: 'Bathroom toilet'
  },
  'basin': {
    id: 'basin',
    name: 'Wash Basin',
    category: 'bathroom',
    imagePath: '/items/bathroom/basin.png',
    fallbackImage: '/items/bathroom/bathroom.png',
    description: 'Bathroom wash basin'
  },
  'bath': {
    id: 'bath',
    name: 'Bathtub',
    category: 'bathroom',
    imagePath: '/items/bathroom/bathtub.png',
    fallbackImage: '/items/bathroom/bathroom.png',
    description: 'Bathroom bathtub'
  },

  // Furniture
  'sofa': {
    id: 'sofa',
    name: 'Sofa',
    category: 'furniture',
    imagePath: '/items/furniture/sofa.png',
    fallbackImage: '/items/furniture/furniture.png',
    description: 'Living room sofa'
  },
  'bed': {
    id: 'bed',
    name: 'Bed',
    category: 'furniture',
    imagePath: '/items/furniture/bed.png',
    fallbackImage: '/items/furniture/bed_frame.png',
    description: 'Bedroom bed'
  },
  'dining-table': {
    id: 'dining-table',
    name: 'Dining Table',
    category: 'furniture',
    imagePath: '/items/furniture/dining_table.png',
    fallbackImage: '/items/furniture/table.png',
    description: 'Dining room table'
  },
  'wardrobe': {
    id: 'wardrobe',
    name: 'Wardrobe',
    category: 'furniture',
    imagePath: '/items/furniture/wardrobe.png',
    fallbackImage: '/items/furniture/furniture.png',
    description: 'Bedroom wardrobe'
  },
  'bookshelf': {
    id: 'bookshelf',
    name: 'Bookshelf',
    category: 'furniture',
    imagePath: '/items/furniture/bookshelf.png',
    fallbackImage: '/items/furniture/book_shelf.png',
    description: 'Book storage shelf'
  },

  // Electronics
  'tv': {
    id: 'television',
    name: 'Television',
    category: 'electronics',
    imagePath: '/items/electronics/tv.png',
    fallbackImage: '/items/electronics/television.png',
    description: 'Television set'
  },
  'computer': {
    id: 'computer',
    name: 'Computer',
    category: 'electronics',
    imagePath: '/items/electronics/computer.png',
    fallbackImage: '/items/electronics/electronics.png',
    description: 'Desktop computer'
  },
  'printer': {
    id: 'printer',
    name: 'Printer',
    category: 'electronics',
    imagePath: '/items/electronics/printer_scanner.png',
    fallbackImage: '/items/electronics/electronics.png',
    description: 'Office printer'
  },

  // Appliances
  'washing-machine': {
    id: 'washing-machine',
    name: 'Washing Machine',
    category: 'appliances',
    imagePath: '/items/appliances/washer.png',
    fallbackImage: '/items/appliances/appliances.png',
    description: 'Washing machine'
  },
  'dishwasher': {
    id: 'dishwasher',
    name: 'Dishwasher',
    category: 'appliances',
    imagePath: '/items/appliances/dishwasher.png',
    fallbackImage: '/items/appliances/appliances.png',
    description: 'Kitchen dishwasher'
  },
  'microwave': {
    id: 'microwave',
    name: 'Microwave',
    category: 'appliances',
    imagePath: '/items/appliances/microwave.png',
    fallbackImage: '/items/appliances/appliances.png',
    description: 'Kitchen microwave'
  },

  // Lighting
  'floor-lamp': {
    id: 'floor-lamp',
    name: 'Floor Lamp',
    category: 'lighting',
    imagePath: '/items/misc/lamp.png',
    fallbackImage: '/items/lighting/lamp.png',
    description: 'Floor standing lamp'
  },
  'table-lamp': {
    id: 'table-lamp',
    name: 'Table Lamp',
    category: 'lighting',
    imagePath: '/items/misc/lamp.png',
    fallbackImage: '/items/lighting/lamp.png',
    description: 'Table lamp'
  },

  // General Items
  'bicycle': {
    id: 'bicycle',
    name: 'Bicycle',
    category: 'general',
    imagePath: '/items/misc/bicycle.png',
    fallbackImage: '/items/misc/sports.png',
    description: 'Standard bicycle'
  },
  'mirror': {
    id: 'mirror',
    name: 'Mirror',
    category: 'general',
    imagePath: '/items/misc/mirror.png',
    fallbackImage: '/items/misc/other.png',
    description: 'Wall or floor mirror'
  },
  'piano': {
    id: 'piano',
    name: 'Piano',
    category: 'general',
    imagePath: '/items/misc/piano.png',
    fallbackImage: '/items/misc/other.png',
    description: 'Musical piano'
  }
};

// Category-based fallback images
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'fitness': '/items/misc/gym_equipment.png',
  'office': '/items/furniture/office_desk.png',
  'boxes': '/items/boxes/box.png',
  'kitchen': '/items/kitchen/kitchen.png',
  'bathroom': '/items/bathroom/bathroom.png',
  'furniture': '/items/furniture/furniture.png',
  'electronics': '/items/electronics/electronics.png',
  'appliances': '/items/appliances/appliances.png',
  'lighting': '/items/misc/lamp.png',
  'flooring': '/items/misc/other.png',
  'soft-furnishing': '/items/furniture/furniture.png',
  'general': '/items/misc/other.png',
  'misc': '/items/misc/other.png'
};

// Default fallback image
export const DEFAULT_ITEM_IMAGE = '/items/misc/other.png';

/**
 * Get image for an item by ID
 */
export function getItemImage(itemId: string, category?: string): string {
  // First try to find exact match
  const itemImage = ITEM_IMAGES[itemId];
  if (itemImage) {
    return itemImage.imagePath;
  }

  // Try category fallback
  if (category && CATEGORY_FALLBACK_IMAGES[category]) {
    return CATEGORY_FALLBACK_IMAGES[category];
  }

  // Default fallback
  return DEFAULT_ITEM_IMAGE;
}

/**
 * Get image with fallback for an item
 */
export function getItemImageWithFallback(itemId: string, category?: string): { primary: string; fallback: string } {
  const itemImage = ITEM_IMAGES[itemId];
  
  if (itemImage) {
    return {
      primary: itemImage.imagePath,
      fallback: itemImage.fallbackImage || CATEGORY_FALLBACK_IMAGES[itemImage.category] || DEFAULT_ITEM_IMAGE
    };
  }

  const categoryFallback = category ? CATEGORY_FALLBACK_IMAGES[category] : DEFAULT_ITEM_IMAGE;
  
  return {
    primary: categoryFallback,
    fallback: DEFAULT_ITEM_IMAGE
  };
}

/**
 * Get all images for a category
 */
export function getImagesByCategory(category: string): ItemImage[] {
  return Object.values(ITEM_IMAGES).filter(image => image.category === category);
}

/**
 * Search images by name or tags
 */
export function searchImages(query: string): ItemImage[] {
  const searchTerm = query.toLowerCase();
  return Object.values(ITEM_IMAGES).filter(image => 
    image.name.toLowerCase().includes(searchTerm) ||
    image.description?.toLowerCase().includes(searchTerm) ||
    image.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
  );
}

/**
 * Check if image exists for item
 */
export function hasItemImage(itemId: string): boolean {
  return itemId in ITEM_IMAGES;
}
