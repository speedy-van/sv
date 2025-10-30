'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const SpeedyAIBot = dynamic(() => import('./SpeedyAIBot'), { ssr: false });
const SpeedyAIBotMobile = dynamic(() => import('./SpeedyAIBotMobile'), { ssr: false });

export default function SpeedyAIBotWrapper() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted) {
    return null;
  }

  return isMobile ? <SpeedyAIBotMobile key="mobile-bot" /> : <SpeedyAIBot key="desktop-bot" />;
}

