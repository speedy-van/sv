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

// Directories to upload
const IMAGE_DIRS = [
  { path: path.join(__dirname, 'public', 'images'), prefix: 'speedy-van' },
  { path: path.join(__dirname, 'public', 'UK_Removal_Dataset', 'Images_Only'), prefix: 'speedy-van/uk-dataset' }
];
const VIDEO_DIRS = [
  { path: path.join(__dirname, 'public', 'videos'), prefix: 'speedy-van/videos' }
];
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
 * Get all video files recursively
 */
function getAllVideos(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllVideos(filePath, fileList);
    } else if (/\.(mp4|webm|mov|avi|mkv)$/i.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Upload single image to Cloudinary with custom prefix
 */
async function uploadImageWithPrefix(filePath, folderPrefix) {
  try {
    // Get relative path for public_id
    const relativePath = path.relative(path.join(__dirname, 'public'), filePath);
    const publicId = `${folderPrefix}/${relativePath.replace(/\\/g, '/').replace(/\.[^/.]+$/, '')}`;
    
    console.log(`Uploading: ${relativePath}`);
    
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      overwrite: true,
      resource_type: 'image',
      // Enable automatic quality optimization
      quality: 'auto:best',
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
 * Upload single video to Cloudinary with custom prefix
 */
async function uploadVideoWithPrefix(filePath, folderPrefix) {
  try {
    // Get relative path for public_id
    const relativePath = path.relative(path.join(__dirname, 'public'), filePath);
    const publicId = `${folderPrefix}/${relativePath.replace(/\\/g, '/').replace(/\.[^/.]+$/, '')}`;
    
    console.log(`Uploading video: ${relativePath}`);
    
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      overwrite: true,
      resource_type: 'video',
      // Enable automatic quality optimization for videos
      quality: 'auto:best',
    });
    
    console.log(`✅ Uploaded video: ${publicId}`);
    console.log(`   URL: ${result.secure_url}`);
    
    return { success: true, publicId, url: result.secure_url };
  } catch (error) {
    console.error(`❌ Failed to upload video ${filePath}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Upload single image to Cloudinary (legacy function for compatibility)
 */
async function uploadImage(filePath) {
  return uploadImageWithPrefix(filePath, FOLDER_PREFIX);
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
  
  // Collect all images from all directories
  let allImages = [];
  
  for (const dir of IMAGE_DIRS) {
    if (!fs.existsSync(dir.path)) {
      console.log(`⚠️  Skipping ${dir.path} - directory not found`);
      continue;
    }
    
    const images = getAllImages(dir.path);
    console.log(`📁 Found ${images.length} images in ${path.basename(dir.path)}`);
    
    // Add images with their specific prefix
    images.forEach(img => {
      allImages.push({ filePath: img, prefix: dir.prefix, type: 'image' });
    });
  }
  
  // Collect all videos from all directories
  let allVideos = [];
  
  for (const dir of VIDEO_DIRS) {
    if (!fs.existsSync(dir.path)) {
      console.log(`⚠️  Skipping ${dir.path} - directory not found`);
      continue;
    }
    
    const videos = getAllVideos(dir.path);
    console.log(`📁 Found ${videos.length} videos in ${path.basename(dir.path)}`);
    
    // Add videos with their specific prefix
    videos.forEach(vid => {
      allVideos.push({ filePath: vid, prefix: dir.prefix, type: 'video' });
    });
  }
  
  // Combine all files
  const allFiles = [...allImages, ...allVideos];
  
  console.log(`\n📦 Total: ${allImages.length} images + ${allVideos.length} videos = ${allFiles.length} files to upload\n`);
  
  if (allFiles.length === 0) {
    console.log('No files found to upload');
    return;
  }
  
  // Upload files in batches
  const BATCH_SIZE = 10;
  const results = { success: 0, failed: 0 };
  
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allFiles.length / BATCH_SIZE)}`);
    
    const batchResults = await Promise.all(batch.map(item => {
      if (item.type === 'video') {
        return uploadVideoWithPrefix(item.filePath, item.prefix);
      } else {
        return uploadImageWithPrefix(item.filePath, item.prefix);
      }
    }));
    
    batchResults.forEach(result => {
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
      }
    });
    
    // Rate limiting - wait 1 second between batches
    if (i + BATCH_SIZE < allFiles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✨ Upload Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${allFiles.length} (${allImages.length} images + ${allVideos.length} videos)`);
  console.log('\n💡 Next steps:');
  console.log('1. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in Render environment');
  console.log('2. Deploy the updated code');
  console.log('3. Test image/video loading performance');
}

// Run upload
uploadAllImages().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
