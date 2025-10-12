import {
  ItemImage,
  CategoryInfo,
  ImageCategory,
} from '../../types/image-selection';

// Category definitions with metadata
export const CATEGORIES: Record<ImageCategory, CategoryInfo> = {
  furniture: {
    name: 'furniture',
    displayName: 'Furniture',
    icon: '🪑',
    count: 0,
    color: '#3182ce',
    description: 'Sofas, chairs, tables, beds, and other furniture items',
  },
  appliances: {
    name: 'appliances',
    displayName: 'Appliances',
    icon: '🔌',
    count: 0,
    color: '#38a169',
    description: 'Kitchen and home appliances',
  },
  electronics: {
    name: 'electronics',
    displayName: 'Electronics',
    icon: '📱',
    count: 0,
    color: '#d69e2e',
    description: 'TVs, computers, and electronic devices',
  },
  boxes: {
    name: 'boxes',
    displayName: 'Boxes & Containers',
    icon: '📦',
    count: 0,
    color: '#e53e3e',
    description: 'Various sized boxes and storage containers',
  },
  misc: {
    name: 'misc',
    displayName: 'Miscellaneous',
    icon: '🎯',
    count: 0,
    color: '#805ad5',
    description: 'Other items and equipment',
  },
};

// Image metadata organized by category
const IMAGE_DATA: Record<ImageCategory, ItemImage[]> = {
  furniture: [
    {
      id: 'sofa',
      path: '/items/furniture/sofa.png',
      category: 'furniture',
      name: 'Sofa',
      description: 'Comfortable living room sofa',
      tags: ['living room', 'seating', 'comfortable'],
      dimensions: { width: 800, height: 600 },
    },
    {
      id: 'chair',
      path: '/items/furniture/chair.png',
      category: 'furniture',
      name: 'Chair',
      description: 'Standard chair',
      tags: ['seating', 'basic'],
      dimensions: { width: 600, height: 800 },
    },
    {
      id: 'table',
      path: '/items/furniture/table.png',
      category: 'furniture',
      name: 'Table',
      description: 'Standard table',
      tags: ['surface', 'basic'],
      dimensions: { width: 800, height: 600 },
    },
    {
      id: 'bed',
      path: '/items/furniture/bed.png',
      category: 'furniture',
      name: 'Bed',
      description: 'Standard bed',
      tags: ['sleeping', 'bedroom'],
      dimensions: { width: 800, height: 600 },
    },
    {
      id: 'desk',
      path: '/items/furniture/desk.png',
      category: 'furniture',
      name: 'Desk',
      description: 'Office desk',
      tags: ['office', 'work', 'surface'],
      dimensions: { width: 800, height: 600 },
    },
    {
      id: 'bookshelf',
      path: '/items/furniture/bookshelf.png',
      category: 'furniture',
      name: 'Bookshelf',
      description: 'Bookshelf for storage',
      tags: ['storage', 'books', 'organization'],
      dimensions: { width: 600, height: 800 },
    },
    {
      id: 'coffee_table',
      path: '/items/furniture/coffee_table.png',
      category: 'furniture',
      name: 'Coffee Table',
      description: 'Living room coffee table',
      tags: ['living room', 'surface', 'decorative'],
      dimensions: { width: 800, height: 600 },
    },
    {
      id: 'dining_table',
      path: '/items/furniture/dining_table.png',
      category: 'furniture',
      name: 'Dining Table',
      description: 'Dining room table',
      tags: ['dining', 'meals', 'family'],
      dimensions: { width: 800, height: 600 },
    },
    {
      id: 'office_chair',
      path: '/items/furniture/office_chair.png',
      category: 'furniture',
      name: 'Office Chair',
      description: 'Ergonomic office chair',
      tags: ['office', 'ergonomic', 'comfortable'],
      dimensions: { width: 600, height: 800 },
    },
    {
      id: 'armchair',
      path: '/items/furniture/armchair.png',
      category: 'furniture',
      name: 'Armchair',
      description: 'Comfortable armchair',
      tags: ['seating', 'comfortable', 'living room'],
      dimensions: { width: 600, height: 800 },
    },
    {
      id: 'wardrobe',
      path: '/items/furniture/wardrobe.png',
      category: 'furniture',
      name: 'Wardrobe',
      description: 'Clothing storage wardrobe',
      tags: ['storage', 'clothing', 'bedroom'],
      dimensions: { width: 600, height: 800 },
    },
  ],
  appliances: [
    {
      id: 'refrigerator',
      path: '/items/appliances/refrigerator.png',
      category: 'appliances',
      name: 'Refrigerator',
      description: 'Kitchen refrigerator',
      tags: ['kitchen', 'cooling', 'essential'],
      dimensions: { width: 600, height: 800 },
    },
    {
      id: 'washer',
      path: '/items/appliances/washer.png',
      category: 'appliances',
      name: 'Washing Machine',
      description: 'Clothes washing machine',
      tags: ['laundry', 'cleaning', 'essential'],
      dimensions: { width: 600, height: 800 },
    },
    {
      id: 'dryer',
      path: '/items/appliances/dryer.png',
      category: 'appliances',
      name: 'Clothes Dryer',
      description: 'Clothes drying machine',
      tags: ['laundry', 'drying', 'essential'],
      dimensions: { width: 600, height: 800 },
    },
    {
      id: 'dishwasher',
      path: '/items/appliances/dishwasher.png',
      category: 'appliances',
      name: 'Dishwasher',
      description: 'Kitchen dishwasher',
      tags: ['kitchen', 'cleaning', 'dishes'],
      dimensions: { width: 600, height: 800 },
    },
    {
      id: 'oven',
      path: '/items/appliances/oven.png',
      category: 'appliances',
      name: 'Oven',
      description: 'Kitchen oven',
      tags: ['kitchen', 'cooking', 'baking'],
      dimensions: { width: 600, height: 800 },
    },
    {
      id: 'microwave',
      path: '/items/appliances/microwave.png',
      category: 'appliances',
      name: 'Microwave',
      description: 'Kitchen microwave',
      tags: ['kitchen', 'cooking', 'quick'],
      dimensions: { width: 600, height: 600 },
    },
    {
      id: 'vacuum_cleaner',
      path: '/items/appliances/vacuum_cleaner.png',
      category: 'appliances',
      name: 'Vacuum Cleaner',
      description: 'Floor cleaning vacuum',
      tags: ['cleaning', 'floor', 'maintenance'],
      dimensions: { width: 600, height: 600 },
    },
  ],
  electronics: [
    {
      id: 'tv',
      path: '/items/electronics/tv.png',
      category: 'electronics',
      name: 'Television',
      description: 'Flat screen TV',
      tags: ['entertainment', 'living room', 'screen'],
      dimensions: { width: 800, height: 600 },
    },
    {
      id: 'computer',
      path: '/items/electronics/computer.png',
      category: 'electronics',
      name: 'Computer',
      description: 'Desktop computer',
      tags: ['office', 'work', 'technology'],
      dimensions: { width: 600, height: 600 },
    },
    {
      id: 'computer_monitor',
      path: '/items/electronics/computer_monitor.png',
      category: 'electronics',
      name: 'Computer Monitor',
      description: 'Computer display monitor',
      tags: ['office', 'screen', 'work'],
      dimensions: { width: 600, height: 600 },
    },
    {
      id: 'printer_scanner',
      path: '/items/electronics/printer_scanner.png',
      category: 'electronics',
      name: 'Printer/Scanner',
      description: 'All-in-one printer and scanner',
      tags: ['office', 'printing', 'scanning'],
      dimensions: { width: 600, height: 600 },
    },
  ],
  boxes: [
    {
      id: 'large_box',
      path: '/items/boxes/large-box.png',
      category: 'boxes',
      name: 'Large Box',
      description: 'Large moving box',
      tags: ['storage', 'moving', 'large'],
      dimensions: { width: 600, height: 600 },
    },
    {
      id: 'medium_box',
      path: '/items/boxes/medium-box.png',
      category: 'boxes',
      name: 'Medium Box',
      description: 'Medium sized box',
      tags: ['storage', 'moving', 'medium'],
      dimensions: { width: 600, height: 600 },
    },
    {
      id: 'small_box',
      path: '/items/boxes/small-box.png',
      category: 'boxes',
      name: 'Small Box',
      description: 'Small moving box',
      tags: ['storage', 'moving', 'small'],
      dimensions: { width: 600, height: 600 },
    },
    {
      id: 'plastic_bin',
      path: '/items/boxes/plastic_bin.png',
      category: 'boxes',
      name: 'Plastic Bin',
      description: 'Plastic storage bin',
      tags: ['storage', 'plastic', 'durable'],
      dimensions: { width: 600, height: 600 },
    },
  ],
  misc: [
    {
      id: 'bicycle',
      path: '/items/misc/bicycle.png',
      category: 'misc',
      name: 'Bicycle',
      description: 'Standard bicycle',
      tags: ['transportation', 'exercise', 'outdoor'],
      dimensions: { width: 800, height: 600 },
    },
    {
      id: 'bbq_grill',
      path: '/items/misc/bbq_grill.png',
      category: 'misc',
      name: 'BBQ Grill',
      description: 'Outdoor barbecue grill',
      tags: ['outdoor', 'cooking', 'entertainment'],
      dimensions: { width: 800, height: 600 },
    },
    {
      id: 'treadmill',
      path: '/items/misc/treadmill.png',
      category: 'misc',
      name: 'Treadmill',
      description: 'Exercise treadmill',
      tags: ['exercise', 'fitness', 'indoor'],
      dimensions: { width: 800, height: 600 },
    },
    {
      id: 'piano',
      path: '/items/misc/piano.png',
      category: 'misc',
      name: 'Piano',
      description: 'Musical piano',
      tags: ['music', 'entertainment', 'large'],
      dimensions: { width: 800, height: 600 },
    },
    {
      id: 'lamp',
      path: '/items/misc/lamp.png',
      category: 'misc',
      name: 'Lamp',
      description: 'Table or floor lamp',
      tags: ['lighting', 'decorative', 'essential'],
      dimensions: { width: 600, height: 800 },
    },
    {
      id: 'mirror',
      path: '/items/misc/mirror.png',
      category: 'misc',
      name: 'Mirror',
      description: 'Wall or floor mirror',
      tags: ['decorative', 'bathroom', 'bedroom'],
      dimensions: { width: 600, height: 800 },
    },
    {
      id: 'suitcase',
      path: '/items/misc/suitcase.png',
      category: 'misc',
      name: 'Suitcase',
      description: 'Travel suitcase',
      tags: ['travel', 'storage', 'portable'],
      dimensions: { width: 600, height: 600 },
    },
  ],
};

