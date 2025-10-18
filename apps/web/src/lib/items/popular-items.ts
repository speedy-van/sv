/**
 * Popular Items Display System
 * Shows only the most common items with verified image paths
 */

export interface PopularItem {
  id: string;
  name: string;
  category: string;
  description: string;
  size: 'small' | 'medium' | 'large';
  weight: number;
  volume: number;
  unitPrice: number;
  image: string;
  popularity: number;
}

// Most popular items with existing images (Full House packages in logical order)
export const POPULAR_ITEMS: PopularItem[] = [
  {
    id: 'full-house-studio',
    name: 'Studio Package',
    category: 'full-house',
    description: 'Complete studio apartment removal',
    size: 'medium',
    weight: 800,
    volume: 8.0,
    unitPrice: 250,
    image: '/items/full-house/studio.png',
    popularity: 101
  },
  {
    id: 'full-house-1bed',
    name: '1 Bedroom House Package',
    category: 'full-house',
    description: 'Complete 1 bedroom house removal',
    size: 'large',
    weight: 1500,
    volume: 15.0,
    unitPrice: 350,
    image: '/items/full-house/1-bedroom.png',
    popularity: 100
  },
  {
    id: 'full-house-2bed',
    name: '2 Bedroom House Package',
    category: 'full-house',
    description: 'Complete 2 bedroom house removal',
    size: 'large',
    weight: 2500,
    volume: 25.0,
    unitPrice: 450,
    image: '/items/full-house/2-bedroom.png',
    popularity: 99
  },
  {
    id: 'full-house-3bed',
    name: '3 Bedroom House Package',
    category: 'full-house',
    description: 'Complete 3 bedroom house removal',
    size: 'large',
    weight: 3500,
    volume: 35.0,
    unitPrice: 650,
    image: '/items/full-house/3-bedroom.png',
    popularity: 98
  },
  {
    id: 'full-house-4bed',
    name: '4 Bedroom House Package',
    category: 'full-house',
    description: 'Complete 4 bedroom house removal',
    size: 'large',
    weight: 4500,
    volume: 45.0,
    unitPrice: 850,
    image: '/items/full-house/4-bedroom.png',
    popularity: 97
  },
  {
    id: 'full-house-5bed',
    name: '5 Bedroom House Package',
    category: 'full-house',
    description: 'Complete 5 bedroom house removal',
    size: 'large',
    weight: 5500,
    volume: 55.0,
    unitPrice: 1050,
    image: '/items/full-house/5-bedroom.png',
    popularity: 96
  },
  {
    id: 'full-house-6bed',
    name: '6+ Bedroom House Package',
    category: 'full-house',
    description: 'Complete 6+ bedroom house removal',
    size: 'large',
    weight: 7000,
    volume: 70.0,
    unitPrice: 1250,
    image: '/items/full-house/6-bedroom.png',
    popularity: 95
  },
  {
    id: 'box-medium',
    name: 'Medium Box',
    category: 'boxes',
    description: 'Standard moving box',
    size: 'small',
    weight: 4,
    volume: 0.2,
    unitPrice: 8,
    image: '/items/boxes/medium-box.png',
    popularity: 98
  },
  {
    id: 'sofa',
    name: 'Sofa',
    category: 'furniture',
    description: 'Living room sofa',
    size: 'large',
    weight: 80,
    volume: 2.5,
    unitPrice: 90,
    image: '/items/furniture/sofa.png',
    popularity: 95
  },
  {
    id: 'bed',
    name: 'Bed',
    category: 'furniture',
    description: 'Double bed with mattress',
    size: 'large',
    weight: 90,
    volume: 3.5,
    unitPrice: 95,
    image: '/items/furniture/bed.png',
    popularity: 90
  },
  {
    id: 'washing-machine',
    name: 'Washing Machine',
    category: 'appliances',
    description: 'Front-loading washer',
    size: 'large',
    weight: 70,
    volume: 1.2,
    unitPrice: 50,
    image: '/items/appliances/washer.png',
    popularity: 85
  },
  {
    id: 'television',
    name: 'Television',
    category: 'electronics',
    description: 'Flat screen TV',
    size: 'medium',
    weight: 25,
    volume: 0.8,
    unitPrice: 40,
    image: '/items/electronics/tv.png',
    popularity: 80
  },
  {
    id: 'refrigerator',
    name: 'Refrigerator',
    category: 'appliances',
    description: 'Large fridge/freezer',
    size: 'large',
    weight: 80,
    volume: 2.0,
    unitPrice: 60,
    image: '/items/appliances/refrigerator.png',
    popularity: 78
  }
];

