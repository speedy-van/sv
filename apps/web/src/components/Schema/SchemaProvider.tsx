"use client";

/**
 * Schema provider for structured data
 */

import { ReactNode, useEffect } from 'react';

interface SchemaProviderProps {
  children: ReactNode;
  schema?: any;
}

export default function SchemaProvider({ children, schema }: SchemaProviderProps) {
  useEffect(() => {
    if (schema) {
      // Add schema to page head
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(schema);
      document.head.appendChild(script);

      return () => {
        // Check if script exists before removing
        const existingScript = document.head.querySelector('script[type="application/ld+json"]');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, [schema]);

  // Return only children - schema is added via useEffect
  return <>{children}</>;
}