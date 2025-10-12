const fs = require('fs');
const path = require('path');

// Define item categories and their associated images
const categories = {
  furniture: [
    'sofa.png',
    'chair.png',
    'table.png',
    'bed.png',
    'desk.png',
    'bookshelf.png',
    'book_shelf.png',
    'coffee_table.png',
    'dining_table.png',
    'office_chair.png',
    'office_desk.png',
    'armchair.png',
    'patio_chair.png',
    'garden_table.png',
    'filing_cabinet.png',
    'bed_frame.png',
    'mattress.png',
    'wardrobe.png',
  ],
  appliances: [
    'refrigerator.png',
    'washer.png',
    'dryer.png',
    'dishwasher.png',
    'oven.png',
    'stove.png',
    'microwave.png',
    'toaster.png',
    'kettle.png',
    'fan.png',
    'air_conditioner.png',
    'mini_fridge.png',
    'fridge_freezer.png',
    'vacuum_cleaner.png',
  ],
  electronics: [
    'tv.png',
    'television.png',
    'computer.png',
    'computer_monitor.png',
    'printer_scanner.png',
    'electronics.png',
  ],
  boxes: [
    'box.png',
    'boxes.png',
    'large-box.png',
    'medium-box.png',
    'small-box.png',
    'wardrobe-box.png',
    'plastic_bin.png',
  ],
  misc: [
    'bicycle.png',
    'bbq_grill.png',
    'treadmill.png',
    'gym_equipment.png',
    'sports.png',
    'outdoor.png',
    'lawn_mower.png',
    'piano.png',
    'lamp.png',
    'mirror.png',
    'painting_frame.png',
    'plant_pot.png',
    'suitcase.png',
    'whiteboard.png',
    'kitchen.png',
    'kitchen_cabinet.png',
    'living_room.png',
    'furniture.png',
    'other.png',
    'custom.png',
  ],
};

// Create category directories
const itemsDir = path.join(__dirname, '../public/items');

// Create directories if they don't exist
Object.keys(categories).forEach(category => {
  const categoryDir = path.join(itemsDir, category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
    console.log(`Created directory: ${category}`);
  }
});

// Move files to their respective categories
Object.entries(categories).forEach(([category, files]) => {
  files.forEach(file => {
    const sourcePath = path.join(itemsDir, file);
    const destPath = path.join(itemsDir, category, file);

    if (fs.existsSync(sourcePath)) {
      fs.renameSync(sourcePath, destPath);
      console.log(`Moved ${file} to ${category}/`);
    } else {
      console.log(`File not found: ${file}`);
    }
  });
});

console.log('Image organization complete!');