// Category-specific popular items (for when category is selected)
export const CATEGORY_POPULAR_ITEMS: Record<string, PopularItem[]> = {
  'full-house': [
    {
      id: 'full-house-studio',
      name: 'Studio Package',
      category: 'full-house',
      description: 'Complete studio apartment removal',
      size: 'medium',
      weight: 800,
      volume: 8.0,
      unitPrice: 250,
      image: '/items/full-house/studio.png',
      popularity: 101
    },
    {
      id: 'full-house-1bed',
      name: '1 Bedroom House Package',
      category: 'full-house',
      description: 'Complete 1 bedroom house removal',
      size: 'large',
      weight: 1500,
      volume: 15.0,
      unitPrice: 350,
      image: '/items/full-house/1-bedroom.png',
      popularity: 95
    },
    {
      id: 'full-house-2bed',
      name: '2 Bedroom House Package',
      category: 'full-house',
      description: 'Complete 2 bedroom house removal',
      size: 'large',
      weight: 2500,
      volume: 25.0,
      unitPrice: 450,
      image: '/items/full-house/2-bedroom.png',
      popularity: 100
    },
    {
      id: 'full-house-3bed',
      name: '3 Bedroom House Package',
      category: 'full-house',
      description: 'Complete 3 bedroom house removal',
      size: 'large',
      weight: 3500,
      volume: 35.0,
      unitPrice: 650,
      image: '/items/full-house/3-bedroom.png',
      popularity: 99
    },
    {
      id: 'full-house-4bed',
      name: '4 Bedroom House Package',
      category: 'full-house',
      description: 'Complete 4 bedroom house removal',
      size: 'large',
      weight: 4500,
      volume: 45.0,
      unitPrice: 850,
      image: '/items/full-house/4-bedroom.png',
      popularity: 90
    },
    {
      id: 'full-house-5bed',
      name: '5 Bedroom House Package',
      category: 'full-house',
      description: 'Complete 5 bedroom house removal',
      size: 'large',
      weight: 5500,
      volume: 55.0,
      unitPrice: 1050,
      image: '/items/full-house/5-bedroom.png',
      popularity: 85
    },
    {
      id: 'full-house-6bed',
      name: '6+ Bedroom House Package',
      category: 'full-house',
      description: 'Complete 6+ bedroom house removal',
      size: 'large',
      weight: 7000,
      volume: 70.0,
      unitPrice: 1250,
      image: '/items/full-house/6-bedroom.png',
      popularity: 80
    }
  ],
  furniture: [
    {
      id: 'sofa',
      name: 'Sofa',
      category: 'furniture',
      description: 'Living room sofa',
      size: 'large',
      weight: 80,
      volume: 2.5,
      unitPrice: 90,
      image: '/items/furniture/sofa.png',
      popularity: 95
    },
    {
      id: 'bed',
      name: 'Bed',
      category: 'furniture',
      description: 'Double bed with mattress',
      size: 'large',
      weight: 90,
      volume: 3.5,
      unitPrice: 95,
      image: '/items/furniture/bed.png',
      popularity: 90
    },
    {
      id: 'dining-table',
      name: 'Dining Table',
      category: 'furniture',
      description: '4-6 person dining table',
      size: 'large',
      weight: 60,
      volume: 3.0,
      unitPrice: 70,
      image: '/items/furniture/dining_table.png',
      popularity: 80
    },
    {
      id: 'wardrobe',
      name: 'Wardrobe',
      category: 'furniture',
      description: 'Large wardrobe',
      size: 'large',
      weight: 100,
      volume: 4.0,
      unitPrice: 85,
      image: '/items/furniture/wardrobe.png',
      popularity: 75
    },
    {
      id: 'desk',
      name: 'Desk',
      category: 'furniture',
      description: 'Office desk',
      size: 'medium',
      weight: 40,
      volume: 1.5,
      unitPrice: 45,
      image: '/items/furniture/desk.png',
      popularity: 70
    },
    {
      id: 'bookshelf',
      name: 'Bookshelf',
      category: 'furniture',
      description: 'Tall bookshelf',
      size: 'medium',
      weight: 35,
      volume: 1.8,
      unitPrice: 43,
      image: '/items/furniture/bookshelf.png',
      popularity: 60
    }
  ],
  appliances: [
    {
      id: 'washing-machine',
      name: 'Washing Machine',
      category: 'appliances',
      description: 'Front-loading washer',
      size: 'large',
      weight: 70,
      volume: 1.2,
      unitPrice: 50,
      image: '/items/appliances/washer.png',
      popularity: 85
    },
    {
      id: 'refrigerator',
      name: 'Refrigerator',
      category: 'appliances',
      description: 'Large fridge/freezer',
      size: 'large',
      weight: 80,
      volume: 2.0,
      unitPrice: 60,
      image: '/items/appliances/refrigerator.png',
      popularity: 78
    },
    {
      id: 'dishwasher',
      name: 'Dishwasher',
      category: 'appliances',
      description: 'Built-in dishwasher',
      size: 'large',
      weight: 50,
      volume: 1.0,
      unitPrice: 45,
      image: '/items/appliances/dishwasher.png',
      popularity: 60
    },
    {
      id: 'oven',
      name: 'Oven',
      category: 'appliances',
      description: 'Electric or gas oven',
      size: 'large',
      weight: 60,
      volume: 1.5,
      unitPrice: 55,
      image: '/items/appliances/oven.png',
      popularity: 65
    },
    {
      id: 'microwave',
      name: 'Microwave',
      category: 'appliances',
      description: 'Countertop microwave',
      size: 'small',
      weight: 15,
      volume: 0.3,
      unitPrice: 20,
      image: '/items/appliances/microwave.png',
      popularity: 75
    },
    {
      id: 'dryer',
      name: 'Dryer',
      category: 'appliances',
      description: 'Tumble dryer',
      size: 'large',
      weight: 60,
      volume: 1.1,
      unitPrice: 48,
      image: '/items/appliances/dryer.png',
      popularity: 70
    }
  ],
  boxes: [
    {
      id: 'box-medium',
      name: 'Medium Box',
      category: 'boxes',
      description: 'Standard moving box',
      size: 'small',
      weight: 4,
      volume: 0.2,
      unitPrice: 8,
      image: '/items/boxes/medium-box.png',
      popularity: 98
    },
    {
      id: 'box-large',
      name: 'Large Box',
      category: 'boxes',
      description: 'Large moving box',
      size: 'medium',
      weight: 9,
      volume: 0.4,
      unitPrice: 12,
      image: '/items/boxes/large-box.png',
      popularity: 85
    },
    {
      id: 'box-small',
      name: 'Small Box',
      category: 'boxes',
      description: 'Small moving box',
      size: 'small',
      weight: 4,
      volume: 0.2,
      unitPrice: 6,
      image: '/items/boxes/small-box.png',
      popularity: 90
    },
    {
      id: 'wardrobe-box',
      name: 'Wardrobe Box',
      category: 'boxes',
      description: 'Hanging wardrobe box',
      size: 'medium',
      weight: 12,
      volume: 0.6,
      unitPrice: 25,
      image: '/items/boxes/wardrobe-box.png',
      popularity: 40
    },
    {
      id: 'plastic-bin',
      name: 'Plastic Storage Bin',
      category: 'boxes',
      description: 'Large plastic container',
      size: 'medium',
      weight: 9,
      volume: 0.4,
      unitPrice: 15,
      image: '/items/boxes/plastic_bin.png',
      popularity: 55
    },
    {
      id: 'book-box',
      name: 'Book Box',
      category: 'boxes',
      description: 'Heavy duty book box',
      size: 'small',
      weight: 9,
      volume: 0.3,
      unitPrice: 10,
      image: '/items/boxes/box.png',
      popularity: 65
    }
  ],
  electronics: [
    {
      id: 'television',
      name: 'Television',
      category: 'electronics',
      description: 'Flat screen TV',
      size: 'medium',
      weight: 25,
      volume: 0.8,
      unitPrice: 40,
      image: '/items/electronics/tv.png',
      popularity: 80
    },
    {
      id: 'computer',
      name: 'Computer',
      category: 'electronics',
      description: 'Desktop computer',
      size: 'small',
      weight: 20,
      volume: 0.5,
      unitPrice: 30,
      image: '/items/electronics/computer.png',
      popularity: 60
    },
    {
      id: 'printer',
      name: 'Printer',
      category: 'electronics',
      description: 'Office printer',
      size: 'small',
      weight: 12,
      volume: 0.3,
      unitPrice: 20,
      image: '/items/electronics/printer_scanner.png',
      popularity: 50
    },
    {
      id: 'monitor',
      name: 'Computer Monitor',
      category: 'electronics',
      description: 'Desktop monitor',
      size: 'small',
      weight: 8,
      volume: 0.2,
      unitPrice: 25,
      image: '/items/electronics/computer_monitor.png',
      popularity: 45
    },
    {
      id: 'gaming-console',
      name: 'Gaming Console',
      category: 'electronics',
      description: 'Video game console',
      size: 'small',
      weight: 5,
      volume: 0.1,
      unitPrice: 15,
      image: '/items/electronics/electronics.png',
      popularity: 70
    },
    {
      id: 'sound-system',
      name: 'Sound System',
      category: 'electronics',
      description: 'Home audio system',
      size: 'medium',
      weight: 15,
      volume: 0.4,
      unitPrice: 35,
      image: '/items/electronics/electronics.png',
      popularity: 40
    }
  ]
};

// Get popular items for a specific category or general popular items
export function getPopularItems(category?: string): PopularItem[] {
  if (category && category !== 'all' && CATEGORY_POPULAR_ITEMS[category]) {
    return CATEGORY_POPULAR_ITEMS[category];
  }
  return POPULAR_ITEMS;
}

// Convert PopularItem to Item format for compatibility
export function convertPopularToItem(popularItem: PopularItem) {
  return {
    id: popularItem.id,
    name: popularItem.name,
    description: popularItem.description,
    category: popularItem.category,
    size: popularItem.size,
    quantity: 1,
    unitPrice: popularItem.unitPrice,
    totalPrice: popularItem.unitPrice,
    weight: popularItem.weight,
    volume: popularItem.volume,
    image: popularItem.image,
  };
}
