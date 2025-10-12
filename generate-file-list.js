const fs = require('fs');
const path = require('path');

const imagesDir = 'public/UK_Removal_Dataset/Images_Only';
const categories = fs.readdirSync(imagesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

let totalFiles = 0;
const categoryFiles = {};

categories.forEach(category => {
  const categoryPath = path.join(imagesDir, category);
  const files = fs.readdirSync(categoryPath)
    .filter(file => file.endsWith('.jpg'))
    .map(file => file);

  categoryFiles[category] = files;
  totalFiles += files.length;
  console.log(`${category}: ${files.length} files`);
});

console.log(`\nTotal files: ${totalFiles}`);

// Generate the JavaScript object
console.log('\nGenerating categoryFiles object...');
console.log('const categoryFiles = {');
Object.entries(categoryFiles).forEach(([category, files]) => {
  console.log(`  '${category}': [`);
  files.forEach(file => {
    console.log(`    '${file}',`);
  });
  console.log('  ],');
});
console.log('};');
