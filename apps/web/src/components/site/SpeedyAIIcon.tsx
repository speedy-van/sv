'use client';

import { Box } from '@chakra-ui/react';

interface SpeedyAIIconProps {
  size?: number;
}

export default function SpeedyAIIcon({ size = 60 }: SpeedyAIIconProps) {
  return (
    <Box
      position="relative"
      width={`${size}px`}
      height={`${size}px`}
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      borderRadius="20%"
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '20%',
        }}
      >
        <source src="/logo/AB7D9FB6-5E70-43CC-A81F-A47E875EC79F-video.mp4" type="video/mp4" />
      </video>
    </Box>
  );
}

