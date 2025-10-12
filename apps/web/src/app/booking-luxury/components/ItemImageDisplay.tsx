/**
 * Item Image Display Component
 * Handles image display with proper fallbacks and error handling
 */

import React, { useState } from 'react';
import { Box, Image, Flex, Text } from '@chakra-ui/react';
import { getItemImageWithFallback } from '../../../lib/images/item-images';

interface ItemImageDisplayProps {
  itemId: string;
  itemName: string;
  category: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  showHover?: boolean;
  showFallbackText?: boolean;
}

export const ItemImageDisplay: React.FC<ItemImageDisplayProps> = ({
  itemId,
  itemName,
  category,
  width = "100%",
  height = "100%",
  borderRadius = "lg",
  showHover = true,
  showFallbackText = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  
  const imageInfo = getItemImageWithFallback(itemId, category);
  
  // Determine which image to show
  let imageSrc = imageInfo.primary;
  if (imageError && !fallbackError) {
    imageSrc = imageInfo.fallback;
  }

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
    } else if (!fallbackError) {
      setFallbackError(true);
    }
  };

  // If both images failed, show gradient fallback
  if (imageError && fallbackError) {
    return (
      <Box 
        w={width} 
        h={height} 
        borderRadius={borderRadius} 
        overflow="hidden"
        position="relative"
      >
        <Flex 
          w="100%" 
          h="100%" 
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          align="center" 
          justify="center"
          direction="column"
        >
          {showFallbackText && (
            <>
              <Text fontSize="2xl" color="white" fontWeight="bold">
                {itemName.charAt(0).toUpperCase()}
              </Text>
              <Text fontSize="xs" color="white" opacity={0.8}>
                {category}
              </Text>
            </>
          )}
        </Flex>
      </Box>
    );
  }

  return (
    <Box 
      w={width} 
      h={height} 
      borderRadius={borderRadius} 
      overflow="hidden"
      position="relative"
    >
      <Image
        src={imageSrc}
        alt={itemName}
        w="100%"
        h="100%"
        objectFit="cover"
        objectPosition="center"
        transition={showHover ? "all 0.3s ease" : undefined}
        _hover={showHover ? { transform: 'scale(1.05)' } : undefined}
        onError={handleImageError}
        fallback={
          <Flex 
            w="100%" 
            h="100%" 
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            align="center" 
            justify="center"
            direction="column"
          >
            {showFallbackText && (
              <>
                <Text fontSize="2xl" color="white" fontWeight="bold">
                  {itemName.charAt(0).toUpperCase()}
                </Text>
                <Text fontSize="xs" color="white" opacity={0.8}>
                  {category}
                </Text>
              </>
            )}
          </Flex>
        }
      />
    </Box>
  );
};

export default ItemImageDisplay;
