/**
 * Icon Converter Script
 * Converts SVG source files to PNG for Expo
 * 
 * Requirements: npm install sharp
 * Usage: node convert-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

const conversions = [
  {
    input: 'icon-source.svg',
    output: 'icon.png',
    width: 1024,
    height: 1024,
    description: 'App Icon'
  },
  {
    input: 'splash-source.svg',
    output: 'splash.png',
    width: 1284,
    height: 2778,
    description: 'Splash Screen'
  },
  {
    input: 'adaptive-icon-source.svg',
    output: 'adaptive-icon.png',
    width: 1024,
    height: 1024,
    description: 'Android Adaptive Icon'
  }
];

async function convertIcons() {
  console.log('🎨 Converting SVG icons to PNG...\n');
  
  for (const conversion of conversions) {
    const inputPath = path.join(assetsDir, conversion.input);
    const outputPath = path.join(assetsDir, conversion.output);
    
    try {
      // Check if source file exists
      if (!fs.existsSync(inputPath)) {
        console.log(`⚠️  ${conversion.input} not found, skipping...`);
        continue;
      }
      
      console.log(`📝 Converting ${conversion.description}...`);
      console.log(`   Input:  ${conversion.input}`);
      console.log(`   Output: ${conversion.output}`);
      console.log(`   Size:   ${conversion.width}×${conversion.height}px`);
      
      await sharp(inputPath)
        .resize(conversion.width, conversion.height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      const stats = fs.statSync(outputPath);
      console.log(`   ✅ Created (${(stats.size / 1024).toFixed(2)} KB)\n`);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('🎉 Icon conversion complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Check the generated PNG files in assets/ folder');
  console.log('   2. Run: pnpm run start');
  console.log('   3. Test the app with new icons');
  console.log('   4. Build for TestFlight: pnpm exec eas build --platform ios --profile production');
}

// Run conversion
convertIcons().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