// Update category counts
Object.keys(CATEGORIES).forEach(category => {
  CATEGORIES[category as ImageCategory].count =
    IMAGE_DATA[category as ImageCategory].length;
});

// Utility functions
export function getAllImages(): ItemImage[] {
  return Object.values(IMAGE_DATA).flat();
}

export function getImagesByCategory(category: ImageCategory): ItemImage[] {
  return IMAGE_DATA[category] || [];
}

export function getImageById(id: string): ItemImage | undefined {
  return getAllImages().find(img => img.id === id);
}

export function searchImages(
  query: string,
  category?: ImageCategory
): ItemImage[] {
  const searchTerm = query.toLowerCase();
  const images = category ? getImagesByCategory(category) : getAllImages();

  return images.filter(
    img =>
      img.name.toLowerCase().includes(searchTerm) ||
      img.description?.toLowerCase().includes(searchTerm) ||
      img.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
}

export function getCategories(): CategoryInfo[] {
  return Object.values(CATEGORIES);
}

export function getCategoryByName(name: string): CategoryInfo | undefined {
  return CATEGORIES[name as ImageCategory];
}

export function getPopularImages(limit: number = 10): ItemImage[] {
  // For now, return first N images from each category
  // In a real app, this would be based on usage analytics
  const popular: any[] = [];
  Object.values(IMAGE_DATA).forEach(categoryImages => {
    popular.push(
      ...categoryImages.slice(
        0,
        Math.ceil(limit / Object.keys(IMAGE_DATA).length)
      )
    );
  });
  return popular.slice(0, limit);
}

export function getRecentlyUsedImages(
  userId?: string,
  limit: number = 10
): ItemImage[] {
  // In a real app, this would fetch from user's history
  // For now, return popular images
  return getPopularImages(limit);
}

export function getSuggestionsBasedOnSelection(
  selectedImages: string[],
  limit: number = 5
): ItemImage[] {
  // Simple suggestion algorithm based on selected items
  const selected = selectedImages
    .map(id => getImageById(id))
    .filter(Boolean) as ItemImage[];
  const selectedCategories = [...new Set(selected.map(img => img.category))];
  const selectedTags = [...new Set(selected.flatMap(img => img.tags))];

  const suggestions = getAllImages()
    .filter(img => !selectedImages.includes(img.id))
    .filter(
      img =>
        selectedCategories.includes(img.category) ||
        img.tags.some(tag => selectedTags.includes(tag))
    )
    .slice(0, limit);

  return suggestions;
}
