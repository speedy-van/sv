/**
 * Enterprise-Grade Image Component
 * 
 * Features:
 * - Automatic WebP/AVIF conversion
 * - Lazy loading with blur placeholder
 * - Responsive images (srcset)
 * - CDN optimization
 * - Core Web Vitals optimization
 * 
 * Based on best practices from:
 * - Amazon
 * - Netflix
 * - Airbnb
 */

'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { Box, Skeleton } from '@chakra-ui/react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  aspectRatio?: string;
  borderRadius?: string;
  showSkeleton?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 85,
  sizes,
  fill = false,
  objectFit = 'cover',
  aspectRatio,
  borderRadius = '0',
  showSkeleton = true,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Default sizes for responsive images
  const defaultSizes = sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

  // Fallback image
  const fallbackSrc = '/images/placeholder.png';

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <Box
      position="relative"
      width={fill ? '100%' : width}
      height={fill ? '100%' : height}
      aspectRatio={aspectRatio}
      borderRadius={borderRadius}
      overflow="hidden"
    >
      {/* Skeleton loader */}
      {isLoading && showSkeleton && (
        <Skeleton
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          borderRadius={borderRadius}
        />
      )}

      {/* Optimized Image */}
      <Image
        src={hasError ? fallbackSrc : src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        quality={quality}
        sizes={defaultSizes}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        placeholder="blur"
        blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(width || 700, height || 475))}`}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          objectFit,
          transition: 'opacity 0.3s ease-in-out',
          opacity: isLoading ? 0 : 1,
        }}
        {...props}
      />
    </Box>
  );
}

/**
 * Generate shimmer effect for blur placeholder
 */
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="0%" />
      <stop stop-color="#edeef1" offset="20%" />
      <stop stop-color="#f6f7f8" offset="40%" />
      <stop stop-color="#f6f7f8" offset="100%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

/**
 * Convert SVG to base64
 */
const toBase64 = (str: string) =>
  typeof window === 'undefined' ? Buffer.from(str).toString('base64') : window.btoa(str);

/**
 * Preset configurations for common use cases
 */

// Hero image (above the fold)
export function HeroImage(props: Omit<OptimizedImageProps, 'priority' | 'quality'>) {
  return <OptimizedImage {...props} priority quality={90} />;
}

// Thumbnail image
export function ThumbnailImage(props: Omit<OptimizedImageProps, 'quality' | 'sizes'>) {
  return (
    <OptimizedImage
      {...props}
      quality={75}
      sizes="(max-width: 768px) 150px, 200px"
    />
  );
}

// Background image
export function BackgroundImage(props: Omit<OptimizedImageProps, 'fill' | 'objectFit'>) {
  return <OptimizedImage {...props} fill objectFit="cover" />;
}

// Avatar image
export function AvatarImage(props: Omit<OptimizedImageProps, 'borderRadius' | 'quality'>) {
  return <OptimizedImage {...props} borderRadius="full" quality={80} />;
}

