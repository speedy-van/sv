import React from 'react';
import { Image, ImageProps } from '@chakra-ui/react';

interface OptimizedImageProps extends Omit<ImageProps, 'alt'> {
  src: string;
  alt: string;
  keywords?: string[];
  priority?: boolean;
  lazy?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  keywords = [],
  priority = false,
  lazy = true,
  ...props
}) => {
  // Generate SEO-optimized alt text
  const generateAltText = () => {
    if (alt) return alt;
    
    // Extract keywords from props or use default
    const defaultKeywords = [
      'man and van UK',
      'house removals UK',
      'furniture delivery UK',
      'moving services UK',
      'van hire UK',
      'removal company UK'
    ];
    
    const allKeywords = [...keywords, ...defaultKeywords];
    const randomKeyword = allKeywords[Math.floor(Math.random() * allKeywords.length)];
    
    return `Professional ${randomKeyword} service with experienced drivers and comprehensive insurance coverage`;
  };

  return (
    <Image
      src={src}
      alt={generateAltText()}
      loading={lazy && !priority ? 'lazy' : 'eager'}
      decoding="async"
      style={{
        objectFit: 'cover',
        transition: 'opacity 0.3s ease-in-out',
      }}
      onLoad={(e) => {
        // Add fade-in effect
        const target = e.target as HTMLImageElement;
        target.style.opacity = '1';
      }}
      onError={(e) => {
        // Handle image loading errors
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        console.warn(`Failed to load image: ${src}`);
      }}
      {...props}
    />
  );
};

export default OptimizedImage;
