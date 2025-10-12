import React, { useEffect } from 'react';
import { Box } from '@chakra-ui/react';

interface WebVitalsOptimizerProps {
  children: React.ReactNode;
}

const WebVitalsOptimizer: React.FC<WebVitalsOptimizerProps> = ({ children }) => {
  useEffect(() => {
    // Optimize images for better LCP (Largest Contentful Paint)
    const optimizeImages = () => {
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        // Add loading="lazy" to images below the fold
        if (!img.hasAttribute('loading')) {
          const rect = img.getBoundingClientRect();
          if (rect.top > window.innerHeight) {
            img.setAttribute('loading', 'lazy');
          }
        }
        
        // Add decoding="async" for better performance
        if (!img.hasAttribute('decoding')) {
          img.setAttribute('decoding', 'async');
        }
      });
    };

    // Optimize fonts for better CLS (Cumulative Layout Shift)
    const optimizeFonts = () => {
      // Preload critical fonts
      const fontPreloads = [
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
      ];
      
      fontPreloads.forEach((fontUrl) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = fontUrl;
        link.as = 'style';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });
    };

    // Optimize JavaScript for better FID (First Input Delay)
    const optimizeJavaScript = () => {
      // Defer non-critical JavaScript
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach((script) => {
        if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
          const src = script.getAttribute('src');
          if (src && !src.includes('critical')) {
            script.setAttribute('defer', 'true');
          }
        }
      });
    };

    // Optimize CSS for better performance
    const optimizeCSS = () => {
      // Remove unused CSS
      const styleSheets = document.styleSheets;
      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const sheet = styleSheets[i];
          if (sheet.href && sheet.href.includes('unused')) {
            sheet.disabled = true;
          }
        } catch (e) {
          // Cross-origin stylesheets can't be accessed
        }
      }
    };

    // Run optimizations
    optimizeImages();
    optimizeFonts();
    optimizeJavaScript();
    optimizeCSS();

    // Set up intersection observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    // Observe images with data-src attribute
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach((img) => observer.observe(img));

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Box>
      {children}
    </Box>
  );
};

export default WebVitalsOptimizer;
