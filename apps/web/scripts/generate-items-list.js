/**
 * Generate items list from UK_Removal_Dataset images
 * Run: node scripts/generate-items-list.js
 */

const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../public/UK_Removal_Dataset/Images_Only');
const OUTPUT_FILE = path.join(__dirname, '../src/lib/uk-removal-items-data.ts');

const CATEGORY_MAP = {
  'Antiques_Collectibles': 'Antiques & Collectibles',
  'Bag_luggage_box': 'Bags & Luggage',
  'Bathroom_Furniture': 'Bathroom',
  'Bedroom': 'Bedroom',
  'Carpets_Rugs': 'Carpets & Rugs',
  'Children_Baby_Items': 'Children & Baby',
  'Dining_Room_Furniture': 'Dining Room',
  'Electrical_Electronic': 'Electronics',
  'Garden_Outdoor': 'Garden & Outdoor',
  'Gym_Fitness_Equipment': 'Gym & Fitness',
  'Kitchen_appliances': 'Kitchen',
  'Living_room_Furniture': 'Living Room',
  'Miscellaneous_household': 'Miscellaneous',
  'Musical_instruments': 'Musical Instruments',
  'Office_furniture': 'Office',
  'Pet_items': 'Pet Items',
  'Special_Awkward_items': 'Special Items',
  'Wardrobes_closet': 'Wardrobes',
};

function parseFileName(fileName, folder) {
  // Extract weight from filename (e.g., "_45kg.jpg")
  const weightMatch = fileName.match(/_(\d+)kg\.jpg$/);
  const weight = weightMatch ? parseInt(weightMatch[1]) : 0;
  
  // Remove weight and extension
  const namePart = fileName.replace(/_\d+kg\.jpg$/, '').replace(/_/g, ' ');
  
  // Capitalize words
  const name = namePart
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Create unique ID
  const id = fileName.replace('.jpg', '').replace(/_jpg/g, '');
  
  return {
    id,
    name,
    weight,
    category: CATEGORY_MAP[folder] || folder,
    image: `/UK_Removal_Dataset/Images_Only/${folder}/${fileName}`,
    folder
  };
}

function generateItemsList() {
  const allItems = [];
  
  // Read all folders
  const folders = fs.readdirSync(IMAGES_DIR);
  
  folders.forEach(folder => {
    const folderPath = path.join(IMAGES_DIR, folder);
    
    if (fs.statSync(folderPath).isDirectory()) {
      // Read all images in folder
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.jpg'));
      
      files.forEach(file => {
        const item = parseFileName(file, folder);
        allItems.push(item);
      });
    }
  });
  
  // Generate TypeScript file
  const tsContent = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from UK_Removal_Dataset/Images_Only
 * Total Items: ${allItems.length}
 * Run: node scripts/generate-items-list.js to regenerate
 */

export interface RemovalItem {
  id: string;
  name: string;
  category: string;
  weight: number;
  image: string;
  folder: string;
}

export const ALL_REMOVAL_ITEMS: RemovalItem[] = ${JSON.stringify(allItems, null, 2)};

export function getAllCategories(): string[] {
  const categories = new Set(ALL_REMOVAL_ITEMS.map(item => item.category));
  return ['All', ...Array.from(categories).sort()];
}

export function filterItemsByCategory(category: string): RemovalItem[] {
  if (category === 'All') {
    return ALL_REMOVAL_ITEMS;
  }
  return ALL_REMOVAL_ITEMS.filter(item => item.category === category);
}

export function searchItems(query: string): RemovalItem[] {
  if (!query || query.trim() === '') {
    return ALL_REMOVAL_ITEMS;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  
  return ALL_REMOVAL_ITEMS.filter(item => 
    item.name.toLowerCase().includes(lowerQuery) ||
    item.category.toLowerCase().includes(lowerQuery) ||
    item.folder.toLowerCase().includes(lowerQuery)
  );
}
`;
  
  fs.writeFileSync(OUTPUT_FILE, tsContent);
  
  console.log(`✅ Generated ${allItems.length} items from ${folders.length} categories`);
  console.log(`📝 Output: ${OUTPUT_FILE}`);
}

generateItemsList();

