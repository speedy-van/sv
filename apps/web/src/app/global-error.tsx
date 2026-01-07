'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log comprehensive error details
    console.error('Global error boundary caught:', error);
    console.error('Error digest:', error.digest);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#e53e3e' }}>حدث خطأ</h1>
          <p style={{ fontSize: '1.125rem', marginBottom: '2rem', color: '#666' }}>
            عذراً، حدث خطأ غير متوقع.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginBottom: '2rem', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>تفاصيل الخطأ</summary>
              <pre style={{ 
                backgroundColor: '#f7fafc', 
                padding: '1rem', 
                borderRadius: '5px',
                overflow: 'auto',
                fontSize: '0.875rem',
                maxHeight: '400px'
              }}>
                {error.message}
                {error.digest && `\n\nDigest: ${error.digest}`}
                {error.stack && `\n\nStack:\n${error.stack}`}
              </pre>
            </details>
          )}
          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1.125rem'
            }}
          >
            حاول مرة أخرى
          </button>
        </div>
      </body>
    </html>
  );
}
