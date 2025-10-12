import { chakra, shouldForwardProp } from '@chakra-ui/react';
import { isValidMotionProp, motion } from 'framer-motion';

// Create a custom motion component that properly forwards props
export const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
});

export const MotionFlex = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
  baseStyle: { display: 'flex' },
});

export const MotionVStack = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
  baseStyle: { display: 'flex', flexDirection: 'column' },
});

export const MotionHStack = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
  baseStyle: { display: 'flex', flexDirection: 'row' },
});

export const MotionButton = chakra(motion.button, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
});

export const MotionCard = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
  baseStyle: {
    borderRadius: 'md',
    boxShadow: 'sm',
    p: 4,
  },
});

export const MotionContainer = chakra(motion.div, {
  shouldForwardProp: (prop) => isValidMotionProp(prop) || shouldForwardProp(prop),
  baseStyle: { maxW: 'container.lg', mx: 'auto', px: 4 },
});