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
    imagePath: '/UK_Removal_Dataset/Images_Only/Office_furniture/office_chair_ergonomic_adjustable_height_jpg_22kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Office_furniture/office_chair_executive_leather_jpg_28kg.jpg',
    description: 'Ergonomic office chair'
  },
  'desk': {
    id: 'desk',
    name: 'Desk',
    category: 'office',
    imagePath: '/UK_Removal_Dataset/Images_Only/Office_furniture/desk_computer_l_shaped_corner_jpg_45kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Office_furniture/desk_executive_wooden_60inch_jpg_38kg.jpg',
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
    imagePath: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/refrigerator_large_french_door_stainless_steel_jpg_120kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/refrigerator_side_side_door_stainless_jpg_95kg.jpg',
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
    imagePath: '/UK_Removal_Dataset/Images_Only/Dining_Room_Furniture/dining_table_extendable_6_8_seats_jpg_45kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Dining_Room_Furniture/dining_table_round_4_6_seats_jpg_38kg.jpg',
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
    imagePath: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/bookcase_5_shelf_wooden_standing_jpg_42kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/bookshelf_living_room_storage_sunesa_jpg_35kg.jpg',
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
    imagePath: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/washing_machine_front_load_12kg_jpg_75kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/washing_machine_top_load_10kg_jpg_65kg.jpg',
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
    imagePath: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/microwave_countertop_1_6_cu_ft_jpg_18kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/microwave_over_range_2_1_cu_ft_jpg_25kg.jpg',
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
  },

  // UK Removal Dataset Mappings for Booking Luxury Items
  'bed-single': {
    id: 'bed-single',
    name: 'Single Bed',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Bedroom/single_bed_frame_white_hampshire_jpg_18kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Bedroom/single_bed_frame_sussex_white_jpg_22kg.jpg',
    description: 'Single bed frame'
  },
  'bed-double': {
    id: 'bed-double',
    name: 'Double Bed',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Bedroom/double_bed_frame_cavill_fabric_grey_jpg_38kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Bedroom/double_bed_frame_florence_luxury_jpg_35kg.jpg',
    description: 'Double bed frame'
  },
  'mattress-single': {
    id: 'mattress-single',
    name: 'Single Mattress',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Bedroom/single_bed_frame_white_hampshire_jpg_18kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Bedroom/single_bed_frame_sussex_white_jpg_22kg.jpg',
    description: 'Single mattress'
  },
  'mattress-double': {
    id: 'mattress-double',
    name: 'Double Mattress',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Bedroom/double_bed_frame_harper_storage_mattress_jpg_45kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Bedroom/double_bed_frame_cavill_fabric_grey_jpg_38kg.jpg',
    description: 'Double mattress'
  },
  'wardrobe-small': {
    id: 'wardrobe-small',
    name: 'Small Wardrobe',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Wardrobes_closet/small_double_bed_frame_2_storage_drawers_jpg_28kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Bedroom/single_bed_frame_white_hampshire_jpg_18kg.jpg',
    description: 'Small wardrobe'
  },
  'wardrobe-large': {
    id: 'wardrobe-large',
    name: 'Large Wardrobe',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Wardrobes_closet/super_king_bed_frame_sparkford_oak_6ft_jpg_85kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Wardrobes_closet/king_bed_frame_classic_luxe_storage_jpg_65kg.jpg',
    description: 'Large wardrobe'
  },
  'bedside-table': {
    id: 'bedside-table',
    name: 'Bedside Table',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Bedroom/platform_bed_frame_low_enkel_no_headboard_jpg_28kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/end_table_4_tier_tribesigns_jpg_18kg.jpg',
    description: 'Bedside table'
  },
  'chest-drawers': {
    id: 'chest-drawers',
    name: 'Chest of Drawers',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Bedroom/small_double_bed_frame_2_storage_drawers_jpg_28kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Bedroom/double_bed_frame_harper_storage_mattress_jpg_45kg.jpg',
    description: 'Chest of drawers'
  },
  'sofa-2seater': {
    id: 'sofa-2seater',
    name: '2-Seater Sofa',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/loveseat_2_seat_48inch_jarenie_jpg_32kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/loveseat_2_seat_fabric_63inch_jpg_38kg.jpg',
    description: '2-seater sofa'
  },
  'sofa-3seater': {
    id: 'sofa-3seater',
    name: '3-Seater Sofa',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/sofa_3_seat_couch_storage_layer_jpg_45kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/sofa_3_seat_fabric_modern_lestar_jpg_48kg.jpg',
    description: '3-seater sofa'
  },
  'armchair': {
    id: 'armchair',
    name: 'Armchair',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/armchair_1_seat_accent_chair_jpg_25kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/armchair_rolled_accent_set_2_jpg_42kg.jpg',
    description: 'Armchair'
  },
  'coffee-table': {
    id: 'coffee-table',
    name: 'Coffee Table',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/coffee_table_modern_povison_living_room_jpg_25kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/coffee_table_round_lift_top_wynny_jpg_28kg.jpg',
    description: 'Coffee table'
  },
  'tv-32inch': {
    id: 'tv-32inch',
    name: 'TV (32")',
    category: 'electronics',
    imagePath: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/tv_stand_65inch_enhomee_large_jpg_45kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/tv_console_entertainment_center_rosewood_jpg_85kg.jpg',
    description: '32 inch TV'
  },
  'tv-42inch': {
    id: 'tv-42inch',
    name: 'TV (42")',
    category: 'electronics',
    imagePath: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/tv_stand_farmhouse_75inch_plus_jpg_65kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/tv_console_entertainment_center_rosewood_jpg_85kg.jpg',
    description: '42 inch TV'
  },
  'tv-stand': {
    id: 'tv-stand',
    name: 'TV Stand',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/tv_stand_65inch_enhomee_large_jpg_45kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/tv_console_entertainment_center_rosewood_jpg_85kg.jpg',
    description: 'TV stand'
  },
  'dining-chair': {
    id: 'dining-chair',
    name: 'Dining Chair',
    category: 'furniture',
    imagePath: '/UK_Removal_Dataset/Images_Only/Dining_Room_Furniture/dining_chair_set_4_upholstered_jpg_28kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Dining_Room_Furniture/dining_chair_set_6_wooden_jpg_35kg.jpg',
    description: 'Dining chair'
  },
  'lamp-table': {
    id: 'lamp-table',
    name: 'Table Lamp',
    category: 'electronics',
    imagePath: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/table_lamp_set_2_bedside_usb_black_jpg_5kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/table_lamp_set_2_farmhouse_usb_ports_jpg_7kg.jpg',
    description: 'Table lamp'
  },
  'mirror-wall': {
    id: 'mirror-wall',
    name: 'Wall Mirror',
    category: 'decor',
    imagePath: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/mirror_large_47x32_gold_living_room_jpg_15kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/mirror_silver_beveled_39x28_rectangle_jpg_12kg.jpg',
    description: 'Wall mirror'
  },
  'plant-pot': {
    id: 'plant-pot',
    name: 'Plant Pot',
    category: 'decor',
    imagePath: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/plant_stand_11_tier_indoor_outdoor_jpg_25kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/plant_stand_5_tier_grow_lights_jpg_32kg.jpg',
    description: 'Plant pot or stand'
  },
  'vacuum-cleaner': {
    id: 'vacuum-cleaner',
    name: 'Vacuum Cleaner',
    category: 'appliances',
    imagePath: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/vacuum_cleaner_robot_smart_navigation_jpg_8kg.jpg',
    fallbackImage: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/vacuum_cleaner_upright_bagless_jpg_12kg.jpg',
    description: 'Vacuum cleaner'
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
