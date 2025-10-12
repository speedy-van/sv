/**
 * Home Size Presets for Better Item Arrangement
 * 
 * This file defines typical items and quantities for different home sizes
 * to improve user experience by providing logical grouping and pre-filtering
 * based on common household sizes.
 */

export interface HomeSizePreset {
  id: string;
  name: string;
  icon: string;
  bedrooms: number;
  description: string;
  suggestedItems: HomeSizeItem[];
}

export interface HomeSizeItem {
  id: string;
  name: string;
  category: string;
  suggestedQuantity: number;
  priority: number; // 1 = essential, 2 = common, 3 = optional
  room?: string;
}

// Define typical items for each home size
export const HOME_SIZE_PRESETS: HomeSizePreset[] = [
  {
    id: '1-bedroom',
    name: '1 Bedroom',
    icon: '🏠',
    bedrooms: 1,
    description: 'Studio or 1 bedroom apartment - perfect for singles or couples',
    suggestedItems: [
      // Essential bedroom items (Priority 1)
      { id: 'bed-single', name: 'Single Bed', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom' },
      { id: 'mattress-single', name: 'Single Mattress', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom' },
      { id: 'wardrobe-small', name: 'Small Wardrobe', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom' },
      { id: 'bedside-table', name: 'Bedside Table', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom' },
      
      // Essential living room items (Priority 1)
      { id: 'sofa-2seater', name: '2-Seater Sofa', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'coffee-table', name: 'Coffee Table', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'tv-32inch', name: 'TV (32")', category: 'electronics', suggestedQuantity: 1, priority: 1, room: 'living' },
      
      // Essential kitchen items (Priority 1)
      { id: 'refrigerator', name: 'Refrigerator', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'microwave', name: 'Microwave', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      
      // Common items (Priority 2)
      { id: 'chest-drawers', name: 'Chest of Drawers', category: 'furniture', suggestedQuantity: 1, priority: 2, room: 'bedroom' },
      { id: 'dining-chair', name: 'Dining Chair', category: 'furniture', suggestedQuantity: 2, priority: 2, room: 'dining' },
      { id: 'bookshelf', name: 'Bookshelf', category: 'furniture', suggestedQuantity: 1, priority: 2, room: 'living' },
      { id: 'lamp-table', name: 'Table Lamp', category: 'electronics', suggestedQuantity: 2, priority: 2, room: 'bedroom' },
      
      // Optional items (Priority 3)
      { id: 'mirror-wall', name: 'Wall Mirror', category: 'decor', suggestedQuantity: 1, priority: 3, room: 'bedroom' },
      { id: 'plant-pot', name: 'Plant Pot', category: 'decor', suggestedQuantity: 2, priority: 3, room: 'living' },
      { id: 'vacuum-cleaner', name: 'Vacuum Cleaner', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'utility' }
    ]
  },
  {
    id: '2-bedroom',
    name: '2 Bedroom',
    icon: '🏡',
    bedrooms: 2,
    description: 'Small family home or flat share - ideal for couples or small families',
    suggestedItems: [
      // Essential bedroom items (Priority 1)
      { id: 'bed-double', name: 'Double Bed', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom' },
      { id: 'mattress-double', name: 'Double Mattress', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom' },
      { id: 'bed-single', name: 'Single Bed', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom2' },
      { id: 'mattress-single', name: 'Single Mattress', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom2' },
      { id: 'wardrobe-large', name: 'Large Wardrobe', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom' },
      { id: 'wardrobe-small', name: 'Small Wardrobe', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom2' },
      { id: 'bedside-table', name: 'Bedside Table', category: 'furniture', suggestedQuantity: 3, priority: 1, room: 'bedroom' },
      
      // Essential living room items (Priority 1)
      { id: 'sofa-3seater', name: '3-Seater Sofa', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'armchair', name: 'Armchair', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'coffee-table', name: 'Coffee Table', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'tv-42inch', name: 'TV (42")', category: 'electronics', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'tv-stand', name: 'TV Stand', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      
      // Essential kitchen & dining items (Priority 1)
      { id: 'refrigerator', name: 'Refrigerator', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'washing-machine', name: 'Washing Machine', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'microwave', name: 'Microwave', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'dining-table', name: 'Dining Table', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'dining' },
      { id: 'dining-chair', name: 'Dining Chair', category: 'furniture', suggestedQuantity: 4, priority: 1, room: 'dining' },
      
      // Common items (Priority 2)
      { id: 'chest-drawers', name: 'Chest of Drawers', category: 'furniture', suggestedQuantity: 2, priority: 2, room: 'bedroom' },
      { id: 'bookshelf', name: 'Bookshelf', category: 'furniture', suggestedQuantity: 1, priority: 2, room: 'living' },
      { id: 'desk', name: 'Desk', category: 'furniture', suggestedQuantity: 1, priority: 2, room: 'bedroom2' },
      { id: 'office-chair', name: 'Office Chair', category: 'furniture', suggestedQuantity: 1, priority: 2, room: 'bedroom2' },
      { id: 'lamp-table', name: 'Table Lamp', category: 'electronics', suggestedQuantity: 3, priority: 2, room: 'bedroom' },
      
      // Optional items (Priority 3)
      { id: 'mirror-wall', name: 'Wall Mirror', category: 'decor', suggestedQuantity: 2, priority: 3, room: 'bedroom' },
      { id: 'plant-pot', name: 'Plant Pot', category: 'decor', suggestedQuantity: 3, priority: 3, room: 'living' },
      { id: 'vacuum-cleaner', name: 'Vacuum Cleaner', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'utility' },
      { id: 'dishwasher', name: 'Dishwasher', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'kitchen' }
    ]
  },
  {
    id: '3-bedroom',
    name: '3 Bedroom',
    icon: '🏘️',
    bedrooms: 3,
    description: 'Family home - perfect for growing families with children',
    suggestedItems: [
      // Essential bedroom items (Priority 1)
      { id: 'bed-kingsize', name: 'King Size Bed', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'master-bedroom' },
      { id: 'mattress-kingsize', name: 'King Size Mattress', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'master-bedroom' },
      { id: 'bed-single', name: 'Single Bed', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'mattress-single', name: 'Single Mattress', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'wardrobe-large', name: 'Large Wardrobe', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'wardrobe-small', name: 'Small Wardrobe', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom3' },
      { id: 'bedside-table', name: 'Bedside Table', category: 'furniture', suggestedQuantity: 4, priority: 1, room: 'bedroom' },
      
      // Essential living room items (Priority 1)
      { id: 'sofa-3seater', name: '3-Seater Sofa', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'sofa-2seater', name: '2-Seater Sofa', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'coffee-table', name: 'Coffee Table', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'tv-50inch', name: 'TV (50")', category: 'electronics', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'tv-stand', name: 'TV Stand', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      
      // Essential kitchen & dining items (Priority 1)
      { id: 'refrigerator-large', name: 'Large Refrigerator', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'washing-machine', name: 'Washing Machine', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'dishwasher', name: 'Dishwasher', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'microwave', name: 'Microwave', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'dining-table', name: 'Dining Table', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'dining' },
      { id: 'dining-chair', name: 'Dining Chair', category: 'furniture', suggestedQuantity: 6, priority: 1, room: 'dining' },
      
      // Common items (Priority 2)
      { id: 'chest-drawers', name: 'Chest of Drawers', category: 'furniture', suggestedQuantity: 3, priority: 2, room: 'bedroom' },
      { id: 'bookshelf', name: 'Bookshelf', category: 'furniture', suggestedQuantity: 2, priority: 2, room: 'living' },
      { id: 'desk', name: 'Desk', category: 'furniture', suggestedQuantity: 1, priority: 2, room: 'bedroom3' },
      { id: 'office-chair', name: 'Office Chair', category: 'furniture', suggestedQuantity: 1, priority: 2, room: 'bedroom3' },
      { id: 'lamp-table', name: 'Table Lamp', category: 'electronics', suggestedQuantity: 4, priority: 2, room: 'bedroom' },
      { id: 'side-table', name: 'Side Table', category: 'furniture', suggestedQuantity: 2, priority: 2, room: 'living' },
      
      // Optional items (Priority 3)
      { id: 'mirror-wall', name: 'Wall Mirror', category: 'decor', suggestedQuantity: 3, priority: 3, room: 'bedroom' },
      { id: 'plant-pot', name: 'Plant Pot', category: 'decor', suggestedQuantity: 4, priority: 3, room: 'living' },
      { id: 'vacuum-cleaner', name: 'Vacuum Cleaner', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'utility' },
      { id: 'tumble-dryer', name: 'Tumble Dryer', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'utility' }
    ]
  },
  {
    id: '4-bedroom',
    name: '4 Bedroom',
    icon: '🏠',
    bedrooms: 4,
    description: 'Large family home - spacious living for bigger families',
    suggestedItems: [
      // Essential bedroom items (Priority 1)
      { id: 'bed-kingsize', name: 'King Size Bed', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'master-bedroom' },
      { id: 'mattress-kingsize', name: 'King Size Mattress', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'master-bedroom' },
      { id: 'bed-double', name: 'Double Bed', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom2' },
      { id: 'mattress-double', name: 'Double Mattress', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom2' },
      { id: 'bed-single', name: 'Single Bed', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'mattress-single', name: 'Single Mattress', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'wardrobe-large', name: 'Large Wardrobe', category: 'furniture', suggestedQuantity: 3, priority: 1, room: 'bedroom' },
      { id: 'wardrobe-small', name: 'Small Wardrobe', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom4' },
      { id: 'bedside-table', name: 'Bedside Table', category: 'furniture', suggestedQuantity: 6, priority: 1, room: 'bedroom' },
      
      // Essential living areas (Priority 1)
      { id: 'sofa-3seater', name: '3-Seater Sofa', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'sofa-2seater', name: '2-Seater Sofa', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'armchair', name: 'Armchair', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'living' },
      { id: 'coffee-table', name: 'Coffee Table', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'tv-55inch', name: 'TV (55")', category: 'electronics', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'tv-stand', name: 'TV Stand', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      
      // Essential kitchen & dining items (Priority 1)
      { id: 'refrigerator-large', name: 'Large Refrigerator', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'washing-machine', name: 'Washing Machine', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'utility' },
      { id: 'dishwasher', name: 'Dishwasher', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'microwave', name: 'Microwave', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'dining-table-large', name: 'Large Dining Table', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'dining' },
      { id: 'dining-chair', name: 'Dining Chair', category: 'furniture', suggestedQuantity: 8, priority: 1, room: 'dining' },
      
      // Common items (Priority 2)
      { id: 'chest-drawers', name: 'Chest of Drawers', category: 'furniture', suggestedQuantity: 4, priority: 2, room: 'bedroom' },
      { id: 'bookshelf', name: 'Bookshelf', category: 'furniture', suggestedQuantity: 3, priority: 2, room: 'living' },
      { id: 'desk', name: 'Desk', category: 'furniture', suggestedQuantity: 2, priority: 2, room: 'bedroom' },
      { id: 'office-chair', name: 'Office Chair', category: 'furniture', suggestedQuantity: 2, priority: 2, room: 'bedroom' },
      { id: 'lamp-table', name: 'Table Lamp', category: 'electronics', suggestedQuantity: 6, priority: 2, room: 'bedroom' },
      { id: 'side-table', name: 'Side Table', category: 'furniture', suggestedQuantity: 3, priority: 2, room: 'living' },
      
      // Optional items (Priority 3)
      { id: 'mirror-wall', name: 'Wall Mirror', category: 'decor', suggestedQuantity: 4, priority: 3, room: 'bedroom' },
      { id: 'plant-pot', name: 'Plant Pot', category: 'decor', suggestedQuantity: 6, priority: 3, room: 'living' },
      { id: 'vacuum-cleaner', name: 'Vacuum Cleaner', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'utility' },
      { id: 'tumble-dryer', name: 'Tumble Dryer', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'utility' },
      { id: 'freezer', name: 'Freezer', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'utility' }
    ]
  },
  {
    id: '5-bedroom',
    name: '5 Bedroom',
    icon: '🏰',
    bedrooms: 5,
    description: 'Large house - extensive family living or house share',
    suggestedItems: [
      // Essential bedroom items (Priority 1)
      { id: 'bed-kingsize', name: 'King Size Bed', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'mattress-kingsize', name: 'King Size Mattress', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'bed-double', name: 'Double Bed', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom' },
      { id: 'mattress-double', name: 'Double Mattress', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom' },
      { id: 'bed-single', name: 'Single Bed', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'mattress-single', name: 'Single Mattress', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'wardrobe-large', name: 'Large Wardrobe', category: 'furniture', suggestedQuantity: 4, priority: 1, room: 'bedroom' },
      { id: 'wardrobe-small', name: 'Small Wardrobe', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'bedroom' },
      { id: 'bedside-table', name: 'Bedside Table', category: 'furniture', suggestedQuantity: 8, priority: 1, room: 'bedroom' },
      
      // Essential living areas (Priority 1)
      { id: 'sofa-3seater', name: '3-Seater Sofa', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'living' },
      { id: 'sofa-2seater', name: '2-Seater Sofa', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'armchair', name: 'Armchair', category: 'furniture', suggestedQuantity: 3, priority: 1, room: 'living' },
      { id: 'coffee-table', name: 'Coffee Table', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'living' },
      { id: 'tv-65inch', name: 'TV (65")', category: 'electronics', suggestedQuantity: 1, priority: 1, room: 'living' },
      { id: 'tv-stand', name: 'TV Stand', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'living' },
      
      // Essential kitchen & dining items (Priority 1)
      { id: 'refrigerator-large', name: 'Large Refrigerator', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'washing-machine', name: 'Washing Machine', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'utility' },
      { id: 'dishwasher', name: 'Dishwasher', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'microwave', name: 'Microwave', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'dining-table-large', name: 'Large Dining Table', category: 'furniture', suggestedQuantity: 1, priority: 1, room: 'dining' },
      { id: 'dining-chair', name: 'Dining Chair', category: 'furniture', suggestedQuantity: 10, priority: 1, room: 'dining' },
      
      // Common items (Priority 2)
      { id: 'chest-drawers', name: 'Chest of Drawers', category: 'furniture', suggestedQuantity: 5, priority: 2, room: 'bedroom' },
      { id: 'bookshelf', name: 'Bookshelf', category: 'furniture', suggestedQuantity: 4, priority: 2, room: 'living' },
      { id: 'desk', name: 'Desk', category: 'furniture', suggestedQuantity: 3, priority: 2, room: 'bedroom' },
      { id: 'office-chair', name: 'Office Chair', category: 'furniture', suggestedQuantity: 3, priority: 2, room: 'bedroom' },
      { id: 'lamp-table', name: 'Table Lamp', category: 'electronics', suggestedQuantity: 8, priority: 2, room: 'bedroom' },
      { id: 'side-table', name: 'Side Table', category: 'furniture', suggestedQuantity: 4, priority: 2, room: 'living' },
      
      // Optional items (Priority 3)
      { id: 'mirror-wall', name: 'Wall Mirror', category: 'decor', suggestedQuantity: 5, priority: 3, room: 'bedroom' },
      { id: 'plant-pot', name: 'Plant Pot', category: 'decor', suggestedQuantity: 8, priority: 3, room: 'living' },
      { id: 'vacuum-cleaner', name: 'Vacuum Cleaner', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'utility' },
      { id: 'tumble-dryer', name: 'Tumble Dryer', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'utility' },
      { id: 'freezer', name: 'Freezer', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'utility' },
      { id: 'wine-fridge', name: 'Wine Fridge', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'kitchen' }
    ]
  },
  {
    id: '6-bedroom-plus',
    name: '6+ Bedroom',
    icon: '🏛️',
    bedrooms: 6,
    description: 'Very large house - mansion or multi-family dwelling',
    suggestedItems: [
      // Essential bedroom items (Priority 1)
      { id: 'bed-kingsize', name: 'King Size Bed', category: 'furniture', suggestedQuantity: 3, priority: 1, room: 'bedroom' },
      { id: 'mattress-kingsize', name: 'King Size Mattress', category: 'furniture', suggestedQuantity: 3, priority: 1, room: 'bedroom' },
      { id: 'bed-double', name: 'Double Bed', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'mattress-double', name: 'Double Mattress', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'bed-single', name: 'Single Bed', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'mattress-single', name: 'Single Mattress', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'wardrobe-large', name: 'Large Wardrobe', category: 'furniture', suggestedQuantity: 5, priority: 1, room: 'bedroom' },
      { id: 'wardrobe-small', name: 'Small Wardrobe', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'bedroom' },
      { id: 'bedside-table', name: 'Bedside Table', category: 'furniture', suggestedQuantity: 10, priority: 1, room: 'bedroom' },
      
      // Essential living areas (Priority 1)
      { id: 'sofa-3seater', name: '3-Seater Sofa', category: 'furniture', suggestedQuantity: 3, priority: 1, room: 'living' },
      { id: 'sofa-2seater', name: '2-Seater Sofa', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'living' },
      { id: 'armchair', name: 'Armchair', category: 'furniture', suggestedQuantity: 4, priority: 1, room: 'living' },
      { id: 'coffee-table', name: 'Coffee Table', category: 'furniture', suggestedQuantity: 3, priority: 1, room: 'living' },
      { id: 'tv-65inch', name: 'TV (65")', category: 'electronics', suggestedQuantity: 2, priority: 1, room: 'living' },
      { id: 'tv-stand', name: 'TV Stand', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'living' },
      
      // Essential kitchen & dining items (Priority 1)
      { id: 'refrigerator-large', name: 'Large Refrigerator', category: 'appliances', suggestedQuantity: 2, priority: 1, room: 'kitchen' },
      { id: 'washing-machine', name: 'Washing Machine', category: 'appliances', suggestedQuantity: 2, priority: 1, room: 'utility' },
      { id: 'dishwasher', name: 'Dishwasher', category: 'appliances', suggestedQuantity: 1, priority: 1, room: 'kitchen' },
      { id: 'microwave', name: 'Microwave', category: 'appliances', suggestedQuantity: 2, priority: 1, room: 'kitchen' },
      { id: 'dining-table-large', name: 'Large Dining Table', category: 'furniture', suggestedQuantity: 2, priority: 1, room: 'dining' },
      { id: 'dining-chair', name: 'Dining Chair', category: 'furniture', suggestedQuantity: 12, priority: 1, room: 'dining' },
      
      // Common items (Priority 2)
      { id: 'chest-drawers', name: 'Chest of Drawers', category: 'furniture', suggestedQuantity: 6, priority: 2, room: 'bedroom' },
      { id: 'bookshelf', name: 'Bookshelf', category: 'furniture', suggestedQuantity: 6, priority: 2, room: 'living' },
      { id: 'desk', name: 'Desk', category: 'furniture', suggestedQuantity: 4, priority: 2, room: 'bedroom' },
      { id: 'office-chair', name: 'Office Chair', category: 'furniture', suggestedQuantity: 4, priority: 2, room: 'bedroom' },
      { id: 'lamp-table', name: 'Table Lamp', category: 'electronics', suggestedQuantity: 12, priority: 2, room: 'bedroom' },
      { id: 'side-table', name: 'Side Table', category: 'furniture', suggestedQuantity: 6, priority: 2, room: 'living' },
      
      // Optional items (Priority 3)
      { id: 'mirror-wall', name: 'Wall Mirror', category: 'decor', suggestedQuantity: 6, priority: 3, room: 'bedroom' },
      { id: 'plant-pot', name: 'Plant Pot', category: 'decor', suggestedQuantity: 10, priority: 3, room: 'living' },
      { id: 'vacuum-cleaner', name: 'Vacuum Cleaner', category: 'appliances', suggestedQuantity: 2, priority: 3, room: 'utility' },
      { id: 'tumble-dryer', name: 'Tumble Dryer', category: 'appliances', suggestedQuantity: 2, priority: 3, room: 'utility' },
      { id: 'freezer', name: 'Freezer', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'utility' },
      { id: 'wine-fridge', name: 'Wine Fridge', category: 'appliances', suggestedQuantity: 1, priority: 3, room: 'kitchen' },
      { id: 'home-gym', name: 'Home Gym Equipment', category: 'fitness', suggestedQuantity: 1, priority: 3, room: 'utility' }
    ]
  }
];

/**
 * Get home size preset by ID
 */
export function getHomeSizePreset(id: string): HomeSizePreset | null {
  return HOME_SIZE_PRESETS.find(preset => preset.id === id) || null;
}

/**
 * Get suggested items for a specific home size
 */
export function getSuggestedItemsForHomeSize(homeSizeId: string, priority?: number): HomeSizeItem[] {
  const preset = getHomeSizePreset(homeSizeId);
  if (!preset) return [];
  
  if (priority) {
    return preset.suggestedItems.filter(item => item.priority === priority);
  }
  
  return preset.suggestedItems.sort((a, b) => a.priority - b.priority);
}

/**
 * Get home size presets sorted by bedroom count
 */
export function getHomeSizePresetsSorted(): HomeSizePreset[] {
  return HOME_SIZE_PRESETS.sort((a, b) => a.bedrooms - b.bedrooms);
}

/**
 * Get recommended items based on home size with fallback to catalog
 */
export function getRecommendedItemsWithFallback(
  homeSizeId: string, 
  availableItems: any[], 
  maxItems: number = 20
): any[] {
  const suggestedItems = getSuggestedItemsForHomeSize(homeSizeId);
  const recommendedItems: any[] = [];
  const usedItemIds = new Set<string>();
  
  // First, try to match suggested items with available items
  for (const suggestion of suggestedItems) {
    if (recommendedItems.length >= maxItems) break;
    
    // Look for exact match first
    let matchedItem = availableItems.find(item => item.id === suggestion.id);
    
    // If no exact match, look for similar items by name/category
    if (!matchedItem) {
      matchedItem = availableItems.find(item => 
        item.category === suggestion.category && 
        item.name.toLowerCase().includes(suggestion.name.toLowerCase().split(' ')[0])
      );
    }
    
    if (matchedItem && !usedItemIds.has(matchedItem.id)) {
      recommendedItems.push({
        ...matchedItem,
        suggestedQuantity: suggestion.suggestedQuantity,
        priority: suggestion.priority,
        room: suggestion.room
      });
      usedItemIds.add(matchedItem.id);
    }
  }
  
  // Fill remaining slots with popular items not already included
  for (const item of availableItems) {
    if (recommendedItems.length >= maxItems) break;
    
    if (!usedItemIds.has(item.id)) {
      recommendedItems.push({
        ...item,
        suggestedQuantity: 1,
        priority: 3,
        room: 'general'
      });
      usedItemIds.add(item.id);
    }
  }
  
  return recommendedItems;
}