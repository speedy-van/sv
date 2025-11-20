/**
 * Upload UK Removal Dataset to Cloudinary
 * 
 * This script uploads all images from public/images to Cloudinary
 * Run: node upload-to-cloudinary.js
 * 
 * Requirements:
 * 1. npm install cloudinary dotenv
 * 2. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local
 */

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Directory to upload
const IMAGE_DIR = path.join(__dirname, 'public', 'images');
const FOLDER_PREFIX = 'speedy-van'; // Cloudinary folder name

/**
 * Get all image files recursively
 */
function getAllImages(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllImages(filePath, fileList);
    } else if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Upload single image to Cloudinary
 */
async function uploadImage(filePath) {
  try {
    // Get relative path for public_id
    const relativePath = path.relative(path.join(__dirname, 'public'), filePath);
    const publicId = `${FOLDER_PREFIX}/${relativePath.replace(/\\/g, '/').replace(/\.[^/.]+$/, '')}`;
    
    console.log(`Uploading: ${relativePath}`);
    
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      overwrite: true,
      resource_type: 'image',
      // Enable automatic format and quality optimization
      format: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    });
    
    console.log(`✅ Uploaded: ${publicId}`);
    console.log(`   URL: ${result.secure_url}`);
    
    return { success: true, publicId, url: result.secure_url };
  } catch (error) {
    console.error(`❌ Failed to upload ${filePath}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main upload function
 */
async function uploadAllImages() {
  console.log('🚀 Starting Cloudinary upload...\n');
  
  // Verify configuration
  if (!cloudinary.config().cloud_name || !cloudinary.config().api_key || !cloudinary.config().api_secret) {
    console.error('❌ Cloudinary credentials not configured!');
    console.error('   Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local');
    process.exit(1);
  }
  
  // Check if image directory exists
  if (!fs.existsSync(IMAGE_DIR)) {
    console.error(`❌ Image directory not found: ${IMAGE_DIR}`);
    process.exit(1);
  }
  
  // Get all images
  const images = getAllImages(IMAGE_DIR);
  console.log(`📁 Found ${images.length} images to upload\n`);
  
  if (images.length === 0) {
    console.log('No images found to upload');
    return;
  }
  
  // Upload images in batches
  const BATCH_SIZE = 10;
  const results = { success: 0, failed: 0 };
  
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(images.length / BATCH_SIZE)}`);
    
    const batchResults = await Promise.all(batch.map(uploadImage));
    
    batchResults.forEach(result => {
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
      }
    });
    
    // Rate limiting - wait 1 second between batches
    if (i + BATCH_SIZE < images.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✨ Upload Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${images.length}`);
  console.log('\n💡 Next steps:');
  console.log('1. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in Render environment');
  console.log('2. Deploy the updated code');
  console.log('3. Test image loading performance');
}

// Run upload
uploadAllImages().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
