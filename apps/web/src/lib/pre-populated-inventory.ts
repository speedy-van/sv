/**
 * Pre-populated Inventory Lists
 * 
 * Provides default item lists based on property type and size
 * following AnyVan's approach of suggesting items for each property size
 */

import { PropertyType } from '../app/booking-luxury/components/PropertyTypeSelector';

export interface PrePopulatedItem {
  name: string;
  category: string;
  room: string;
  suggestedQuantity: number;
  weight: number;
  priority: 1 | 2 | 3; // 1=essential, 2=common, 3=optional
}

// House/Flat Pre-populated Lists
export const STUDIO_ITEMS: PrePopulatedItem[] = [
  // Bedroom essentials
  { name: 'Single Bed', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 25, priority: 1 },
  { name: 'Single Mattress', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 15, priority: 1 },
  { name: 'Bedside Table', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 10, priority: 2 },
  { name: 'Wardrobe', category: 'Wardrobes', room: 'bedroom', suggestedQuantity: 1, weight: 50, priority: 1 },
  
  // Living area
  { name: '2 Seater Sofa', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 40, priority: 1 },
  { name: 'Coffee Table', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 15, priority: 2 },
  { name: 'TV', category: 'Electronics', room: 'living', suggestedQuantity: 1, weight: 15, priority: 2 },
  { name: 'TV Stand', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 20, priority: 2 },
  
  // Kitchen
  { name: 'Small Table', category: 'Dining Room', room: 'dining', suggestedQuantity: 1, weight: 20, priority: 2 },
  { name: 'Chair', category: 'Dining Room', room: 'dining', suggestedQuantity: 2, weight: 5, priority: 2 },
  { name: 'Microwave', category: 'Kitchen', room: 'kitchen', suggestedQuantity: 1, weight: 15, priority: 2 },
  
  // Boxes
  { name: 'Small Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 5, weight: 10, priority: 3 },
  { name: 'Medium Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 3, weight: 15, priority: 3 },
];

export const ONE_BEDROOM_ITEMS: PrePopulatedItem[] = [
  // Bedroom
  { name: 'Double Bed', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 45, priority: 1 },
  { name: 'Double Mattress', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 25, priority: 1 },
  { name: 'Bedside Table', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 2, weight: 10, priority: 1 },
  { name: 'Wardrobe', category: 'Wardrobes', room: 'bedroom', suggestedQuantity: 1, weight: 50, priority: 1 },
  { name: 'Chest of Drawers', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 30, priority: 2 },
  { name: 'Dressing Table', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 25, priority: 3 },
  
  // Living Room
  { name: '3 Seater Sofa', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 60, priority: 1 },
  { name: 'Armchair', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 25, priority: 2 },
  { name: 'Coffee Table', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 15, priority: 1 },
  { name: 'TV Stand', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 20, priority: 2 },
  { name: 'TV', category: 'Electronics', room: 'living', suggestedQuantity: 1, weight: 15, priority: 2 },
  { name: 'Bookshelf', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 30, priority: 3 },
  
  // Dining
  { name: 'Dining Table 4 seater', category: 'Dining Room', room: 'dining', suggestedQuantity: 1, weight: 30, priority: 2 },
  { name: 'Dining Chair', category: 'Dining Room', room: 'dining', suggestedQuantity: 4, weight: 5, priority: 2 },
  
  // Kitchen
  { name: 'Fridge', category: 'Kitchen', room: 'kitchen', suggestedQuantity: 1, weight: 70, priority: 1 },
  { name: 'Washing Machine', category: 'Kitchen', room: 'kitchen', suggestedQuantity: 1, weight: 65, priority: 2 },
  { name: 'Microwave', category: 'Kitchen', room: 'kitchen', suggestedQuantity: 1, weight: 15, priority: 2 },
  
  // Boxes
  { name: 'Small Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 8, weight: 10, priority: 3 },
  { name: 'Medium Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 5, weight: 15, priority: 3 },
  { name: 'Large Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 3, weight: 20, priority: 3 },
];

export const TWO_BEDROOM_ITEMS: PrePopulatedItem[] = [
  // Master Bedroom
  { name: 'King Size Bed', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 65, priority: 1 },
  { name: 'King Size Mattress', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 35, priority: 1 },
  { name: 'Bedside Table', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 2, weight: 10, priority: 1 },
  { name: 'Wardrobe', category: 'Wardrobes', room: 'bedroom', suggestedQuantity: 2, weight: 50, priority: 1 },
  { name: 'Chest of Drawers', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 2, weight: 30, priority: 2 },
  { name: 'Dressing Table', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 25, priority: 2 },
  
  // Second Bedroom
  { name: 'Single Bed', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 2, weight: 25, priority: 2 },
  { name: 'Single Mattress', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 2, weight: 15, priority: 2 },
  
  // Living Room
  { name: '3 Seater Sofa', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 60, priority: 1 },
  { name: '2 Seater Sofa', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 40, priority: 2 },
  { name: 'Armchair', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 25, priority: 2 },
  { name: 'Coffee Table', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 15, priority: 1 },
  { name: 'Side Table', category: 'Living Room', room: 'living', suggestedQuantity: 2, weight: 10, priority: 3 },
  { name: 'TV Stand', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 20, priority: 2 },
  { name: 'TV', category: 'Electronics', room: 'living', suggestedQuantity: 1, weight: 15, priority: 2 },
  { name: 'Bookshelf', category: 'Living Room', room: 'living', suggestedQuantity: 2, weight: 30, priority: 3 },
  
  // Dining
  { name: 'Dining Table 6 seater', category: 'Dining Room', room: 'dining', suggestedQuantity: 1, weight: 40, priority: 1 },
  { name: 'Dining Chair', category: 'Dining Room', room: 'dining', suggestedQuantity: 6, weight: 5, priority: 1 },
  
  // Kitchen
  { name: 'Fridge Freezer', category: 'Kitchen', room: 'kitchen', suggestedQuantity: 1, weight: 80, priority: 1 },
  { name: 'Washing Machine', category: 'Kitchen', room: 'kitchen', suggestedQuantity: 1, weight: 65, priority: 1 },
  { name: 'Microwave', category: 'Kitchen', room: 'kitchen', suggestedQuantity: 1, weight: 15, priority: 2 },
  { name: 'Dishwasher', category: 'Kitchen', room: 'kitchen', suggestedQuantity: 1, weight: 50, priority: 3 },
  
  // Boxes
  { name: 'Small Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 12, weight: 10, priority: 3 },
  { name: 'Medium Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 8, weight: 15, priority: 3 },
  { name: 'Large Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 5, weight: 20, priority: 3 },
];

export const THREE_BEDROOM_ITEMS: PrePopulatedItem[] = [
  // Master Bedroom
  { name: 'King Size Bed', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 65, priority: 1 },
  { name: 'King Size Mattress', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 35, priority: 1 },
  { name: 'Bedside Table', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 2, weight: 10, priority: 1 },
  { name: 'Wardrobe', category: 'Wardrobes', room: 'bedroom', suggestedQuantity: 3, weight: 50, priority: 1 },
  { name: 'Chest of Drawers', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 3, weight: 30, priority: 1 },
  { name: 'Dressing Table', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 25, priority: 2 },
  
  // Second & Third Bedrooms
  { name: 'Double Bed', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 45, priority: 1 },
  { name: 'Double Mattress', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 1, weight: 25, priority: 1 },
  { name: 'Single Bed', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 2, weight: 25, priority: 2 },
  { name: 'Single Mattress', category: 'Bedroom', room: 'bedroom', suggestedQuantity: 2, weight: 15, priority: 2 },
  
  // Living Room
  { name: '3 Seater Sofa', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 60, priority: 1 },
  { name: '2 Seater Sofa', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 40, priority: 1 },
  { name: 'Armchair', category: 'Living Room', room: 'living', suggestedQuantity: 2, weight: 25, priority: 2 },
  { name: 'Coffee Table', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 15, priority: 1 },
  { name: 'Side Table', category: 'Living Room', room: 'living', suggestedQuantity: 2, weight: 10, priority: 2 },
  { name: 'TV Stand', category: 'Living Room', room: 'living', suggestedQuantity: 1, weight: 20, priority: 1 },
  { name: 'TV', category: 'Electronics', room: 'living', suggestedQuantity: 2, weight: 15, priority: 1 },
  { name: 'Bookshelf', category: 'Living Room', room: 'living', suggestedQuantity: 2, weight: 30, priority: 2 },
  
  // Dining
  { name: 'Dining Table 6 seater', category: 'Dining Room', room: 'dining', suggestedQuantity: 1, weight: 40, priority: 1 },
  { name: 'Dining Chair', category: 'Dining Room', room: 'dining', suggestedQuantity: 6, weight: 5, priority: 1 },
  { name: 'Sideboard', category: 'Dining Room', room: 'dining', suggestedQuantity: 1, weight: 40, priority: 3 },
  
  // Kitchen
  { name: 'Fridge Freezer', category: 'Kitchen', room: 'kitchen', suggestedQuantity: 1, weight: 80, priority: 1 },
  { name: 'Washing Machine', category: 'Kitchen', room: 'kitchen', suggestedQuantity: 1, weight: 65, priority: 1 },
  { name: 'Microwave', category: 'Kitchen', room: 'kitchen', suggestedQuantity: 1, weight: 15, priority: 1 },
  { name: 'Dishwasher', category: 'Kitchen', room: 'kitchen', suggestedQuantity: 1, weight: 50, priority: 2 },
  
  // Garden (if applicable)
  { name: 'Garden Table', category: 'Garden & Outdoor', room: 'garden', suggestedQuantity: 1, weight: 25, priority: 3 },
  { name: 'Garden Chair', category: 'Garden & Outdoor', room: 'garden', suggestedQuantity: 4, weight: 8, priority: 3 },
  { name: 'Lawnmower', category: 'Garden & Outdoor', room: 'garden', suggestedQuantity: 1, weight: 20, priority: 3 },
  
  // Boxes
  { name: 'Small Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 15, weight: 10, priority: 3 },
  { name: 'Medium Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 12, weight: 15, priority: 3 },
  { name: 'Large Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 8, weight: 20, priority: 3 },
];

// Office Pre-populated Lists
export const SMALL_OFFICE_ITEMS: PrePopulatedItem[] = [
  { name: 'Office Desk', category: 'Office', room: 'office', suggestedQuantity: 2, weight: 30, priority: 1 },
  { name: 'Office Chair', category: 'Office', room: 'office', suggestedQuantity: 2, weight: 15, priority: 1 },
  { name: 'Filing Cabinet', category: 'Office', room: 'office', suggestedQuantity: 1, weight: 25, priority: 2 },
  { name: 'Bookshelf', category: 'Office', room: 'office', suggestedQuantity: 1, weight: 20, priority: 2 },
  { name: 'Desktop Computer', category: 'Electronics', room: 'office', suggestedQuantity: 2, weight: 10, priority: 1 },
  { name: 'Printer', category: 'Electronics', room: 'office', suggestedQuantity: 1, weight: 15, priority: 2 },
  { name: 'Small Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 5, weight: 10, priority: 3 },
];

export const MEDIUM_OFFICE_ITEMS: PrePopulatedItem[] = [
  { name: 'Office Desk', category: 'Office', room: 'office', suggestedQuantity: 5, weight: 30, priority: 1 },
  { name: 'Office Chair', category: 'Office', room: 'office', suggestedQuantity: 5, weight: 15, priority: 1 },
  { name: 'Meeting Table', category: 'Office', room: 'office', suggestedQuantity: 1, weight: 50, priority: 2 },
  { name: 'Filing Cabinet', category: 'Office', room: 'office', suggestedQuantity: 3, weight: 25, priority: 1 },
  { name: 'Bookshelf', category: 'Office', room: 'office', suggestedQuantity: 2, weight: 20, priority: 2 },
  { name: 'Storage Cupboard', category: 'Office', room: 'office', suggestedQuantity: 2, weight: 40, priority: 2 },
  { name: 'Desktop Computer', category: 'Electronics', room: 'office', suggestedQuantity: 5, weight: 10, priority: 1 },
  { name: 'Printer', category: 'Electronics', room: 'office', suggestedQuantity: 1, weight: 15, priority: 1 },
  { name: 'Whiteboard', category: 'Office', room: 'office', suggestedQuantity: 1, weight: 10, priority: 3 },
  { name: 'Small Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 10, weight: 10, priority: 3 },
  { name: 'Medium Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 8, weight: 15, priority: 3 },
];

// Storage Pre-populated Lists
export const SMALL_STORAGE_ITEMS: PrePopulatedItem[] = [
  { name: 'Small Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 8, weight: 10, priority: 1 },
  { name: 'Medium Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 5, weight: 15, priority: 1 },
  { name: 'Large Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 2, weight: 20, priority: 2 },
];

export const MEDIUM_STORAGE_ITEMS: PrePopulatedItem[] = [
  { name: 'Small Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 15, weight: 10, priority: 1 },
  { name: 'Medium Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 10, weight: 15, priority: 1 },
  { name: 'Large Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 5, weight: 20, priority: 1 },
];

export const LARGE_STORAGE_ITEMS: PrePopulatedItem[] = [
  { name: 'Small Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 25, weight: 10, priority: 1 },
  { name: 'Medium Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 15, weight: 15, priority: 1 },
  { name: 'Large Box', category: 'Boxes', room: 'boxes', suggestedQuantity: 10, weight: 20, priority: 1 },
];

// Helper function to get pre-populated items
export function getPrePopulatedItems(
  propertyType: PropertyType,
  propertySize: string
): PrePopulatedItem[] {
  if (propertyType === 'house') {
    switch (propertySize) {
      case 'studio': return STUDIO_ITEMS;
      case '1-bedroom': return ONE_BEDROOM_ITEMS;
      case '2-bedroom': return TWO_BEDROOM_ITEMS;
      case '3-bedroom': return THREE_BEDROOM_ITEMS;
      // 4 and 5 bedroom use 3 bedroom as base with slight modifications
      case '4-bedroom': 
      case '5-bedroom': 
        return THREE_BEDROOM_ITEMS;
      default: return [];
    }
  } else if (propertyType === 'office') {
    switch (propertySize) {
      case 'office-1-2': return SMALL_OFFICE_ITEMS;
      case 'office-3-5': 
      case 'office-6-10':
      case 'office-10-plus':
        return MEDIUM_OFFICE_ITEMS;
      default: return [];
    }
  } else if (propertyType === 'storage') {
    switch (propertySize) {
      case 'storage-small': return SMALL_STORAGE_ITEMS;
      case 'storage-medium': return MEDIUM_STORAGE_ITEMS;
      case 'storage-large': return LARGE_STORAGE_ITEMS;
      default: return [];
    }
  }
  
  return [];
}

// Helper to filter by priority
export function filterByPriority(
  items: PrePopulatedItem[],
  maxPriority: 1 | 2 | 3
): PrePopulatedItem[] {
  return items.filter(item => item.priority <= maxPriority);
}
