"use client";

/**
 * Motion provider for Framer Motion animations
 */

import { ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';

interface MotionProviderProps {
  children: ReactNode;
}

export default function MotionProvider({ children }: MotionProviderProps) {
  return (
    <AnimatePresence mode="wait">
      {children}
    </AnimatePresence>
  );
}