'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#e53e3e' }}>حدث خطأ</h1>
      <p style={{ fontSize: '1.125rem', marginBottom: '2rem', color: '#718096' }}>
        عذراً، حدث خطأ غير متوقع.
      </p>
      <button
        onClick={reset}
        style={{ 
          padding: '12px 24px', 
          backgroundColor: '#2563EB', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          fontSize: '1.125rem',
          cursor: 'pointer'
        }}
      >
        حاول مرة أخرى
      </button>
    </div>
  );
}
