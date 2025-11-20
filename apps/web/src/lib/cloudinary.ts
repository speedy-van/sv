/**
 * Cloudinary Image Optimization Utility
 * 
 * Replaces Next.js Image Optimization with Cloudinary CDN
 * Solves 60-120s image load times on Render
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  crop?: 'scale' | 'fit' | 'fill' | 'limit' | 'crop';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
  aspectRatio?: string;
  dpr?: number | 'auto';
}

/**
 * Generate Cloudinary URL with transformations
 * @param publicId - Cloudinary public ID (path in your cloud)
 * @param options - Transformation options
 * @returns Optimized Cloudinary URL
 */
export function getCloudinaryUrl(
  publicId: string,
  options: CloudinaryTransformOptions = {}
): string {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'scale',
    gravity = 'auto',
    aspectRatio,
    dpr = 'auto',
  } = options;

  const transformations: string[] = [];

  // Width
  if (width) transformations.push(`w_${width}`);

  // Height
  if (height) transformations.push(`h_${height}`);

  // Aspect ratio
  if (aspectRatio) {
    const [w, h] = aspectRatio.split(':');
    transformations.push(`ar_${w}:${h}`);
  }

  // Crop mode
  if (crop) transformations.push(`c_${crop}`);

  // Gravity (for cropping)
  if (gravity && crop !== 'scale') transformations.push(`g_${gravity}`);

  // Quality
  if (quality) transformations.push(`q_${quality}`);

  // Format
  if (format) transformations.push(`f_${format}`);

  // DPR (device pixel ratio)
  if (dpr) transformations.push(`dpr_${dpr}`);

  // Build URL
  const transformString = transformations.length > 0 ? `${transformations.join(',')}/` : '';
  return `${CLOUDINARY_BASE_URL}/${transformString}${publicId}`;
}

/**
 * Convert local image path to Cloudinary URL
 * @param localPath - Local path like /images/truck.png
 * @param options - Transformation options
 * @returns Cloudinary URL
 */
export function localToCloudinary(
  localPath: string,
  options: CloudinaryTransformOptions = {}
): string {
  // Remove leading slash and /images/ prefix
  const publicId = localPath.replace(/^\/?(images\/)?/, '');
  return getCloudinaryUrl(publicId, options);
}

/**
 * Responsive image sizes for Cloudinary
 */
export const RESPONSIVE_WIDTHS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultraWide: 1920,
} as const;

/**
 * Generate srcset for responsive images
 */
export function getCloudinarySrcSet(
  publicId: string,
  options: CloudinaryTransformOptions = {}
): string {
  return Object.values(RESPONSIVE_WIDTHS)
    .map((width) => {
      const url = getCloudinaryUrl(publicId, { ...options, width });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Presets for common image use cases
 */
export const CLOUDINARY_PRESETS = {
  thumbnail: { width: 150, height: 150, crop: 'fill', quality: 'auto' },
  card: { width: 400, height: 300, crop: 'fill', quality: 'auto' },
  hero: { width: 1920, height: 1080, crop: 'fill', quality: 'auto' },
  avatar: { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto' },
  product: { width: 800, height: 800, crop: 'fit', quality: 'auto' },
} as const;

/**
 * Get Cloudinary URL with preset
 */
export function getCloudinaryPreset(
  publicId: string,
  preset: keyof typeof CLOUDINARY_PRESETS,
  overrides: CloudinaryTransformOptions = {}
): string {
  return getCloudinaryUrl(publicId, {
    ...CLOUDINARY_PRESETS[preset],
    ...overrides,
  });
}
