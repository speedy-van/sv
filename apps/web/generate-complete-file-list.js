const fs = require('fs');
const path = require('path');

const imagesDir = 'public/UK_Removal_Dataset/Images_Only';

console.log('// Complete categoryFiles object with all actual filenames');
console.log('const categoryFiles = {');

try {
  const categories = fs.readdirSync(imagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort(); // Sort for consistent output

  categories.forEach((category, index) => {
    const categoryPath = path.join(imagesDir, category);
    const files = fs.readdirSync(categoryPath)
      .filter(file => file.endsWith('.jpg'))
      .sort(); // Sort files for consistent output

    console.log(`  '${category}': [`);
    files.forEach((file, fileIndex) => {
      const comma = fileIndex < files.length - 1 ? ',' : '';
      console.log(`    '${file}'${comma}`);
    });
    const comma = index < categories.length - 1 ? ',' : '';
    console.log(`  ]${comma}`);
  });

  console.log('};');

  // Count total files
  let totalFiles = 0;
  categories.forEach(category => {
    const categoryPath = path.join(imagesDir, category);
    const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.jpg'));
    totalFiles += files.length;
  });

  console.log(`\n// Total files: ${totalFiles}`);

} catch (error) {
  console.error('Error reading directory:', error);
}
